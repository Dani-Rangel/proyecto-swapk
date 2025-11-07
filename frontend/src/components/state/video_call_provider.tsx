// components/state/video_call_provider.tsx
"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";

interface IncomingCallData {
  callerId: string;
  callerName: string;
}

interface CallState {
  isInCall: boolean;
  isMuted: boolean;
  isCameraOff: boolean;
  isRecording: boolean;
  isScreenSharing: boolean;
  currentContact: string | null;
  callDuration: number;
  callerId: string | null;
  targetId: string | null;
  connection: RTCPeerConnection | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  incomingCall: IncomingCallData | null;
}

type CallAction = "mute" | "camera" | "record" | "screen-share" | "hang-up" | "answer" | "decline";

interface VideoCallContextType {
  callState: CallState;
  startCall: (targetId: string, targetName: string, isVideo: boolean) => Promise<void>;
  handleAction: (action: CallAction) => void;
}

const VideoCallContext = createContext<VideoCallContextType | null>(null);

export function VideoCallProvider({ children }: { children: React.ReactNode }) {
  const wsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const offerRef = useRef<any>(null);
  const intervalRef = useRef<any>(null);

  const [callState, setCallState] = useState<CallState>({
    isInCall: false,
    isMuted: false,
    isCameraOff: false,
    isRecording: false,
    isScreenSharing: false,
    currentContact: null,
    callDuration: 0,
    callerId: null,
    targetId: null,
    connection: null,
    localStream: null,
    remoteStream: null,
    incomingCall: null,
  });

  /** Obtener datos del usuario actual desde localStorage */
  const getUserData = () => {
    if (typeof window === "undefined") return { token: null, userId: null, name: null };
    const userData = localStorage.getItem("user");
    if (!userData) return { token: null, userId: null, name: null };
    try {
      const parsed = JSON.parse(userData);
      const name = parsed.name || parsed.username || parsed.fullName || parsed.nombre || null;
      return { token: parsed.token, userId: String(parsed.id), name };
    } catch {
      return { token: null, userId: null, name: null };
    }
  };

  /** Obtener media stream */
  const getMediaStream = async (forceVideo = false) => {
    try {
      const constraints: MediaStreamConstraints = {
        video: forceVideo 
          ? { width: { ideal: 640 }, height: { ideal: 480 } } 
          : false,
        audio: true,
      };

      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
      try {
        return await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      } catch {
        return new MediaStream();
      }
    }
  };
  
  // Compartir pantalla - versión corregida
  const toggleScreenShare = async () => {
    if (callState.isScreenSharing) {
      if (pcRef.current) {
        const screenSender = pcRef.current.getSenders().find(
          sender => (sender.track as any)?.customLabel === "screen"
        );
        if (screenSender) {
          screenSender.track?.stop();
          pcRef.current.removeTrack(screenSender);
        }
      }
      if (localStreamRef.current) {
        const screenTrack = localStreamRef.current.getTracks().find(
          track => (track as any)?.customLabel === "screen"
        );
        if (screenTrack) {
          localStreamRef.current.removeTrack(screenTrack);
        }
      }
      setCallState(prev => ({ ...prev, isScreenSharing: false }));
      return;
    }

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      const screenTrack = screenStream.getVideoTracks()[0];
      (screenTrack as any).customLabel = "screen";

      if (pcRef.current && localStreamRef.current) {
        localStreamRef.current.addTrack(screenTrack);
        pcRef.current.addTrack(screenTrack, localStreamRef.current);

        const offer = await pcRef.current.createOffer();
        await pcRef.current.setLocalDescription(offer);
        wsRef.current?.send(
          JSON.stringify({
            type: "offer",
            target: callState.targetId,
            sdp: offer.sdp,
          })
        );
      }

      screenTrack.onended = () => {
        if (localStreamRef.current) {
          localStreamRef.current.removeTrack(screenTrack);
        }
        if (pcRef.current) {
          const sender = pcRef.current.getSenders().find(s => s.track === screenTrack);
          sender?.track?.stop();
          pcRef.current.removeTrack(sender!);
        }
        setCallState(prev => ({ ...prev, isScreenSharing: false }));
      };

      setCallState(prev => ({ ...prev, isScreenSharing: true }));
    } catch (err) {
      // Fallback sin audio
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });
        const screenTrack = screenStream.getVideoTracks()[0];
        (screenTrack as any).customLabel = "screen";

        if (pcRef.current && localStreamRef.current) {
          localStreamRef.current.addTrack(screenTrack);
          pcRef.current.addTrack(screenTrack, localStreamRef.current);

          const offer = await pcRef.current.createOffer();
          await pcRef.current.setLocalDescription(offer);
          wsRef.current?.send(
            JSON.stringify({
              type: "offer",
              target: callState.targetId,
              sdp: offer.sdp,
            })
          );
        }

        screenTrack.onended = () => {
          if (localStreamRef.current) {
            localStreamRef.current.removeTrack(screenTrack);
          }
          if (pcRef.current) {
            const sender = pcRef.current.getSenders().find(s => s.track === screenTrack);
            sender?.track?.stop();
            pcRef.current.removeTrack(sender!);
          }
          setCallState(prev => ({ ...prev, isScreenSharing: false }));
        };

        setCallState(prev => ({ ...prev, isScreenSharing: true }));
      } catch (fallbackError) {
        console.error("No se pudo compartir pantalla:", fallbackError);
      }
    }
  };

  /** Conexión WebSocket para señalización */
  const connectSignaling = (): Promise<WebSocket> => {
    return new Promise((resolve, reject) => {
      const { token, userId } = getUserData();
      if (!token || !userId) {
        reject("No token or userId found");
        return;
      }

      const wsUrl = `ws://localhost:8000/ws/call/${userId}?token=${token}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        wsRef.current = ws;
        resolve(ws);
      };

      ws.onerror = (err) => {
        reject(err);
      };

      ws.onclose = () => {
        wsRef.current = null;
      };

      ws.onmessage = async (event) => {
        try {
          const msg = JSON.parse(event.data);

          switch (msg.type) {
            case "incoming_call":
              if (!msg.sdp) return;

              offerRef.current = {
                sender: msg.caller_id,
                senderName: msg.caller_name,
                sdp: {
                  type: "offer",
                  sdp: msg.sdp,
                },
              };

              setCallState((prev) => ({
                ...prev,
                incomingCall: {
                  callerId: msg.caller_id,
                  callerName: msg.caller_name || "Desconocido",
                },
                callerId: msg.caller_id,
                currentContact: msg.caller_name || "Desconocido",
              }));
              break;

            case "answer":
              if (pcRef.current && msg.sdp) {
                try {
                  await pcRef.current.setRemoteDescription(new RTCSessionDescription(msg.sdp));
                } catch (e) {
                  console.error("Error aplicando answer:", e);
                }
              }
              break;

            case "offer":
              if (msg.sdp && pcRef.current) {
                try {
                  await pcRef.current.setRemoteDescription(new RTCSessionDescription(msg.sdp));
                  const answer = await pcRef.current.createAnswer();
                  await pcRef.current.setLocalDescription(answer);
                  
                  wsRef.current?.send(
                    JSON.stringify({
                      type: "answer",
                      target: msg.caller_id || callState.callerId,
                      sdp: {
                        type: answer.type,
                        sdp: answer.sdp,
                      },
                    })
                  );
                } catch (e) {
                  console.error("Error procesando oferta:", e);
                }
              }
              break;

            case "ice-candidate":
              if (msg.candidate && pcRef.current) {
                try {
                  await pcRef.current.addIceCandidate(new RTCIceCandidate(msg.candidate));
                } catch (e) {
                  console.error("Error añadiendo ICE candidate:", e);
                }
              }
              break;

            case "hang-up":
              endCall();
              break;

            case "decline":
              endCall();
              break;
          }
        } catch (err) {
          console.error("Error parseando mensaje:", err);
        }
      };
    });
  };

  /** Crear conexión RTCPeerConnection */
  const createPeerConnection = (targetId?: string) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "ice-candidate",
            target: targetId,
            candidate: event.candidate,
          })
        );
      }
    };

    pc.ontrack = (event) => {
      const stream = event.streams[0];
      if (stream && stream.getTracks().length > 0) {
        remoteStreamRef.current = stream;
        setCallState((prev) => ({
          ...prev,
          remoteStream: stream,
        }));
      }
    };

    pcRef.current = pc;
    return pc;
  };

  /** Temporizador para la duración de la llamada */
  const startLocalTimer = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCallState((prev) => ({ ...prev, callDuration: prev.callDuration + 1 }));
    }, 1000);
  };

  const stopLocalTimer = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  };

  /** Iniciar una llamada saliente */
  const startCall = async (targetId: string, targetName: string, isVideo: boolean) => {
    const { token, userId, name } = getUserData();
    if (!token || !userId) return;

    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      await connectSignaling();
    }

    try {
      const stream = await getMediaStream(isVideo);
      localStreamRef.current = stream;

      const pc = createPeerConnection(targetId);
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      wsRef.current?.send(
        JSON.stringify({
          type: "incoming_call",
          target: targetId,
          caller_id: userId,
          caller_name: name || userId,
          sdp: offer.sdp,
        })
      );

      setCallState({
        isInCall: true,
        isMuted: false,
        isCameraOff: !isVideo,
        isRecording: false,
        isScreenSharing: false,
        currentContact: targetName,
        callDuration: 0,
        callerId: null,
        targetId,
        connection: pc,
        localStream: stream,
        remoteStream: null,
        incomingCall: null,
      });

      startLocalTimer();
    } catch (err) {
      console.error("Error al iniciar la llamada:", err);
    }
  };

  /** Responder llamada entrante */
  const answerCall = async () => {
    if (!offerRef.current) return;
    if (!offerRef.current.sdp || !offerRef.current.sdp.sdp) return;

    try {
      const hasVideo = offerRef.current.sdp.sdp.includes("m=video");
      const stream = await getMediaStream(hasVideo);
      localStreamRef.current = stream;

      const callerId = offerRef.current.sender;
      const callerName = offerRef.current.senderName;

      let pc = pcRef.current;
      if (!pc) {
        pc = createPeerConnection(callerId);
      }

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      await pc.setRemoteDescription(new RTCSessionDescription(offerRef.current.sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      wsRef.current?.send(
        JSON.stringify({
          type: "answer",
          target: callerId,
          sdp: {
            type: answer.type,
            sdp: answer.sdp,
          },
        })
      );

      setCallState((prev) => ({
        ...prev,
        isInCall: true,
        isCameraOff: !hasVideo,
        incomingCall: null,
        connection: pc,
        localStream: stream,
        remoteStream: null,
        currentContact: callerName || callerId,
      }));

      offerRef.current = null;
      startLocalTimer();
    } catch (err) {
      console.error("Error al contestar la llamada:", err);
    }
  };

  /** Finalizar llamada */
  const endCall = () => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN && callState.targetId) {
      wsRef.current.send(
        JSON.stringify({
          type: "hang-up",
          target: callState.targetId,
        })
      );
    }

    stopLocalTimer();

    setCallState({
      isInCall: false,
      isMuted: false,
      isCameraOff: false,
      isRecording: false,
      isScreenSharing: false,
      currentContact: null,
      callDuration: 0,
      callerId: null,
      targetId: null,
      connection: null,
      localStream: null,
      remoteStream: null,
      incomingCall: null,
    });

    remoteStreamRef.current = null;
    offerRef.current = null;
  };

  /** Manejo de acciones del usuario */
  const handleAction = (action: CallAction) => {
    switch (action) {
      case "mute":
        if (localStreamRef.current) {
          const audioTrack = localStreamRef.current.getAudioTracks()[0];
          if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            setCallState((prev) => ({ ...prev, isMuted: !audioTrack.enabled }));
          }
        }
        break;

      case "camera":
        if (localStreamRef.current) {
          const videoTrack = localStreamRef.current.getVideoTracks()[0];
          if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            setCallState((prev) => ({ ...prev, isCameraOff: !videoTrack.enabled }));
          }
        }
        break;

      case "hang-up":
        endCall();
        break;

      case "answer":
        answerCall();
        break;
        
      case "screen-share":
        toggleScreenShare();
        break;

      case "decline":
        if (wsRef.current?.readyState === WebSocket.OPEN && callState.callerId) {
          wsRef.current.send(
            JSON.stringify({
              type: "decline",
              target: callState.callerId,
            })
          );
        }
        setCallState((prev) => ({
          ...prev,
          incomingCall: null,
          callerId: null,
          currentContact: null,
        }));
        offerRef.current = null;
        break;

      default:
        break;
    }
  };

  /** Efecto para inicializar WebSocket al montar */
  useEffect(() => {
    connectSignaling();
    return () => {
      wsRef.current?.close();
      stopLocalTimer();
      if (pcRef.current) pcRef.current.close();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return (
    <VideoCallContext.Provider value={{ callState, startCall, handleAction }}>
      {children}
    </VideoCallContext.Provider>
  );
}

export const useVideoCall = () => {
  const context = useContext(VideoCallContext);
  if (!context) throw new Error("useVideoCall must be used within VideoCallProvider");
  return context;
};