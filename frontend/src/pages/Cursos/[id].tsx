// src/pages/Cursos/[id].tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { ChevronLeft } from "lucide-react"
import { contenidoCursoAPI, ContenidoItem } from "@/services/contenidoCursoApi"
import { getCurrentUser } from "@/lib/auth"
import { CursoContenidoEditorNav } from "@/components/ui/contenido_curso/CursoContenidoEditorNav"
import { CursoContenidoEditorArea } from "@/components/ui/contenido_curso/CursoContenidoEditorArea"
import { CursoContenidoLecturaNav } from "@/components/ui/contenido_curso/CursoContenidoLecturaNav"


export default function CursoDetalladoPage() {
  const router = useRouter()
  const { id } = router.query
  const [loading, setLoading] = useState(true)
  const [isDark, setIsDark] = useState(true)
  const [isCreator, setIsCreator] = useState(false)
  const [contenido, setContenido] = useState<ContenidoItem[]>([])
  const [leccionSeleccionada, setLeccionSeleccionada] = useState<ContenidoItem | null>(null)

  useEffect(() => {
    if (!id) return
    const load = async () => {
      try {
        const data = await contenidoCursoAPI.obtenerPorCurso(parseInt(id as string))
        setContenido(data.contenido)

        const user = getCurrentUser()
        if (user) {
          setIsCreator(Number(user.id) === data.curso_user_id)
        }

        // Seleccionar primera lección automáticamente
        const firstLeccion = data.contenido
          .flatMap(mod => mod.children || [])
          .find(lec => lec.id)
        if (firstLeccion) {
          setLeccionSeleccionada(firstLeccion)
        }
      } catch (err) {
        console.error("Error al cargar curso:", err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center text-white">
        Cargando curso...
      </div>
    )
  }

  if (!id) {
    return <div className="min-h-screen p-6">Curso no encontrado</div>
  }

  const courseId = parseInt(id as string)

  return (
    <div className={`min-h-screen ${isDark ? "bg-[#1A1A1A]" : "bg-gray-50"} font-sans`}>
      {/* Header */}
      <header className={`border-b ${isDark ? "border-[#3E3E3E] bg-[#2E2E2E]" : "border-gray-200 bg-white"} px-6 py-4 flex items-center`}>
        <button onClick={() => router.back()} className="text-white mr-4">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-xl font-semibold text-white">Curso</h1>
      </header>

      {/* Contenido principal */}
      <div className="flex h-[calc(100vh-120px)]">
        {/* Sidebar izquierdo: Editor de estructura (solo si es creador) */}
        {isCreator && (
          <aside className={`w-80 border-r ${isDark ? "border-[#3E3E3E] bg-[#2E2E2E]" : "border-gray-200 bg-white"} overflow-y-auto`}>
            <div className="p-4">
              <h2 className={`text-lg font-semibold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>Editor de estructura</h2>
              <CursoContenidoEditorNav
                cursoId={courseId}
                isDark={isDark}
                onLeccionSeleccionada={setLeccionSeleccionada}
              />
            </div>
          </aside>
        )}

        {/* Área principal: Editor o Lectura */}
        <main className={`flex-1 ${isDark ? "bg-[#1A1A1A]" : "bg-gray-50"} p-6 overflow-y-auto`}>
          {isCreator ? (
            <div className={`max-w-4xl mx-auto rounded-lg ${isDark ? "bg-[#2E2E2E]" : "bg-white"} p-8`}>
              <CursoContenidoEditorArea
                leccion={leccionSeleccionada}
                cursoId={courseId}
                isDark={isDark}
                isCreator={isCreator}
                onGuardar={() => {}}
              />
            </div>
          ) : (
            <CursoContenidoLecturaNav
              contenido={contenido}
              isDark={isDark}
            />
          )}
        </main>
      </div>
    </div>
  )
}