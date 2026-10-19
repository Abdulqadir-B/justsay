import { useState, useRef, useCallback, useEffect } from 'react'
import { Mic, Square, Play, Pause, RotateCcw, Send, Loader2, Volume2 } from 'lucide-react'

const MAX_RECORDING_SECONDS = 15

export default function VoiceRecorder({ onSubmit, isSubmitting }) {
  const [state, setState] = useState('idle') // 'idle' | 'recording' | 'recorded'
  const [countdown, setCountdown] = useState(MAX_RECORDING_SECONDS)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackTime, setPlaybackTime] = useState(0)
  const [audioDuration, setAudioDuration] = useState(0)
  const [error, setError] = useState(null)
  const [audioLevels, setAudioLevels] = useState([0.2, 0.35, 0.5, 0.65, 0.5, 0.35, 0.25, 0.2])

  const mediaRecorderRef = useRef(null)
  const streamRef = useRef(null)
  const chunksRef = useRef([])
  const audioBlobRef = useRef(null)
  const mimeTypeRef = useRef('audio/webm')
  const audioElementRef = useRef(null)
  const countdownIntervalRef = useRef(null)
  const recordingTimeoutRef = useRef(null)
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const animFrameRef = useRef(null)

  const stopAudioAnalyser = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {})
      audioContextRef.current = null
    }
    analyserRef.current = null
  }, [])

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
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (audioElementRef.current) {
      audioElementRef.current.pause()
      audioElementRef.current = null
    }
    stopAudioAnalyser()
  }, [stopAudioAnalyser])

  useEffect(() => {
    return cleanup
  }, [cleanup])

  const stopRecording = useCallback(() => {
    stopAudioAnalyser()

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
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [stopAudioAnalyser])

  const startRecording = useCallback(async () => {
    setError(null)
    chunksRef.current = []

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Start real-time Audio Analyser for responsive waveform
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext
        if (AudioContextClass) {
          const audioCtx = new AudioContextClass()
          const source = audioCtx.createMediaStreamSource(stream)
          const analyser = audioCtx.createAnalyser()
          analyser.fftSize = 32
          analyser.smoothingTimeConstant = 0.7
          source.connect(analyser)

          audioContextRef.current = audioCtx
          analyserRef.current = analyser

          const dataArray = new Uint8Array(analyser.frequencyBinCount)
          const renderLoop = () => {
            if (!analyserRef.current) return
            analyserRef.current.getByteFrequencyData(dataArray)
            const levels = [
              Math.max(0.18, (dataArray[1] || 0) / 255),
              Math.max(0.22, (dataArray[2] || 0) / 255),
              Math.max(0.28, (dataArray[3] || 0) / 255),
              Math.max(0.35, (dataArray[4] || 0) / 255),
              Math.max(0.35, (dataArray[5] || 0) / 255),
              Math.max(0.28, (dataArray[6] || 0) / 255),
              Math.max(0.22, (dataArray[7] || 0) / 255),
              Math.max(0.18, (dataArray[8] || 0) / 255),
            ]
            setAudioLevels(levels)
            animFrameRef.current = requestAnimationFrame(renderLoop)
          }
          renderLoop()
        }
      } catch {
        // Fallback gracefully if AudioContext is blocked
      }

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

        // Measure audio duration
        const tempAudio = new Audio(URL.createObjectURL(blob))
        tempAudio.onloadedmetadata = () => {
          setAudioDuration(tempAudio.duration || MAX_RECORDING_SECONDS)
        }
      }

      mediaRecorder.start()
      setState('recording')
      setCountdown(MAX_RECORDING_SECONDS)

      let remaining = MAX_RECORDING_SECONDS
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
      }, MAX_RECORDING_SECONDS * 1000)
    } catch {
      setError('Microphone access denied. Please enable microphone permissions in your browser to record.')
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

    audio.ontimeupdate = () => {
      setPlaybackTime(audio.currentTime)
    }

    audio.onended = () => {
      setIsPlaying(false)
      setPlaybackTime(0)
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
    setPlaybackTime(0)
    setAudioDuration(0)
    setState('idle')
    setCountdown(MAX_RECORDING_SECONDS)
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!audioBlobRef.current) return
    const cleanType = (mimeTypeRef.current || 'audio/webm').split(';')[0].trim()
    await onSubmit(audioBlobRef.current, cleanType)
  }, [onSubmit])

  return (
    <div className="flex flex-col items-center">
      
      {/* ─── STATE 1: IDLE ─── */}
      {state === 'idle' && (
        <div className="flex flex-col items-center gap-5">
          <button
            onClick={startRecording}
            disabled={isSubmitting}
            aria-label="Tap to start recording voice review"
            className="group relative flex h-24 w-24 items-center justify-center rounded-full bg-zinc-100 text-zinc-950 transition-all duration-200 hover:bg-white hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 focus:ring-offset-zinc-950 shadow-xl cursor-pointer"
          >
            {/* Subtle inner tactile ring */}
            <span className="absolute inset-2 rounded-full border border-zinc-300 pointer-events-none transition-transform group-hover:scale-95" />
            <Mic className="h-9 w-9 relative z-10 transition-transform group-hover:scale-110" />
          </button>

          <div className="text-center">
            <p className="text-sm font-medium text-white">Tap to Start Recording</p>
            <p className="text-xs text-zinc-400 mt-0.5">Speak naturally for up to 15 seconds</p>
          </div>
        </div>
      )}

      {/* ─── STATE 2: RECORDING ─── */}
      {state === 'recording' && (
        <div className="flex flex-col items-center gap-5 w-full max-w-xs animate-fade-in">
          {/* Finish Button */}
          <button
            onClick={stopRecording}
            aria-label="Finish recording"
            className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-full bg-rose-600 text-white transition-all hover:bg-rose-500 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 focus:ring-offset-zinc-950 shadow-md cursor-pointer"
          >
            <Square className="h-5 w-5 fill-current" />
            <span className="text-[10px] font-semibold tracking-wide uppercase">Finish</span>
          </button>

          {/* Countdown & Status */}
          <div className="text-center">
            <span className="text-3xl font-semibold tabular-nums text-white">
              {countdown}s
            </span>
            <p className="text-xs text-zinc-400 mt-0.5">Tap Finish when done speaking</p>
          </div>

          {/* Real-time Voice Amplitude Waveform */}
          <div className="flex items-center justify-center gap-1.5 h-12 w-full py-2 px-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
            {audioLevels.map((lvl, i) => (
              <div
                key={i}
                className="w-1.5 rounded-full bg-rose-500 transition-all duration-75"
                style={{
                  height: `${Math.round(lvl * 100)}%`,
                  minHeight: '6px',
                  maxHeight: '36px',
                }}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-xs font-medium text-rose-400">Listening to your review</span>
          </div>
        </div>
      )}

      {/* ─── STATE 3: RECORDED & PREVIEW ─── */}
      {state === 'recorded' && !isSubmitting && (
        <div className="flex flex-col items-center gap-6 w-full max-w-sm animate-fade-in">
          {/* Audio Player Card */}
          <div className="w-full rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-zinc-300">
                <Volume2 className="h-4 w-4 text-zinc-400" />
                <span className="font-medium">Audio Preview</span>
              </div>
              <span className="text-xs font-mono text-zinc-400">
                {playbackTime.toFixed(1)}s / {(audioDuration || MAX_RECORDING_SECONDS).toFixed(1)}s
              </span>
            </div>

            {/* Playback Progress Bar */}
            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-zinc-200 transition-all duration-100"
                style={{
                  width: `${audioDuration > 0 ? (playbackTime / audioDuration) * 100 : 0}%`,
                }}
              />
            </div>

            <div className="flex justify-center pt-1">
              <button
                onClick={handlePlayPause}
                aria-label={isPlaying ? 'Pause review recording' : 'Play review recording'}
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                {isPlaying ? (
                  <><Pause className="h-3.5 w-3.5 fill-current" /> Pause</>
                ) : (
                  <><Play className="h-3.5 w-3.5 fill-current" /> Listen</>
                )}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 w-full">
            <button
              onClick={handleRerecord}
              aria-label="Re-record your review"
              className="btn-secondary flex-1 py-2.5 flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Re-record</span>
            </button>
            <button
              onClick={handleSubmit}
              aria-label="Submit your review"
              className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="h-4 w-4" />
              <span>Submit Review</span>
            </button>
          </div>
        </div>
      )}

      {/* ─── STATE 4: SUBMITTING / AI PROCESSING ─── */}
      {isSubmitting && (
        <div className="flex flex-col items-center gap-4 py-8 animate-fade-in text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800">
            <Loader2 className="h-6 w-6 text-zinc-300 animate-spin" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">Processing your feedback</p>
            <p className="text-xs text-zinc-400 mt-1">Transcribing speech and analyzing sentiment...</p>
          </div>
        </div>
      )}

      {/* Error Notice */}
      {error && (
        <div className="mt-4 w-full max-w-sm rounded-lg border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-300 animate-fade-in text-center">
          {error}
        </div>
      )}
    </div>
  )
}
