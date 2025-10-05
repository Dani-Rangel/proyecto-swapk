// src/components/ui/ManageEnrollmentsModal.tsx
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from 'react-hot-toast'
import { inscripcionCursoAPI, type InscripcionCurso } from "@/services/inscripcionCursoApi"
import { User, Clock, CheckCircle, XCircle } from "lucide-react"

interface ManageEnrollmentsModalProps {
  isOpen: boolean
  onClose: () => void
  cursoId: number
  onEstadoActualizado: () => void
}

export default function ManageEnrollmentsModal({
  isOpen,
  onClose,
  cursoId,
  onEstadoActualizado
}: ManageEnrollmentsModalProps) {
  const [inscripciones, setInscripciones] = useState<InscripcionCurso[]>([])
  const [loading, setLoading] = useState(true)

  const total = inscripciones.length
  const pendientes = inscripciones.filter(i => i.estado === "Pendiente").length
  const confirmados = inscripciones.filter(i => i.estado === "Confirmado").length
  const finalizados = inscripciones.filter(i => i.estado === "Finalizado").length

  useEffect(() => {
    if (!isOpen) return
    const cargarInscripciones = async () => {
      setLoading(true)
      try {
        const data = await inscripcionCursoAPI.getInscripcionesByCurso(cursoId)
        setInscripciones(data)
      } catch (error) {
        console.error("Error al cargar inscripciones:", error)
        toast.error("Error al cargar inscripciones")
      } finally {
        setLoading(false)
      }
    }
    cargarInscripciones()
  }, [isOpen, cursoId])

  const handleAceptar = async (inscripcionId: number) => {
    try {
      await inscripcionCursoAPI.aceptarInscripcion(inscripcionId)
      toast.success("✅ Inscripción aceptada")
      onEstadoActualizado()
      setInscripciones(prev => 
        prev.map(i => i.id === inscripcionId ? { ...i, estado: "Confirmado" } : i)
      )
    } catch (error) {
      toast.error("❌ Error al aceptar inscripción")
    }
  }

  const handleFinalizar = async (inscripcionId: number) => {
    try {
      await inscripcionCursoAPI.finalizarInscripcion(inscripcionId)
      toast.success("✅ Inscripción finalizada")
      onEstadoActualizado()
      setInscripciones(prev => 
        prev.map(i => i.id === inscripcionId ? { ...i, estado: "Finalizado" } : i)
      )
    } catch (error) {
      toast.error("❌ Error al finalizar inscripción")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-[#1E1E1E] border-[#333] text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <User className="w-5 h-5" />
            Gestionar Inscripciones
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Contador */}
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div className="text-center p-2 rounded bg-gray-800">
                <div className="font-bold text-white">{total}</div>
                <div className="text-gray-400">Total</div>
              </div>
              <div className="text-center p-2 rounded bg-yellow-900/50">
                <div className="font-bold text-yellow-200">{pendientes}</div>
                <div className="text-yellow-300">Pendientes</div>
              </div>
              <div className="text-center p-2 rounded bg-green-900/50">
                <div className="font-bold text-green-200">{confirmados}</div>
                <div className="text-green-300">Confirmados</div>
              </div>
              <div className="text-center p-2 rounded bg-red-900/50">
                <div className="font-bold text-red-200">{finalizados}</div>
                <div className="text-red-300">Finalizados</div>
              </div>
            </div>

            {inscripciones.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No hay inscripciones.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {inscripciones.map((inscripcion) => (
                  <li 
                    key={inscripcion.id} 
                    className={`p-4 rounded-lg border transition-all hover:bg-[#2A2A2A] ${getEstadoClass(inscripcion.estado)}`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-gray-400" />
                        <span className="font-medium truncate max-w-[150px]">
                          {inscripcion.usuario?.nombre || `Usuario ${inscripcion.usuario_id}`}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ${getEstadoBadgeClass(inscripcion.estado)}`}>
                          {getEstadoIcon(inscripcion.estado)}
                          {inscripcion.estado}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {inscripcion.estado === "Pendiente" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAceptar(inscripcion.id)}
                            className="text-green-400 hover:text-green-300 border-green-500 hover:bg-green-900/20"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Aceptar
                          </Button>
                        )}
                        {(inscripcion.estado === "Confirmado" || inscripcion.estado === "Pendiente") && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleFinalizar(inscripcion.id)}
                            className="text-red-400 hover:text-red-300 bg-red-900/20"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Finalizar
                          </Button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <DialogFooter className="mt-6">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="border-[#444] text-gray-300 hover:bg-[#333] hover:text-white"
          >
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function getEstadoClass(estado: string) {
  switch (estado) {
    case "Pendiente": return "border-yellow-700 bg-yellow-900/20"
    case "Confirmado": return "border-green-700 bg-green-900/20"
    case "Finalizado": return "border-red-700 bg-red-900/20"
    default: return "border-gray-700 bg-gray-900/20"
  }
}

function getEstadoBadgeClass(estado: string) {
  switch (estado) {
    case "Pendiente": return "bg-yellow-800 text-yellow-100"
    case "Confirmado": return "bg-green-800 text-green-100"
    case "Finalizado": return "bg-red-800 text-red-100"
    default: return "bg-gray-800 text-gray-100"
  }
}

function getEstadoIcon(estado: string) {
  switch (estado) {
    case "Pendiente": return <Clock className="w-3 h-3 mr-1" />
    case "Confirmado": return <CheckCircle className="w-3 h-3 mr-1" />
    case "Finalizado": return <XCircle className="w-3 h-3 mr-1" />
    default: return null
  }
}