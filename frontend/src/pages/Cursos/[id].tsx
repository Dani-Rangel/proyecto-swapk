"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { ChevronLeft } from "lucide-react"
import { contenidoCursoAPI, type ContenidoItem } from "@/services/contenidoCursoApi"
import { getCurrentUser } from "@/lib/auth"
import { CursoContenidoEditorNav } from "@/components/ui/contenido_curso/CursoContenidoEditorNav"
import { CursoContenidoEditorArea } from "@/components/ui/contenido_curso/CursoContenidoEditorArea"
import { CursoContenidoLecturaNav } from "@/components/ui/contenido_curso/CursoContenidoLecturaNav"

export default function CursoDetalladoPage() {
  const router = useRouter()
  const { id } = router.query
  const [loading, setLoading] = useState(true)
  const [isCreator, setIsCreator] = useState(false)
  const [contenido, setContenido] = useState<ContenidoItem[]>([])
  const [leccionSeleccionada, setLeccionSeleccionada] = useState<ContenidoItem | null>(null)
  const [cursoNombre, setCursoNombre] = useState("Curso")

  useEffect(() => {
    if (!id) return
    const load = async () => {
      try {
        console.log("[v0] Cargando curso con ID:", id)
        const data = await contenidoCursoAPI.obtenerPorCurso(Number.parseInt(id as string))
        console.log("[v0] Datos del curso recibidos:", data)
        console.log("[v0] Contenido del curso:", data.contenido)

        setContenido(data.contenido)
        setCursoNombre(data.curso_nombre || "Curso")

        const user = getCurrentUser()
        if (user) {
          setIsCreator(Number(user.id) === data.curso_user_id)
        }

        // Filtrar lecciones (nivel 2) y ordenarlas correctamente
        const lecciones = data.contenido
          .filter((item) => item.nivel === 2)
          .sort((a, b) => {
            // Primero ordenar por módulo padre
            const moduloA = data.contenido.find((m) => m.id === a.parent_id)?.orden || 0
            const moduloB = data.contenido.find((m) => m.id === b.parent_id)?.orden || 0
            if (moduloA !== moduloB) return moduloA - moduloB
            // Luego por orden dentro del módulo
            return a.orden - b.orden
          })

        const firstLeccion = lecciones[0]
        console.log("[v0] Primera lección encontrada:", firstLeccion)
        console.log("[v0] Total de lecciones:", lecciones.length)

        if (firstLeccion) {
          setLeccionSeleccionada(firstLeccion)
        } else {
          console.log("[v0] No se encontraron lecciones en el curso")
        }
      } catch (err) {
        console.error("[v0] Error al cargar curso:", err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando curso...</p>
        </div>
      </div>
    )
  }

  if (!id) {
    return <div className="min-h-screen p-6 bg-[#1A1A1A] text-white">Curso no encontrado</div>
  }

  const courseId = Number.parseInt(id as string)

  return (
    <div className="min-h-screen bg-[#1A1A1A] font-sans">
      {/* Header */}
      <header className="bg-[#2E2E2E] border-b border-[#3E3E3E] shadow-sm sticky top-0 z-50">
        <div className="px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-[#3E3E3E] rounded-lg"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-white">{cursoNombre}</h1>
            {isCreator && <p className="text-sm text-gray-400 mt-0.5">Modo edición</p>}
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* Sidebar izquierdo */}
        <aside className="w-80 bg-[#2E2E2E] border-r border-[#3E3E3E] overflow-y-auto">
          <div className="p-6">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wide mb-4">
              {isCreator ? "Editor de estructura" : "Contenido del curso"}
            </h2>
            {isCreator ? (
              <CursoContenidoEditorNav cursoId={courseId} onLeccionSeleccionada={setLeccionSeleccionada} />
            ) : (
              <CursoContenidoLecturaNav
                contenido={contenido}
                cursoId={courseId}
                onLeccionSeleccionada={setLeccionSeleccionada}
                leccionActual={leccionSeleccionada}
              />
            )}
          </div>
        </aside>

        {/* Área principal */}
        <main className="flex-1 bg-[#1A1A1A] overflow-y-auto">
          {isCreator ? (
            <div className="max-w-5xl mx-auto p-8">
              <CursoContenidoEditorArea
                leccion={leccionSeleccionada}
                cursoId={courseId}
                isCreator={isCreator}
                onGuardar={() => {}}
              />
            </div>
          ) : (
            <CursoContenidoLecturaNav contenido={contenido} cursoId={courseId} leccionActual={leccionSeleccionada} />
          )}
        </main>
      </div>
    </div>
  )
}
