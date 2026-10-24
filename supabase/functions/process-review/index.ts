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

// In-memory cache for available models to avoid repeated 300-600ms network lookups on warm requests
let cachedModels = null

async function getSupportedModels(apiKey) {
  if (cachedModels && cachedModels.length > 0) {
    return cachedModels
  }

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
            !name.includes('imagen') &&
            !name.includes('gemma') && // Gemma text models do not support audio input
            !name.includes('2.5-flash') && // Deprecated by Google
            !name.includes('2.5-pro') // Deprecated by Google
          )
        })
        .map((m) => m.name.replace('models/', ''))

      if (activeGenModels.length > 0) {
        console.log('Available Gemini models for account:', activeGenModels)
        const preferred = [
          'gemini-flash-lite-latest',
          'gemini-3.5-flash-lite',
          'gemini-3.1-flash-lite',
          'gemini-3.8-flash',
          'gemini-3-flash-preview',
          'gemini-flash-latest',
        ]
        const matched = preferred.filter((p) => activeGenModels.includes(p))
        const remaining = activeGenModels.filter((m) => !matched.includes(m))
        cachedModels = [...matched, ...remaining]
        return cachedModels
      }
    }
  } catch (err) {
    console.warn('Could not query model list, using fallback list:', err)
  }

  return [
    'gemini-flash-lite-latest',
    'gemini-3.5-flash-lite',
    'gemini-3.1-flash-lite',
    'gemini-3.8-flash',
    'gemini-3-flash-preview',
    'gemini-flash-latest',
  ]
}

async function analyzeAudio(audioBase64, mimeType) {
  const tStart = Date.now()
  const apiKey = Deno.env.get('GEMINI_API_KEY')
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured')

  const genAI = new GoogleGenerativeAI(apiKey)
  const cleanMimeType = (mimeType || 'audio/webm').split(';')[0].trim()
  const audioPart = { inlineData: { data: audioBase64, mimeType: cleanMimeType } }

  const modelsToTry = await getSupportedModels(apiKey)
  let lastError = null
  const attempts = []

  for (const modelName of modelsToTry) {
    const modelStart = Date.now()
    let timeoutId = null
    try {
      console.log(`[process-review] Attempting model: ${modelName}`)
      const model = genAI.getGenerativeModel({ model: modelName })

      // Enforce a strict 7-second timeout race per model to prevent Google queue hangs
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`Timeout: ${modelName} exceeded 7000ms latency ceiling`))
        }, 7000)
      })

      const generatePromise = model.generateContent([ANALYSIS_PROMPT, audioPart])
      const result = await Promise.race([generatePromise, timeoutPromise])
      if (timeoutId) clearTimeout(timeoutId)

      const text = result.response.text()
      const cleaned = text
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim()
      const parsed = JSON.parse(cleaned)
      const data = validateResult(parsed)
      const durationMs = Date.now() - modelStart
      console.log(`[process-review] Succeeded with ${modelName} in ${durationMs}ms`)
      return {
        ...data,
        _modelUsed: modelName,
        _modelDurationMs: durationMs,
        _totalAiMs: Date.now() - tStart,
        _attempts: attempts,
      }
    } catch (error) {
      if (timeoutId) clearTimeout(timeoutId)
      lastError = error
      const durationMs = Date.now() - modelStart
      console.warn(`[process-review] Model ${modelName} failed after ${durationMs}ms:`, error?.message ?? error)
      attempts.push({ model: modelName, durationMs, error: error?.message ?? String(error) })
      // Try next model in list without hanging
    }
  }

  const finalError = lastError ?? new Error('Gemini analysis failed — all models exhausted')
  finalError._attempts = attempts
  throw finalError
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
    const serverStart = Date.now()
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

    const forwardedFor = req.headers.get('x-forwarded-for')
    const clientIp = forwardedFor?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || 'unknown'
    const { data: rateLimitData, error: rateLimitError } = await supabase.rpc(
      'consume_rate_limit',
      {
        p_bucket_key: `process-review:${clientIp}`,
        p_limit: 5,
        p_window_seconds: 3600,
      }
    )

    if (rateLimitError) {
      console.error('Rate limiter failed:', rateLimitError)
      return Response.json(
        { success: false, error: 'Review service is temporarily unavailable. Please try again.' },
        { status: 503, headers: corsHeaders }
      )
    }

    const rateLimit = rateLimitData?.[0]
    if (!rateLimit?.allowed) {
      const retryAfter = rateLimit?.retry_after_seconds || 3600
      return Response.json(
        { success: false, error: 'Too many review submissions. Please try again later.' },
        {
          status: 429,
          headers: { ...corsHeaders, 'Retry-After': String(retryAfter) },
        }
      )
    }

    // Run business verification and Gemini AI audio analysis concurrently
    const businessCheckPromise = supabase
      .from('businesses')
      .select('id')
      .eq('id', businessId)
      .single()

    const aiAnalysisPromise = analyzeAudio(audioBase64, mimeType)

    const [bizResult, aiResult] = await Promise.allSettled([
      businessCheckPromise,
      aiAnalysisPromise,
    ])

    if (bizResult.status === 'rejected' || bizResult.value.error || !bizResult.value.data) {
      return Response.json(
        { success: false, error: 'Business not found' },
        { status: 404, headers: corsHeaders }
      )
    }

    if (aiResult.status === 'rejected') {
      const error = aiResult.reason
      console.error('AI processing failed:', error)
      return Response.json(
        {
          success: false,
          error: error?.message || 'Could not analyze voice note. Please try again.',
          attempts: error?._attempts || [],
        },
        { status: 502, headers: corsHeaders }
      )
    }

    const analysisResult = aiResult.value

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
      {
        success: true,
        reviewId: review.id,
        timings: {
          serverTotalMs: Date.now() - serverStart,
          modelUsed: analysisResult._modelUsed,
          modelDurationMs: analysisResult._modelDurationMs,
          totalAiMs: analysisResult._totalAiMs,
          attempts: analysisResult._attempts,
          availableModels: cachedModels,
        },
      },
      { headers: corsHeaders }
    )
  } catch (error) {
    return Response.json(
      { success: false, error: error?.message ?? 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
})
