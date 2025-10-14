// src/components/ui/ResenaModal.tsx

"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Star, X } from "lucide-react"
import { useTranslation } from "@/lib/useTranslations"

interface ResenaModalProps {
  isOpen: boolean
  onClose: () => void
  onEnviar: (calificacion: number, comentario: string) => void
  intercambioId: number
}

export default function ResenaModal({ isOpen, onClose, onEnviar, intercambioId }: ResenaModalProps) {
  const { t } = useTranslation()
  const [calificacion, setCalificacion] = useState<number>(0)
  const [comentario, setComentario] = useState<string>("")

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onEnviar(calificacion, comentario)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1E1E1E] rounded-xl p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Dejanos tu opinión sobre este trueque</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5 text-white" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Calificación</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setCalificacion(star)}
                  className={`text-2xl ${star <= calificacion ? "text-yellow-400" : "text-gray-400"}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Comentario</label>
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Cuéntanos brevemente tu experiencia, qué aprendiste, cómo fue el trato con la otra persona, si cumplió con lo aprobado, etc."
              className="w-full px-3 py-2 bg-[#2E2E2E] text-white rounded-lg border border-[#404040] resize-none"
              rows={4}
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 text-blue-400 hover:bg-blue-900"
              onClick={onClose}
            >
              Reportar Trueque
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Enviar feedback
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}