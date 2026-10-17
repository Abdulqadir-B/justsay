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
    <div className="flex flex-col items-center gap-8">
      {/* Mic Button */}
      {state === 'idle' && (
        <button
          onClick={startRecording}
          disabled={isSubmitting}
          aria-label="Start recording your review"
          className="relative flex h-20 w-20 items-center justify-center rounded-full bg-accent-purple transition-all duration-300 hover:bg-accent-indigo focus:outline-none focus:ring-2 focus:ring-accent-purple focus:ring-offset-2 focus:ring-offset-surface animate-pulse-glow"
        >
          <Mic className="h-8 w-8 text-white" />
        </button>
      )}

      {/* Recording State */}
      {state === 'recording' && (
        <div className="flex flex-col items-center gap-6">
          <button
            onClick={stopRecording}
            aria-label="Stop recording"
            className="relative flex h-20 w-20 items-center justify-center rounded-full bg-red-500 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-surface animate-pulse-record"
          >
            <Square className="h-6 w-6 text-white" />
          </button>

          <div className="text-center">
            <span className="text-4xl font-bold tabular-nums text-white">
              {countdown}
            </span>
            <p className="text-sm text-gray-400 mt-1">seconds remaining</p>
          </div>

          <div className="flex items-center gap-1 h-12">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="w-1 rounded-full bg-red-400 animate-waveform"
                style={{
                  height: '100%',
                  animationDelay: `${i * 0.08}s`,
                  animationDuration: `${0.4 + Math.random() * 0.4}s`,
                }}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-medium text-red-400">Recording...</span>
          </div>
        </div>
      )}

      {/* Recorded State */}
      {state === 'recorded' && !isSubmitting && (
        <div className="flex flex-col items-center gap-6 animate-fade-in">
          <div className="flex items-center gap-4">
            <button
              onClick={handlePlayPause}
              aria-label={isPlaying ? 'Pause playback' : 'Play recording'}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-elevated border border-surface-border text-white transition-all hover:bg-surface-card focus:outline-none focus:ring-2 focus:ring-accent-purple"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" />
              )}
            </button>
            <span className="text-sm text-gray-400">Listen to your recording</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRerecord}
              aria-label="Re-record your review"
              className="flex items-center gap-2 rounded-xl border border-surface-border bg-surface-card px-5 py-3 text-sm font-medium text-gray-300 transition-all hover:bg-surface-elevated hover:text-white focus:outline-none focus:ring-2 focus:ring-accent-purple"
            >
              <RotateCcw className="h-4 w-4" />
              Re-record
            </button>
            <button
              onClick={handleSubmit}
              aria-label="Submit your review"
              className="flex items-center gap-2 rounded-xl bg-accent-purple px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-accent-indigo focus:outline-none focus:ring-2 focus:ring-accent-purple focus:ring-offset-2 focus:ring-offset-surface"
            >
              <Send className="h-4 w-4" />
              Submit Review
            </button>
          </div>
        </div>
      )}

      {/* Submitting State */}
      {isSubmitting && (
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <Loader2 className="h-10 w-10 text-accent-purple animate-spin" />
          <p className="text-sm font-medium text-gray-300">Analyzing your review...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400 animate-fade-in">
          {error}
        </div>
      )}
    </div>
  )
}
