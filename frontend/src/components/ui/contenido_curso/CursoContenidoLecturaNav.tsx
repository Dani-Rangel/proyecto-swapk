// src/components/ui/contenido-curso/CursoContenidoLecturaNav.tsx
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ChevronRight, CheckCircle, ChevronDown } from "lucide-react"

interface CursoContenidoLecturaNavProps {
  contenido: any[]
  isDark: boolean
  cursoId: number
}

export function CursoContenidoLecturaNav({ contenido, isDark, cursoId }: CursoContenidoLecturaNavProps) {
  const [moduloSeleccionado, setModuloSeleccionado] = useState<number | null>(null)
  const [leccionSeleccionada, setLeccionSeleccionada] = useState<any | null>(null)
  const [progreso, setProgreso] = useState<Record<string, boolean>>({})
  const contentRef = useRef<HTMLDivElement>(null)

  // Clave para localStorage
  const PROGRESO_KEY = `curso_${cursoId}_progreso`

  // Obtener módulos (nivel=1)
  const modulos = contenido.filter(item => item.nivel === 1).sort((a, b) => a.orden - b.orden)

  // Obtener lecciones del módulo seleccionado
  const leccionesDelModulo = moduloSeleccionado
    ? contenido
        .filter(item => item.parent_id === moduloSeleccionado && item.nivel === 2)
        .sort((a, b) => a.orden - b.orden)
    : []

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
  }, [PROGRESO_KEY])

  // Guardar progreso en localStorage
  const guardarProgreso = (leccionId: number, completada: boolean) => {
    setProgreso(prev => {
      const nuevo = { ...prev, [`leccion_${leccionId}`]: completada }
      localStorage.setItem(PROGRESO_KEY, JSON.stringify(nuevo))
      return nuevo
    })
  }

  // Generar número de lección (1.1, 1.2, etc.)
  const getNumeroLeccion = (leccion: any) => {
    if (!moduloSeleccionado) return ""
    const moduloIndex = modulos.findIndex(m => m.id === moduloSeleccionado) + 1
    const leccionIndex = leccionesDelModulo.findIndex(l => l.id === leccion.id) + 1
    return `${moduloIndex}.${leccionIndex}`
  }

  // Calcular % de avance por módulo
  const calcularAvanceModulo = (moduloId: number) => {
    const lecciones = contenido.filter(item => item.parent_id === moduloId && item.nivel === 2)
    if (lecciones.length === 0) return 0
    const completadas = lecciones.filter(l => progreso[`leccion_${l.id}`]).length
    return Math.round((completadas / lecciones.length) * 100)
  }

  // Resetear lección seleccionada cuando cambia el módulo
  useEffect(() => {
    setLeccionSeleccionada(null)
  }, [moduloSeleccionado])

  // Detectar si la lección está "completa" al hacer scroll
  useEffect(() => {
    if (!leccionSeleccionada || !contentRef.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.75) {
          // Marcar como completada después de 1 segundo de visibilidad
          const timer = setTimeout(() => {
            if (!progreso[`leccion_${leccionSeleccionada.id}`]) {
              guardarProgreso(leccionSeleccionada.id, true)
            }
          }, 1000)
          return () => clearTimeout(timer)
        }
      },
      { threshold: 0.75 }
    )

    const element = contentRef.current.querySelector(`#leccion-${leccionSeleccionada.id}`)
    if (element) observer.observe(element)

    return () => observer.disconnect()
  }, [leccionSeleccionada, progreso])

  const handleSeleccionarLeccion = (leccion: any) => {
    setLeccionSeleccionada(leccion)
  }

  // Obtener siguiente lección
  const obtenerSiguienteLeccion = () => {
    if (!leccionSeleccionada) return null

    // Todas las lecciones ordenadas
    const todasLecciones = contenido
      .filter(item => item.nivel === 2)
      .sort((a, b) => {
        const moduloA = modulos.find(m => m.id === a.parent_id)?.orden || 0
        const moduloB = modulos.find(m => m.id === b.parent_id)?.orden || 0
        if (moduloA !== moduloB) return moduloA - moduloB
        return a.orden - b.orden
      })

    const indiceActual = todasLecciones.findIndex(l => l.id === leccionSeleccionada.id)
    return indiceActual < todasLecciones.length - 1 ? todasLecciones[indiceActual + 1] : null
  }

  const irASiguienteLeccion = () => {
    const siguiente = obtenerSiguienteLeccion()
    if (siguiente) {
      setLeccionSeleccionada(siguiente)
      // Asegurar que el módulo correcto esté expandido
      setModuloSeleccionado(siguiente.parent_id)
    }
  }

  const renderBloque = (bloque: any) => {
    if (bloque.tipo === "texto") {
      return <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: bloque.contenido }} />
    }
    if (bloque.tipo === "video" && bloque.contenido) {
      return (
        <div className="aspect-video bg-black rounded overflow-hidden my-4">
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
      return <img src={bloque.contenido} alt="Imagen" className="my-4 max-w-full h-auto rounded" />
    }
    if (bloque.tipo === "archivo" && bloque.contenido) {
      return (
        <a
          href={bloque.contenido}
          target="_blank"
          rel="noopener noreferrer"
          className={`mt-2 inline-block px-3 py-1 rounded ${
            isDark ? "bg-blue-700" : "bg-blue-600"
          } text-white text-sm`}
        >
          📎 Descargar archivo
        </a>
      )
    }
    return null
  }

  return (
    <div className={`h-[calc(100vh-120px)] flex ${isDark ? "bg-[#1A1A1A]" : "bg-gray-50"}`}>
      {/* Sidebar izquierdo: Navegación por módulos y lecciones */}
      <aside className={`w-80 border-r ${isDark ? "border-[#3E3E3E] bg-[#2E2E2E]" : "border-gray-200 bg-white"} overflow-y-auto`}>
        <div className="p-4">
          <h2 className={`text-lg font-semibold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>Contenido del curso</h2>

          {modulos.map((modulo, i) => {
            const avance = calcularAvanceModulo(modulo.id)
            return (
              <div key={modulo.id} className="mb-4">
                <Button
                  variant="ghost"
                  className={`w-full justify-between text-left p-2 rounded ${isDark ? "hover:bg-[#3E3E3E]" : "hover:bg-gray-100"} ${moduloSeleccionado === modulo.id ? (isDark ? "bg-[#3E3E3E]" : "bg-gray-200") : ""}`}
                  onClick={() => setModuloSeleccionado(modulo.id === moduloSeleccionado ? null : modulo.id)}
                >
                  <span className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                    Módulo {i + 1}: {modulo.titulo}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${avance === 100 ? "text-green-500" : "text-gray-500"}`}>
                      {avance}%
                    </span>
                    <ChevronDown size={16} className={`ml-auto ${moduloSeleccionado === modulo.id ? "rotate-180" : ""}`} />
                  </div>
                </Button>

                {moduloSeleccionado === modulo.id && (
                  <div className="ml-4 mt-2 space-y-1">
                    {leccionesDelModulo.map((leccion) => (
                      <Button
                        key={leccion.id}
                        variant="ghost"
                        className={`w-full justify-start text-left pl-3 ${isDark ? "hover:bg-[#3E3E3E]" : "hover:bg-gray-100"} ${leccionSeleccionada?.id === leccion.id ? (isDark ? "bg-[#3E3E3E]" : "bg-gray-200") : ""}`}
                        onClick={() => handleSeleccionarLeccion(leccion)}
                      >
                        <span className="mr-2 text-xs opacity-70">{getNumeroLeccion(leccion)}</span>
                        {leccion.titulo}
                        {progreso[`leccion_${leccion.id}`] && (
                          <CheckCircle size={16} className="ml-auto text-green-500" />
                        )}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          {!modulos.length && (
            <p className={`text-center py-8 ${isDark ? "text-[#A0A0A0]" : "text-gray-500"}`}>
              Este curso no tiene módulos.
            </p>
          )}
        </div>
      </aside>

      {/* Área principal: Contenido de la lección seleccionada */}
      <main className={`flex-1 ${isDark ? "bg-[#1A1A1A]" : "bg-gray-50"} p-6 overflow-y-auto`}>
        {leccionSeleccionada ? (
          <div
            ref={contentRef}
            className={`max-w-4xl mx-auto rounded-lg ${isDark ? "bg-[#2E2E2E]" : "bg-white"} p-8`}
            id={`leccion-${leccionSeleccionada.id}`}
          >
            <h3 className={`text-xl font-semibold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>
              {getNumeroLeccion(leccionSeleccionada)} {leccionSeleccionada.titulo}
            </h3>
            {leccionSeleccionada.bloques && leccionSeleccionada.bloques.length > 0 ? (
              leccionSeleccionada.bloques.map((bloque: any) => (
                <div key={bloque.id} className="mb-6">
                  {renderBloque(bloque)}
                </div>
              ))
            ) : (
              <p className={isDark ? "text-[#A0A0A0]" : "text-gray-500"}>
                Esta lección aún no tiene contenido.
              </p>
            )}

            {/* Botón Siguiente */}
            <div className="mt-8 flex justify-end">
              <Button onClick={irASiguienteLeccion} disabled={!obtenerSiguienteLeccion()}>
                Siguiente lección →
              </Button>
            </div>
          </div>
        ) : (
          <div className={`h-full flex items-center justify-center ${isDark ? "text-[#A0A0A0]" : "text-gray-500"}`}>
            Selecciona un módulo y luego una lección para ver su contenido.
          </div>
        )}
      </main>
    </div>
  )
}