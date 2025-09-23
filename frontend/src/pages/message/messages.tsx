"use client"

import { useTranslation } from "../../lib/useTranslations"
import VideoCallInterface from "@/components/ui/video_call_interface"
import ProtectedRoute from "@/components/protected_routes/protected_routes";
function MessagesPageComponent() {
  const { t } = useTranslation()
  return (
    <div className="min-h-screen bg-[#141414]">
      <VideoCallInterface />
    </div>
  )
}

// ✅ Exportamos el componente protegido
export default function MessagesPage() {
  return (
    
    <ProtectedRoute>
      <MessagesPageComponent />
    </ProtectedRoute>
  )
}
