"use client"

import { useTranslation } from "../../lib/useTranslations"
import VideoCallInterface from "@/components/ui/video_call_interface"

export default function MessagesPage() {
  const { t } = useTranslation()
  return (
    <div className="min-h-screen bg-[#141414]">
      <VideoCallInterface />
    </div>
  )
}