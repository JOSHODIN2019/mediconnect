import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AgoraRTC from 'agora-rtc-sdk-ng'
import { videoService } from '@/services/videoService'

export default function VideoRoom() {
  const { appointmentId } = useParams()
  const navigate = useNavigate()

  const [phase, setPhase] = useState('connecting') // connecting | waiting | incall | ended | error
  const [errorMsg, setErrorMsg] = useState('')
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const [hasRemote, setHasRemote] = useState(false)
  const [appointment, setAppointment] = useState(null)
  const [elapsed, setElapsed] = useState(0)

  const clientRef    = useRef(null)
  const audioRef     = useRef(null)
  const videoRef     = useRef(null)
  const localElRef   = useRef(null)
  const remoteElRef  = useRef(null)
  const timerRef     = useRef(null)
  const mountedRef   = useRef(true)

  const endCall = useCallback(async () => {
    clearInterval(timerRef.current)
    try {
      videoRef.current?.stop()
      videoRef.current?.close()
      audioRef.current?.stop()
      audioRef.current?.close()
      if (clientRef.current) await clientRef.current.leave()
    } catch (_) {}
    if (mountedRef.current) setPhase('ended')
    setTimeout(() => navigate(-1), 2200)
  }, [navigate])

  useEffect(() => {
    mountedRef.current = true

    const init = async () => {
      try {
        const data = await videoService.getToken(appointmentId)
        if (!mountedRef.current) return

        setAppointment(data.appointment)
        const { token, channelName, uid, appId } = data

        if (!appId || appId === 'YOUR_AGORA_APP_ID_HERE') {
          setErrorMsg(
            'Agora App ID is not configured. Sign up at console.agora.io, create a free project, copy the App ID, and set AGORA_APP_ID in server/.env and VITE_AGORA_APP_ID in client/.env, then restart both servers.'
          )
          setPhase('error')
          return
        }

        // Create Agora RTC client
        const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
        clientRef.current = client

        // ── Subscribe helper (called both from event and from post-join scan) ──
        const subscribeRemote = async (remoteUser, mediaType) => {
          try {
            await client.subscribe(remoteUser, mediaType)
            if (mediaType === 'video') {
              // Small delay so Agora's internal video element is fully ready
              setTimeout(() => {
                if (remoteElRef.current) remoteUser.videoTrack?.play(remoteElRef.current)
              }, 100)
              if (mountedRef.current) {
                setHasRemote(true)
                setPhase('incall')
                // Idempotent timer — don't create duplicates
                if (!timerRef.current) {
                  timerRef.current = setInterval(() => setElapsed(t => t + 1), 1000)
                }
              }
            }
            if (mediaType === 'audio') {
              remoteUser.audioTrack?.play()
            }
          } catch (subErr) {
            console.warn('[VideoRoom] subscribe error:', subErr)
          }
        }

        client.on('user-published',   (user, mediaType) => subscribeRemote(user, mediaType))

        client.on('user-unpublished', (_, mediaType) => {
          if (mediaType === 'video' && mountedRef.current) {
            setHasRemote(false)
            setPhase('waiting')
            clearInterval(timerRef.current)
            timerRef.current = null
          }
        })

        client.on('user-left', () => {
          if (mountedRef.current) {
            setHasRemote(false)
            setPhase('waiting')
            clearInterval(timerRef.current)
            timerRef.current = null
            setElapsed(0)
          }
        })

        // Join channel
        await client.join(appId, channelName, token, uid)
        if (!mountedRef.current) return

        // ── Belt-and-suspenders: subscribe to users already in channel ─────
        // user-published fires for late-joiners, but if the remote user published
        // WHILE our join() was resolving, the event might have been missed.
        for (const remoteUser of client.remoteUsers) {
          if (remoteUser.hasVideo) subscribeRemote(remoteUser, 'video')
          if (remoteUser.hasAudio) subscribeRemote(remoteUser, 'audio')
        }

        // Create local tracks
        const [audio, video] = await AgoraRTC.createMicrophoneAndCameraTracks(
          { AEC: true, ANS: true },
          { encoderConfig: '360p_1' }
        )
        if (!mountedRef.current) { audio.close(); video.close(); return }

        audioRef.current = audio
        videoRef.current = video

        if (localElRef.current) video.play(localElRef.current)
        await client.publish([audio, video])
        if (mountedRef.current) setPhase(prev => prev === 'incall' ? 'incall' : 'waiting')
      } catch (err) {
        if (!mountedRef.current) return
        console.error('[VideoRoom] init error:', err)
        const isPermissionDenied =
          err?.code === 'PERMISSION_DENIED' ||
          err?.name  === 'NotAllowedError'  ||
          err?.message?.toLowerCase().includes('notallowed') ||
          err?.message?.toLowerCase().includes('permission denied')
        if (isPermissionDenied) {
          setErrorMsg(
            'Camera or microphone access was blocked.\n\n' +
            'To fix this:\n' +
            '• On Chrome/Edge: click the camera icon in the address bar and choose "Allow"\n' +
            '• On Safari (iPhone/Mac): go to Settings → Safari → Camera & Microphone → Allow\n' +
            '• On Firefox: click the blocked icon in the address bar → Allow camera and microphone\n\n' +
            'After granting permission, reload this page to try again.'
          )
        } else if (err?.response?.data?.message) {
          setErrorMsg(err.response.data.message)
        } else if (err?.message) {
          setErrorMsg(err.message)
        } else {
          setErrorMsg('Failed to start video call. Check camera/microphone permissions.')
        }
        setPhase('error')
      }
    }

    init()

    return () => {
      mountedRef.current = false
      clearInterval(timerRef.current)
      timerRef.current = null
      videoRef.current?.stop()
      videoRef.current?.close()
      audioRef.current?.stop()
      audioRef.current?.close()
      clientRef.current?.leave().catch(() => {})
    }
  }, [appointmentId])

  const toggleMic = async () => {
    if (!audioRef.current) return
    await audioRef.current.setEnabled(!micOn)
    setMicOn(v => !v)
  }

  const toggleCam = async () => {
    if (!videoRef.current) return
    await videoRef.current.setEnabled(!camOn)
    setCamOn(v => !v)
  }

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  // ── Ended screen ──────────────────────────────────────────────────────────
  if (phase === 'ended') {
    return (
      <div className="fixed inset-0 bg-neutral-950 flex items-center justify-center z-50">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-emerald-600 flex items-center justify-center mx-auto shadow-xl shadow-emerald-900/50">
            <CheckIcon />
          </div>
          <p className="text-white text-xl font-semibold">Call Ended</p>
          <p className="text-neutral-500 text-sm">Returning to appointments…</p>
        </div>
      </div>
    )
  }

  // ── Error screen ──────────────────────────────────────────────────────────
  if (phase === 'error') {
    const isPermission = errorMsg.includes('Camera or microphone access was blocked')
    return (
      <div className="fixed inset-0 bg-neutral-950 flex items-center justify-center z-50 p-6">
        <div className="text-center space-y-5 max-w-sm w-full">
          <div className="w-20 h-20 rounded-full bg-red-900/40 ring-1 ring-red-800 flex items-center justify-center mx-auto">
            <AlertIcon />
          </div>
          <div>
            <p className="text-white text-xl font-semibold mb-3">Cannot Connect</p>
            <p className="text-neutral-400 text-sm leading-relaxed whitespace-pre-line text-left">{errorMsg}</p>
          </div>
          <div className="flex gap-3 justify-center">
            {isPermission && (
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors"
              >
                Retry
              </button>
            )}
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-2.5 bg-white text-neutral-900 rounded-xl font-semibold text-sm hover:bg-neutral-100 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Main video room ───────────────────────────────────────────────────────
  const apt = appointment
  const participantLabel = apt
    ? `${apt.patient?.fullName} · Dr. ${apt.doctor?.fullName?.replace(/^Dr\.?\s*/i, '')}`
    : 'Video Consultation'

  return (
    <div className="fixed inset-0 bg-neutral-950 z-50 flex flex-col select-none">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-5 py-3 bg-black/50 backdrop-blur-md border-b border-white/[0.06] flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-blue-600/25 ring-1 ring-blue-500/30 flex items-center justify-center flex-shrink-0">
            <VideoNavIcon />
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-semibold truncate">{participantLabel}</p>
            {phase === 'connecting' && <p className="text-neutral-500 text-xs">Setting up call…</p>}
            {phase === 'waiting'    && <p className="text-amber-400 text-xs">Waiting for the other participant to join</p>}
            {phase === 'incall'     && <p className="text-emerald-400 text-xs font-mono">{fmt(elapsed)}</p>}
          </div>
        </div>
        <StatusPill phase={phase} />
      </div>

      {/* ── Video area ── */}
      <div className="flex-1 relative overflow-hidden">

        {/* Remote video — fills the area */}
        <div
          ref={remoteElRef}
          className="absolute inset-0 w-full h-full"
          style={{ background: '#080810' }}
        />

        {/* Overlay when not in call */}
        {!hasRemote && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {phase === 'connecting' ? (
              <div className="flex flex-col items-center gap-5">
                <div className="w-24 h-24 rounded-full bg-neutral-800 ring-1 ring-neutral-700 flex items-center justify-center">
                  <PersonIcon />
                </div>
                <div className="flex items-center gap-1.5">
                  <Dot delay="0ms" />
                  <Dot delay="180ms" />
                  <Dot delay="360ms" />
                </div>
                <p className="text-neutral-400 text-sm">Connecting…</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="w-24 h-24 rounded-full bg-neutral-800 ring-1 ring-neutral-700 flex items-center justify-center">
                  <PersonIcon />
                </div>
                <p className="text-neutral-300 font-medium">Waiting for participant</p>
                <p className="text-neutral-600 text-sm max-w-xs text-center leading-relaxed">
                  The other person will appear here once they join. Both parties need the same appointment link.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Local video PiP */}
        <div className="absolute bottom-5 right-5 w-[152px] h-[108px] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 bg-neutral-900">
          <div ref={localElRef} className="w-full h-full" />
          {!camOn && (
            <div className="absolute inset-0 bg-neutral-800 flex flex-col items-center justify-center gap-2">
              <CamOffSmallIcon />
              <span className="text-[10px] text-neutral-500">Camera off</span>
            </div>
          )}
          <div className="absolute bottom-1.5 left-2.5">
            <span className="text-[10px] text-white/50 font-medium">You</span>
          </div>
        </div>
      </div>

      {/* ── Controls bar ── */}
      <div className="flex items-center justify-center gap-4 py-5 px-6 bg-black/60 backdrop-blur-md border-t border-white/[0.06] flex-shrink-0">
        {/* Mic */}
        <CtrlBtn
          on={micOn}
          onClick={toggleMic}
          title={micOn ? 'Mute microphone' : 'Unmute microphone'}
          onIcon={<MicOnIcon />}
          offIcon={<MicOffIcon />}
        />
        {/* Camera */}
        <CtrlBtn
          on={camOn}
          onClick={toggleCam}
          title={camOn ? 'Turn off camera' : 'Turn on camera'}
          onIcon={<CamOnIcon />}
          offIcon={<CamOffIcon />}
        />
        {/* End call */}
        <button
          onClick={endCall}
          title="End call"
          className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 active:scale-95 flex items-center justify-center transition-all shadow-lg shadow-red-950/50"
        >
          <HangUpIcon />
        </button>
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusPill({ phase }) {
  const cfg = {
    connecting: 'bg-neutral-700/50 text-neutral-400',
    waiting:    'bg-amber-600/20 text-amber-400',
    incall:     'bg-emerald-600/20 text-emerald-400',
  }
  const label = { connecting: 'Connecting', waiting: 'Waiting', incall: 'In Call' }
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${cfg[phase] || cfg.connecting}`}>
      {phase === 'incall' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
      {label[phase] || 'Connecting'}
    </div>
  )
}

function CtrlBtn({ on, onClick, title, onIcon, offIcon }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={[
        'w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95',
        on
          ? 'bg-neutral-700 hover:bg-neutral-600 text-white'
          : 'bg-red-600/15 hover:bg-red-600/25 text-red-400 ring-1 ring-red-600/30',
      ].join(' ')}
    >
      {on ? onIcon : offIcon}
    </button>
  )
}

function Dot({ delay }) {
  return (
    <span
      className="w-2 h-2 rounded-full bg-blue-500 animate-bounce"
      style={{ animationDelay: delay }}
    />
  )
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function VideoNavIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round"><rect x="1" y="4" width="10" height="8" rx="1.5"/><path d="M11 8l4-2.5v5L11 8"/></svg>
}
function PersonIcon() {
  return <svg width="38" height="38" viewBox="0 0 38 38" fill="none" stroke="#374151" strokeWidth="1.5" strokeLinecap="round"><circle cx="19" cy="13" r="6"/><path d="M6 33c0-6 5.5-10 13-10s13 4 13 10"/></svg>
}
function MicOnIcon() {
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="7" y="2" width="6" height="10" rx="3"/><path d="M4 10a6 6 0 0012 0M10 16v2"/></svg>
}
function MicOffIcon() {
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M7 7V5a3 3 0 016 0v2M7 10a6 6 0 009.7-5.2M4 10a6 6 0 007.1 5.9M10 16v2M2 2l16 16"/></svg>
}
function CamOnIcon() {
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="1" y="5" width="13" height="10" rx="2"/><path d="M14 10l5-3v6l-5-3"/></svg>
}
function CamOffIcon() {
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M1 5a2 2 0 012-2h7.5M4.5 15H13a2 2 0 002-2v-.5M14 10l5-3v6l-5-3M2 2l16 16"/></svg>
}
function CamOffSmallIcon() {
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#6b7280" strokeWidth="1.3" strokeLinecap="round"><path d="M1 5a2 2 0 012-2h7.5M4.5 15H13a2 2 0 002-2v-.5M14 10l5-3v6l-5-3M2 2l16 16"/></svg>
}
function HangUpIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.68 13.31a16 16 0 003.41 2.6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7 2 2 0 011.72 2v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.42 19.42 0 013.43 9.78"/>
      <line x1="23" y1="1" x2="1" y2="23"/>
    </svg>
  )
}
function CheckIcon() {
  return <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M5 16l7 7 15-15"/></svg>
}
function AlertIcon() {
  return <svg width="30" height="30" viewBox="0 0 30 30" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round"><circle cx="15" cy="15" r="12"/><path d="M15 10v6M15 19v1"/></svg>
}
