import { useState, useRef, useCallback, useEffect } from 'react'
import { Mic, Square, Play, Pause, RotateCcw, Send, Loader2 } from 'lucide-react'

export default function VoiceRecorder({ onSubmit, isSubmitting }) {
  const [state, setState] = useState('idle') // 'idle' | 'recording' | 'recorded'
  const [countdown, setCountdown] = useState(5)
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState(null)

  const mediaRecorderRef = useRef(null)
  const streamRef = useRef(null)
  const chunksRef = useRef([])
  const audioBlobRef = useRef(null)
  const mimeTypeRef = useRef('audio/webm')
  const audioElementRef = useRef(null)
  const countdownIntervalRef = useRef(null)
  const recordingTimeoutRef = useRef(null)

  const cleanup = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current)
      recordingTimeoutRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (audioElementRef.current) {
      audioElementRef.current.pause()
      audioElementRef.current = null
    }
  }, [])

  useEffect(() => {
    return cleanup
  }, [cleanup])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current)
      recordingTimeoutRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }, [])

  const startRecording = useCallback(async () => {
    setError(null)
    chunksRef.current = []

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      let selectedMimeType = 'audio/webm'
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        selectedMimeType = 'audio/webm;codecs=opus'
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        selectedMimeType = 'audio/webm'
      }
      mimeTypeRef.current = selectedMimeType

      const mediaRecorder = new MediaRecorder(stream, { mimeType: selectedMimeType })
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: selectedMimeType })
        audioBlobRef.current = blob
        setState('recorded')
      }

      mediaRecorder.start()
      setState('recording')
      setCountdown(5)

      let remaining = 5
      countdownIntervalRef.current = setInterval(() => {
        remaining -= 1
        setCountdown(remaining)
        if (remaining <= 0) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current)
          }
        }
      }, 1000)

      recordingTimeoutRef.current = setTimeout(() => {
        stopRecording()
      }, 5000)
    } catch {
      setError('Microphone access denied. Please allow microphone access and try again.')
      setState('idle')
    }
  }, [stopRecording])

  const handlePlayPause = useCallback(() => {
    if (!audioBlobRef.current) return

    if (isPlaying && audioElementRef.current) {
      audioElementRef.current.pause()
      setIsPlaying(false)
      return
    }

    const url = URL.createObjectURL(audioBlobRef.current)
    const audio = new Audio(url)
    audioElementRef.current = audio

    audio.onended = () => {
      setIsPlaying(false)
      URL.revokeObjectURL(url)
    }

    audio.play()
    setIsPlaying(true)
  }, [isPlaying])

  const handleRerecord = useCallback(() => {
    audioBlobRef.current = null
    if (audioElementRef.current) {
      audioElementRef.current.pause()
      audioElementRef.current = null
    }
    setIsPlaying(false)
    setState('idle')
    setCountdown(5)
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!audioBlobRef.current) return
    const cleanType = (mimeTypeRef.current || 'audio/webm').split(';')[0].trim()
    await onSubmit(audioBlobRef.current, cleanType)
  }, [onSubmit])

  return (
    <div className="flex flex-col items-center gap-7">
      {/* Mic Button */}
      {state === 'idle' && (
        <button
          onClick={startRecording}
          disabled={isSubmitting}
          aria-label="Start recording your review"
          className="relative flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100 text-zinc-950 transition-all hover:bg-white hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 focus:ring-offset-zinc-950 shadow-lg"
        >
          <Mic className="h-8 w-8" />
        </button>
      )}

      {/* Recording State */}
      {state === 'recording' && (
        <div className="flex flex-col items-center gap-6">
          <button
            onClick={stopRecording}
            aria-label="Stop recording"
            className="relative flex h-20 w-20 items-center justify-center rounded-full bg-rose-600 text-white transition-all hover:bg-rose-500 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 focus:ring-offset-zinc-950 shadow-md"
          >
            <Square className="h-6 w-6 fill-current" />
          </button>

          <div className="text-center">
            <span className="text-4xl font-semibold tabular-nums text-white">
              {countdown}s
            </span>
            <p className="text-xs text-zinc-400 mt-1">Recording (max 5 seconds)</p>
          </div>

          <div className="flex items-center gap-1.5 h-10">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="w-1 rounded-full bg-rose-500/80 animate-waveform"
                style={{
                  height: '100%',
                  animationDelay: `${i * 0.08}s`,
                  animationDuration: `${0.4 + (i % 3) * 0.2}s`,
                }}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-xs font-medium text-rose-400">Listening to your voice...</span>
          </div>
        </div>
      )}

      {/* Recorded State */}
      {state === 'recorded' && !isSubmitting && (
        <div className="flex flex-col items-center gap-6 animate-fade-in">
          <div className="flex items-center gap-3">
            <button
              onClick={handlePlayPause}
              aria-label={isPlaying ? 'Pause playback' : 'Play recording'}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 border border-zinc-750 text-zinc-200 transition-colors hover:bg-zinc-800 hover:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4 ml-0.5 fill-current" />
              )}
            </button>
            <span className="text-xs text-zinc-400">Preview recorded audio</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleRerecord}
              aria-label="Re-record your review"
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 px-4 py-2.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Re-record
            </button>
            <button
              onClick={handleSubmit}
              aria-label="Submit your review"
              className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 px-4 py-2.5 text-xs font-semibold text-zinc-950 transition-colors hover:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 focus:ring-offset-zinc-950"
            >
              <Send className="h-3.5 w-3.5" />
              Submit Review
            </button>
          </div>
        </div>
      )}

      {/* Submitting State */}
      {isSubmitting && (
        <div className="flex flex-col items-center gap-3 animate-fade-in py-4">
          <Loader2 className="h-8 w-8 text-zinc-300 animate-spin" />
          <p className="text-xs font-medium text-zinc-400">Processing audio & transcription...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-300 animate-fade-in">
          {error}
        </div>
      )}
    </div>
  )
}
