// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai@0.21.0'

const ANALYSIS_PROMPT = `You are an AI that analyzes customer voice reviews for local businesses.

Analyze the following audio recording and return a JSON object with these exact fields:
- transcript: string — full verbatim transcription of what was said
- sentiment: "positive" | "neutral" | "negative"
- sentiment_score: number between 0.0 (most negative) and 1.0 (most positive)
- keywords: string[] — 3 to 6 most important keywords or short phrases from the review
- star_rating: integer from 1 to 5 — inferred from the overall sentiment and tone

Rules:
- If audio is inaudible, empty, or contains no meaningful speech, return sentiment: "neutral", score: 0.5, empty keywords, star_rating: 3, transcript: "[No speech detected]"
- Return ONLY valid JSON. No explanation. No markdown.`

const VALID_SENTIMENTS = ['positive', 'neutral', 'negative']

function validateResult(data) {
  const transcript = typeof data.transcript === 'string' ? data.transcript : '[No speech detected]'
  const sentimentRaw = typeof data.sentiment === 'string' ? data.sentiment : 'neutral'
  const sentiment = VALID_SENTIMENTS.includes(sentimentRaw) ? sentimentRaw : 'neutral'
  const sentiment_score = typeof data.sentiment_score === 'number'
    ? Math.max(0, Math.min(1, data.sentiment_score))
    : 0.5
  const keywords = Array.isArray(data.keywords)
    ? data.keywords.filter(k => typeof k === 'string').slice(0, 6)
    : []
  const star_rating = typeof data.star_rating === 'number'
    ? Math.max(1, Math.min(5, Math.round(data.star_rating)))
    : 3

  return { transcript, sentiment, sentiment_score, keywords, star_rating }
}

async function analyzeAudio(audioBase64, mimeType) {
  const apiKey = Deno.env.get('GEMINI_API_KEY')
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured')

  const genAI = new GoogleGenerativeAI(apiKey)
  const cleanMimeType = (mimeType || 'audio/webm').split(';')[0].trim()
  const audioPart = { inlineData: { data: audioBase64, mimeType: cleanMimeType } }

  let modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest']

  try {
    const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
    const listData = await listRes.json()
    if (listData?.models && Array.isArray(listData.models)) {
      const activeGenModels = listData.models
        .filter((m) => {
          const name = (m.name || '').toLowerCase()
          return (
            m.supportedGenerationMethods?.includes('generateContent') &&
            !name.includes('tts') &&
            !name.includes('embed') &&
            !name.includes('imagen')
          )
        })
        .map((m) => m.name.replace('models/', ''))

      if (activeGenModels.length > 0) {
        const preferred = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.5-pro', 'gemini-2.0-flash-exp']
        const matched = preferred.filter((p) => activeGenModels.includes(p))
        const remaining = activeGenModels.filter((m) => !matched.includes(m))
        modelsToTry = [...matched, ...remaining]
      }
    }
  } catch (err) {
    console.warn('Could not list models, using fallback list:', err)
  }

  let lastError = null

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName })
      const result = await model.generateContent([ANALYSIS_PROMPT, audioPart])
      const text = result.response.text()
      const cleaned = text
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim()
      const parsed = JSON.parse(cleaned)
      return validateResult(parsed)
    } catch (error) {
      lastError = error
      const msg = error?.message ?? ''
      const isQuota = msg.includes('429') || msg.includes('quota')
      const isNotFound = msg.includes('404') || msg.includes('not found')
      const isModality = msg.includes('modality') || msg.includes('Audio input')
      if (!isQuota && !isNotFound && !isModality) break
    }
  }

  throw lastError ?? new Error('Gemini analysis failed — all models exhausted')
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { audioBase64, mimeType, businessId } = body

    if (!audioBase64 || !mimeType || !businessId) {
      return Response.json(
        { success: false, error: 'Missing required fields: audioBase64, mimeType, businessId' },
        { status: 400, headers: corsHeaders }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    )

    // Verify business exists
    const { data: business, error: bizError } = await supabase
      .from('businesses')
      .select('id')
      .eq('id', businessId)
      .single()

    if (bizError || !business) {
      return Response.json(
        { success: false, error: 'Business not found' },
        { status: 404, headers: corsHeaders }
      )
    }

    // Analyze audio with Gemini
    let analysisResult
    try {
      analysisResult = await analyzeAudio(audioBase64, mimeType)
    } catch (error) {
      console.error('AI processing failed:', error)
      return Response.json(
        { success: false, error: `AI processing failed: ${error?.message || error}` },
        { status: 502, headers: corsHeaders }
      )
    }

    // Insert review
    const { data: review, error: insertError } = await supabase
      .from('reviews')
      .insert({
        business_id: businessId,
        transcript: analysisResult.transcript,
        sentiment: analysisResult.sentiment,
        sentiment_score: analysisResult.sentiment_score,
        keywords: analysisResult.keywords,
        star_rating: analysisResult.star_rating,
      })
      .select('id')
      .single()

    if (insertError || !review) {
      return Response.json(
        { success: false, error: 'Failed to save review' },
        { status: 500, headers: corsHeaders }
      )
    }

    return Response.json(
      { success: true, reviewId: review.id },
      { headers: corsHeaders }
    )
  } catch (error) {
    return Response.json(
      { success: false, error: error?.message ?? 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
})
