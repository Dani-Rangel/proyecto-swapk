"use client"

import { useState, useEffect, useRef, createElement } from "react"
import { Button } from "@/components/ui/button"
import { ChevronRight, CheckCircle, ChevronDown, BookOpen, PlayCircle } from "lucide-react"
import { bloqueContenidoAPI } from "@/services/contenidoCursoApi"
import ReactMarkdown from "react-markdown"

interface CursoContenidoLecturaNavProps {
  contenido: any[]
  cursoId: number
  onLeccionSeleccionada?: (leccion: any) => void
  leccionActual?: any | null
}

export function CursoContenidoLecturaNav({
  contenido,
  cursoId,
  onLeccionSeleccionada,
  leccionActual,
}: CursoContenidoLecturaNavProps) {
  const [modulosExpandidos, setModulosExpandidos] = useState<Record<number, boolean>>({})
  const [leccionSeleccionada, setLeccionSeleccionada] = useState<any | null>(leccionActual || null)
  const [progreso, setProgreso] = useState<Record<string, boolean>>({})
  const [bloquesLeccion, setBloquesLeccion] = useState<any[]>([])
  const [loadingBloques, setLoadingBloques] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const PROGRESO_KEY = `curso_${cursoId}_progreso`

  const modulos = contenido.filter((item) => item.nivel === 1).sort((a, b) => a.orden - b.orden)

  useEffect(() => {
    if (leccionActual) {
      console.log("[v0] Actualizando lección actual desde props:", leccionActual)
      setLeccionSeleccionada(leccionActual)
    }
  }, [leccionActual])

  // Cargar progreso desde localStorage
  useEffect(() => {
    const guardado = localStorage.getItem(PROGRESO_KEY)
    if (guardado) {
      try {
        setProgreso(JSON.parse(guardado))
      } catch {
        setProgreso({})
      }
    }

    if (modulos.length > 0 && Object.keys(modulosExpandidos).length === 0) {
      setModulosExpandidos({ [modulos[0].id]: true })
    }
  }, [PROGRESO_KEY])

  useEffect(() => {
    const cargarBloques = async () => {
      if (!leccionSeleccionada?.id) {
        console.log("[v0] No hay lección seleccionada, id:", leccionSeleccionada?.id)
        setBloquesLeccion([])
        return
      }

      setLoadingBloques(true)
      try {
        console.log("[v0] Cargando bloques para lección ID:", leccionSeleccionada.id)
        const bloques = await bloqueContenidoAPI.obtenerPorLeccion(leccionSeleccionada.id)
        console.log("[v0] Bloques cargados exitosamente:", bloques)
        console.log("[v0] Cantidad de bloques:", bloques.length)
        setBloquesLeccion(bloques)
      } catch (err) {
        console.error("[v0] Error al cargar bloques:", err)
        setBloquesLeccion([])
      } finally {
        setLoadingBloques(false)
      }
    }

    cargarBloques()
  }, [leccionSeleccionada])

  const guardarProgreso = (leccionId: number, completada: boolean) => {
    setProgreso((prev) => {
      const nuevo = { ...prev, [`leccion_${leccionId}`]: completada }
      localStorage.setItem(PROGRESO_KEY, JSON.stringify(nuevo))
      return nuevo
    })
  }

  const toggleModulo = (moduloId: number) => {
    setModulosExpandidos((prev) => ({
      ...prev,
      [moduloId]: !prev[moduloId],
    }))
  }

  const calcularAvanceModulo = (moduloId: number) => {
    const lecciones = contenido.filter((item) => item.parent_id === moduloId && item.nivel === 2)
    if (lecciones.length === 0) return 0
    const completadas = lecciones.filter((l) => progreso[`leccion_${l.id}`]).length
    return Math.round((completadas / lecciones.length) * 100)
  }

  const handleSeleccionarLeccion = (leccion: any) => {
    console.log("[v0] Lección seleccionada:", leccion)
    setLeccionSeleccionada(leccion)
    if (onLeccionSeleccionada) {
      onLeccionSeleccionada(leccion)
    }
  }

  const obtenerSiguienteLeccion = () => {
    if (!leccionSeleccionada) return null

    const todasLecciones = contenido
      .filter((item) => item.nivel === 2)
      .sort((a, b) => {
        const moduloA = modulos.find((m) => m.id === a.parent_id)?.orden || 0
        const moduloB = modulos.find((m) => m.id === b.parent_id)?.orden || 0
        if (moduloA !== moduloB) return moduloA - moduloB
        return a.orden - b.orden
      })

    const indiceActual = todasLecciones.findIndex((l) => l.id === leccionSeleccionada.id)
    return indiceActual < todasLecciones.length - 1 ? todasLecciones[indiceActual + 1] : null
  }

  const irASiguienteLeccion = () => {
    const siguiente = obtenerSiguienteLeccion()
    if (siguiente) {
      handleSeleccionarLeccion(siguiente)
      if (leccionSeleccionada) {
        guardarProgreso(leccionSeleccionada.id, true)
      }
      setModulosExpandidos((prev) => ({ ...prev, [siguiente.parent_id]: true }))
    }
  }

  const renderBloque = (bloque: any) => {
    console.log("[v0] Renderizando bloque:", bloque)

    if (bloque.tipo === "texto") {
      return (
        <div className="prose prose-lg max-w-none prose-invert prose-headings:text-white prose-p:text-gray-300 prose-a:text-blue-400 prose-strong:text-white prose-h1:text-2xl prose-h1:font-bold prose-h2:text-xl prose-h2:font-bold prose-h3:text-lg prose-h3:font-semibold prose-ul:text-gray-300 prose-ol:text-gray-300 prose-li:text-gray-300">
          <ReactMarkdown
            components={{
              h1: ({ node, children }) =>
                createElement("h1", { className: "text-3xl font-bold mt-6 mb-4 text-white" }, children),
              h2: ({ node, children }) =>
                createElement("h2", { className: "text-2xl font-bold mt-5 mb-3 text-white" }, children),
              h3: ({ node, children }) =>
                createElement("h3", { className: "text-xl font-semibold mt-4 mb-2 text-white" }, children),
              p: ({ node, children }) =>
                createElement("p", { className: "text-gray-300 mb-4 leading-relaxed" }, children),
              ul: ({ node, children }) =>
                createElement("ul", { className: "list-disc list-inside text-gray-300 mb-4 space-y-2" }, children),
              ol: ({ node, children }) =>
                createElement("ol", { className: "list-decimal list-inside text-gray-300 mb-4 space-y-2" }, children),
              li: ({ node, children }) =>
                createElement("li", { className: "text-gray-300" }, children),
              strong: ({ node, children }) =>
                createElement("strong", { className: "font-bold text-white" }, children),
              em: ({ node, children }) =>
                createElement("em", { className: "italic text-gray-200" }, children),
              code: ({ node, children }) =>
                createElement("code", { className: "bg-[#1A1A1A] text-blue-300 px-2 py-1 rounded text-sm font-mono" }, children),
              blockquote: ({ node, children }) =>
                createElement("blockquote", { className: "border-l-4 border-blue-600 pl-4 italic text-gray-300 my-4" }, children),
            }}
          >
            {bloque.contenido}
          </ReactMarkdown>
        </div>
      )
    }
    if (bloque.tipo === "video" && bloque.contenido) {
      return (
        <div className="aspect-video bg-black rounded-lg overflow-hidden shadow-lg my-6">
          <iframe
            width="100%"
            height="100%"
            src={bloque.contenido}
            title="Video"
            allowFullScreen
            className="border-0"
          />
        </div>
      )
    }
    if (bloque.tipo === "imagen" && bloque.contenido) {
      return (
        <img
          src={bloque.contenido || "/placeholder.svg"}
          alt="Imagen"
          className="my-6 max-w-full h-auto rounded-lg shadow-md"
        />
      )
    }
    if (bloque.tipo === "archivo" && bloque.contenido) {
      return (
        <a
          href={bloque.contenido}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          📎 Descargar archivo
        </a>
      )
    }
    return null
  }

  // Si se proporciona onLeccionSeleccionada, renderizar solo la navegación (sidebar)
  if (onLeccionSeleccionada) {
    return (
      <div className="space-y-2">
        {modulos.map((modulo, i) => {
          const avance = calcularAvanceModulo(modulo.id)
          const lecciones = contenido
            .filter((item) => item.parent_id === modulo.id && item.nivel === 2)
            .sort((a, b) => a.orden - b.orden)
          const isExpanded = modulosExpandidos[modulo.id]

          return (
            <div key={modulo.id} className="border border-[#3E3E3E] rounded-lg overflow-hidden">
              <button
                className="w-full px-4 py-3 flex items-center justify-between bg-[#2E2E2E] hover:bg-[#3E3E3E] transition-colors"
                onClick={() => toggleModulo(modulo.id)}
              >
                <div className="flex items-center gap-3 flex-1 text-left">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-900 text-blue-400 flex items-center justify-center text-sm font-semibold">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white text-sm truncate">{modulo.titulo}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {lecciones.length} {lecciones.length === 1 ? "lección" : "lecciones"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-[#3E3E3E] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 transition-all duration-300"
                        style={{ width: `${avance}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-400 w-8 text-right">{avance}%</span>
                  </div>
                  <ChevronDown
                    size={18}
                    className={`text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  />
                </div>
              </button>

              {isExpanded && (
                <div className="bg-[#1A1A1A] border-t border-[#3E3E3E]">
                  {lecciones.map((leccion, j) => {
                    const isCompleted = progreso[`leccion_${leccion.id}`]
                    const isActive = leccionActual?.id === leccion.id

                    return (
                      <button
                        key={leccion.id}
                        className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-[#2E2E2E] transition-colors border-l-4 ${
                          isActive ? "border-blue-600 bg-[#2E2E2E]" : "border-transparent"
                        }`}
                        onClick={() => handleSeleccionarLeccion(leccion)}
                      >
                        <div className="flex-shrink-0 ml-8">
                          {isCompleted ? (
                            <CheckCircle size={20} className="text-green-500" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-gray-600" />
                          )}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <p className={`text-sm font-medium truncate ${isActive ? "text-blue-400" : "text-gray-300"}`}>
                            {i + 1}.{j + 1} {leccion.titulo}
                          </p>
                        </div>
                        {isActive && <PlayCircle size={16} className="text-blue-400 flex-shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}

        {!modulos.length && (
          <div className="text-center py-12">
            <BookOpen size={48} className="mx-auto text-gray-600 mb-3" />
            <p className="text-gray-400 text-sm">Este curso no tiene módulos aún.</p>
          </div>
        )}
      </div>
    )
  }

  // Renderizar contenido completo (área principal)
  return (
    <div className="h-full p-6">
      {leccionSeleccionada ? (
        <div ref={contentRef} className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-blue-900 to-blue-950 rounded-xl p-8 mb-8 text-white shadow-lg border border-blue-800">
            <div className="flex items-center gap-2 text-blue-300 text-sm mb-3">
              <BookOpen size={16} />
              <span>Lección {leccionSeleccionada.orden + 1}</span>
            </div>
            <h1 className="text-3xl font-bold mb-2">{leccionSeleccionada.titulo}</h1>
            {leccionSeleccionada.descripcion && (
              <p className="text-blue-200 text-lg">{leccionSeleccionada.descripcion}</p>
            )}
          </div>

          <div className="bg-[#2E2E2E] rounded-xl shadow-sm p-8 mb-6 border border-[#3E3E3E]">
            {loadingBloques ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-400">Cargando contenido...</p>
              </div>
            ) : bloquesLeccion && bloquesLeccion.length > 0 ? (
              <div className="space-y-6">
                {bloquesLeccion.map((bloque: any) => (
                  <div key={bloque.id}>{renderBloque(bloque)}</div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen size={48} className="mx-auto text-gray-600 mb-3" />
                <p className="text-gray-400">Esta lección aún no tiene contenido.</p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between bg-[#2E2E2E] rounded-xl shadow-sm p-6 border border-[#3E3E3E]">
            <Button
              variant="outline"
              onClick={() => {}}
              className="gap-2 border-[#3E3E3E] text-gray-300 hover:bg-[#3E3E3E] hover:text-white"
            >
              <ChevronDown size={16} className="rotate-90" />
              Lección anterior
            </Button>
            <Button
              onClick={irASiguienteLeccion}
              disabled={!obtenerSiguienteLeccion()}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Siguiente lección
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      ) : (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <BookOpen size={64} className="mx-auto text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Selecciona una lección</h3>
            <p className="text-gray-400">Elige un módulo y una lección del menú lateral para comenzar.</p>
          </div>
        </div>
      )}
    </div>
  )
}