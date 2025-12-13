import { useEffect, useRef, useState } from "react"

// ✅ Definimos la interfaz del estado
interface CallState {
  isInCall: boolean
  isCalling: boolean
  incomingCall: { callerId: string; callerName: string; sdp: RTCSessionDescriptionInit } | null
  isMuted: boolean
  isCameraOff: boolean
  isScreenSharing: boolean
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  callDuration: number
  currentContact: string
}

export function useVideoCall(prueba: CallState) {
  // ✅ Usamos el tipo explícito
  const [callState, setCallState] = useState<prueba>({
    isInCall: false,
    isCalling: false,
    incomingCall: null,
    isMuted: false,
    isCameraOff: false,
    isScreenSharing: false,
    localStream: null,
    remoteStream: null,
    callDuration: 0,
    currentContact: "",
  })

  const pc = useRef<RTCPeerConnection | null>(null)
  const socket = useRef<WebSocket | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const localStreamRef = useRef<MediaStream | null>(null)
  const remoteStreamRef = useRef<MediaStream | null>(null)

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}")
  const userId = currentUser.id
  const token = currentUser.token

  // --- Conectar WebSocket ---
  useEffect(() => {
    if (!userId) return
    const wsUrl = `ws://localhost:8000/ws/call/${userId}`
    const ws = new WebSocket(wsUrl)
    socket.current = ws

    ws.onmessage = async (event) => {
      const msg = JSON.parse(event.data)
      if (msg.type === "incoming_call") {
        setCallState((s) => ({
          ...s,
          incomingCall: { callerId: msg.caller_id, callerName: msg.caller_name, sdp: msg.sdp },
        }))
      } else if (msg.type === "offer") {
        await handleOffer(msg)
      } else if (msg.type === "answer") {
        await pc.current?.setRemoteDescription(new RTCSessionDescription(msg.sdp))
      } else if (msg.type === "ice-candidate") {
        await pc.current?.addIceCandidate(new RTCIceCandidate(msg.candidate))
      } else if (msg.type === "end_call") {
        endCall()
      }
    }

    ws.onclose = () => console.log("🔌 WebSocket cerrado")

    return () => {
      ws.close()
    }
  }, [userId])

  // --- Iniciar llamada ---
  const startCall = async (targetId: string, targetName: string, isVideo: boolean) => {
    pc.current = createPeerConnection(targetId)

    const localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: isVideo,
    })

    localStreamRef.current = localStream
    setCallState((s) => ({
      ...s,
      localStream,
      isCalling: true,
      currentContact: targetName,
    }))

    localStream.getTracks().forEach((track) => pc.current?.addTrack(track, localStream))

    const offer = await pc.current.createOffer()
    await pc.current.setLocalDescription(offer)

    socket.current?.send(
      JSON.stringify({
        type: "offer",
        target: targetId,
        senderName: currentUser.nombre,
        sdp: offer,
      })
    )
  }

  // --- Aceptar llamada ---
  const answerCall = async () => {
    if (!callState.incomingCall) return
    const { callerId, callerName, sdp } = callState.incomingCall

    pc.current = createPeerConnection(callerId)

    const localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    })

    localStreamRef.current = localStream
    setCallState((s) => ({
      ...s,
      isInCall: true,
      incomingCall: null,
      currentContact: callerName,
      localStream,
    }))

    localStream.getTracks().forEach((track) => pc.current?.addTrack(track, localStream))

    await pc.current.setRemoteDescription(new RTCSessionDescription(sdp))
    const answer = await pc.current.createAnswer()
    await pc.current.setLocalDescription(answer)

    socket.current?.send(
      JSON.stringify({
        type: "answer",
        target: callerId,
        sdp: answer,
      })
    )
  }

  const handleOffer = async (msg: any) => {
    pc.current = createPeerConnection(msg.caller_id)

    const localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
    localStreamRef.current = localStream
    setCallState((s) => ({
      ...s,
      localStream,
      isInCall: true,
      currentContact: msg.caller_name,
    }))
    localStream.getTracks().forEach((track) => pc.current?.addTrack(track, localStream))

    await pc.current.setRemoteDescription(new RTCSessionDescription(msg.sdp))
    const answer = await pc.current.createAnswer()
    await pc.current.setLocalDescription(answer)

    socket.current?.send(
      JSON.stringify({
        type: "answer",
        target: msg.caller_id,
        sdp: answer,
      })
    )
  }

  // --- Crear conexión RTCPeerConnection ---
  const createPeerConnection = (targetId: string) => {
    const pcInstance = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    })

    pcInstance.onicecandidate = (event) => {
      if (event.candidate) {
        socket.current?.send(
          JSON.stringify({
            type: "ice-candidate",
            target: targetId,
            candidate: event.candidate,
          })
        )
      }
    }

    pcInstance.ontrack = (event) => {
      if (!remoteStreamRef.current) {
        remoteStreamRef.current = new MediaStream()
      }
      remoteStreamRef.current.addTrack(event.track)
      setCallState((s) => ({ ...s, remoteStream: remoteStreamRef.current }))
    }

    return pcInstance
  }

  // --- Compartir pantalla ---
  const shareScreen = async () => {
    if (!pc.current) return
    if (!callState.isScreenSharing) {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true })
      const screenTrack = displayStream.getTracks()[0]
      const sender = pc.current.getSenders().find((s) => s.track?.kind === "video")
      sender?.replaceTrack(screenTrack)
      setCallState((s) => ({ ...s, isScreenSharing: true }))
      screenTrack.onended = () => stopScreenShare()
    } else {
      stopScreenShare()
    }
  }

  const stopScreenShare = async () => {
    const cameraStream = localStreamRef.current
    const sender = pc.current?.getSenders().find((s) => s.track?.kind === "video")
    const cameraTrack = cameraStream?.getVideoTracks()[0]
    if (cameraTrack && sender) sender.replaceTrack(cameraTrack)
    setCallState((s) => ({ ...s, isScreenSharing: false }))
  }

  // --- Finalizar llamada ---
  const endCall = () => {
    pc.current?.close()
    localStreamRef.current?.getTracks().forEach((t) => t.stop())
    remoteStreamRef.current?.getTracks().forEach((t) => t.stop())
    setCallState((s) => ({
      ...s,
      isInCall: false,
      isCalling: false,
      remoteStream: null,
      localStream: null,
      callDuration: 0,
    }))
  }

  const handleAction = (action: string) => {
    switch (action) {
      case "mute":
        if (localStreamRef.current) {
          const audioTrack = localStreamRef.current.getAudioTracks()[0]
          if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled
            setCallState((s) => ({ ...s, isMuted: !audioTrack.enabled }))
          }
        }
        break
      case "camera":
        if (localStreamRef.current) {
          const videoTrack = localStreamRef.current.getVideoTracks()[0]
          if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled
            setCallState((s) => ({ ...s, isCameraOff: !videoTrack.enabled }))
          }
        }
        break
      case "screen-share":
        shareScreen()
        break
      case "hang-up":
        endCall()
        break
      case "answer":
        answerCall()
        break
      case "decline":
        setCallState((s) => ({ ...s, incomingCall: null }))
        break
    }
  }

  return { callState, startCall, handleAction }
}
