"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Trash2, FolderOpen, FileText } from "lucide-react"
import { contenidoCursoAPI, type ContenidoItem } from "@/services/contenidoCursoApi"

interface ModuloConLecciones {
  modulo: ContenidoItem
  lecciones: ContenidoItem[]
}

interface CursoContenidoEditorNavProps {
  cursoId: number
  onLeccionSeleccionada: (leccion: ContenidoItem | null) => void
}

export function CursoContenidoEditorNav({ cursoId, onLeccionSeleccionada }: CursoContenidoEditorNavProps) {
  const [estructura, setEstructura] = useState<ModuloConLecciones[]>([])
  const [loading, setLoading] = useState(true)
  const [moduloExpandido, setModuloExpandido] = useState<number | null>(null)
  const [leccionSeleccionada, setLeccionSeleccionada] = useState<number | null>(null)

  useEffect(() => {
    cargarContenido()
  }, [cursoId])

  const cargarContenido = async () => {
    try {
      const data = await contenidoCursoAPI.obtenerPorCurso(cursoId)
      const modulos = data.contenido.filter((item) => item.nivel === 1)
      const lecciones = data.contenido.filter((item) => item.nivel === 2)

      const estructuraConLecciones = modulos.map((modulo) => ({
        modulo,
        lecciones: lecciones.filter((lec) => lec.parent_id === modulo.id),
      }))

      setEstructura(estructuraConLecciones)

      if (estructuraConLecciones.length > 0 && !moduloExpandido) {
        setModuloExpandido(estructuraConLecciones[0].modulo.id || null)
      }
    } catch (err) {
      console.error("Error al cargar contenido:", err)
    } finally {
      setLoading(false)
    }
  }

  const agregarModulo = () => {
    setEstructura((prev) => [
      ...prev,
      {
        modulo: {
          titulo: `Módulo ${prev.length + 1}`,
          tipo: "texto",
          contenido: "",
          orden: prev.length,
          nivel: 1,
          parent_id: null,
        },
        lecciones: [],
      },
    ])
  }

  const agregarLeccion = (moduloId: number) => {
    setEstructura((prev) => {
      const nuevas = [...prev]
      const indiceModulo = nuevas.findIndex((m) => m.modulo.id === moduloId)
      if (indiceModulo !== -1) {
        const numLecciones = nuevas[indiceModulo].lecciones.length
        nuevas[indiceModulo].lecciones.push({
          titulo: `Lección ${numLecciones + 1}`,
          tipo: "texto",
          contenido: "",
          orden: numLecciones,
          nivel: 2,
          parent_id: moduloId,
        })
      }
      return nuevas
    })
  }

  const actualizarModulo = (moduloIndex: number, campo: keyof ContenidoItem, valor: string | number | null) => {
    setEstructura((prev) => {
      const nuevas = [...prev]
      nuevas[moduloIndex].modulo = { ...nuevas[moduloIndex].modulo, [campo]: valor }
      return nuevas
    })
  }

  const actualizarLeccion = (
    moduloIndex: number,
    leccionIndex: number,
    campo: keyof ContenidoItem,
    valor: string | number | null,
  ) => {
    setEstructura((prev) => {
      const nuevas = [...prev]
      nuevas[moduloIndex].lecciones[leccionIndex] = {
        ...nuevas[moduloIndex].lecciones[leccionIndex],
        [campo]: valor,
      }
      return nuevas
    })
  }

  const eliminarModulo = (moduloIndex: number) => {
    if (confirm("¿Estás seguro de eliminar este módulo y todas sus lecciones?")) {
      setEstructura((prev) => prev.filter((_, i) => i !== moduloIndex))
    }
  }

  const eliminarLeccion = (moduloIndex: number, leccionIndex: number) => {
    if (confirm("¿Estás seguro de eliminar esta lección?")) {
      setEstructura((prev) => {
        const nuevas = [...prev]
        nuevas[moduloIndex].lecciones.splice(leccionIndex, 1)
        return nuevas
      })
    }
  }

  const guardarTodo = async () => {
    try {
      const nuevasEstructura = [...estructura]

      for (let i = 0; i < nuevasEstructura.length; i++) {
        const mod = nuevasEstructura[i].modulo
        let moduloGuardado: ContenidoItem

        if (mod.id !== undefined) {
          moduloGuardado = await contenidoCursoAPI.actualizar(mod.id, mod)
        } else {
          moduloGuardado = await contenidoCursoAPI.crear(cursoId, mod)
          nuevasEstructura[i].modulo = moduloGuardado
        }

        for (let j = 0; j < nuevasEstructura[i].lecciones.length; j++) {
          const lec = nuevasEstructura[i].lecciones[j]
          const leccionParaAPI = {
            ...lec,
            parent_id: moduloGuardado.id ?? null,
          }

          if (lec.id !== undefined) {
            await contenidoCursoAPI.actualizar(lec.id, leccionParaAPI)
          } else {
            const leccionGuardada = await contenidoCursoAPI.crear(cursoId, leccionParaAPI)
            nuevasEstructura[i].lecciones[j] = leccionGuardada
          }
        }
      }

      setEstructura(nuevasEstructura)
      alert("✅ Estructura del curso guardada correctamente.")
      cargarContenido()
    } catch (err) {
      console.error("Error al guardar:", err)
      alert("❌ Error al guardar la estructura del curso.")
    }
  }

  const handleSeleccionarLeccion = (leccion: ContenidoItem) => {
    setLeccionSeleccionada(leccion.id || null)
    onLeccionSeleccionada(leccion)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Button
        onClick={agregarModulo}
        variant="outline"
        size="sm"
        className="w-full justify-start gap-2 border-dashed border-2 border-[#4E4E4E] hover:border-blue-600 hover:text-blue-400 bg-transparent text-gray-300"
      >
        <Plus size={16} />
        Agregar módulo
      </Button>

      {/* Modules list */}
      <div className="space-y-3">
        {estructura.map((item, i) => {
          const isExpanded = moduloExpandido === item.modulo.id

          return (
            <div key={i} className="border border-[#3E3E3E] rounded-lg overflow-hidden bg-[#2E2E2E]">
              {/* Module header */}
              <div className="bg-[#2A2A2A] border-b border-[#3E3E3E]">
                <div className="flex items-center gap-2 p-3">
                  <button
                    onClick={() => setModuloExpandido(isExpanded ? null : item.modulo.id || null)}
                    className="flex-shrink-0 text-gray-400 hover:text-gray-200"
                  >
                    <FolderOpen size={18} />
                  </button>
                  <Input
                    placeholder="Nombre del módulo"
                    value={item.modulo.titulo}
                    onChange={(e) => actualizarModulo(i, "titulo", e.target.value)}
                    className="flex-1 h-8 text-sm font-medium border-0 bg-transparent focus-visible:ring-1 text-white placeholder:text-gray-500"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => eliminarModulo(i)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-950 h-8 w-8 p-0"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>

              {/* Lessons */}
              {isExpanded && (
                <div className="p-2 space-y-1">
                  {item.lecciones.map((leccion, j) => {
                    const isSelected = leccionSeleccionada === leccion.id

                    return (
                      <div
                        key={j}
                        className={`flex items-center gap-2 p-2 rounded-md transition-colors ${
                          isSelected ? "bg-blue-950 border border-blue-800" : "hover:bg-[#3E3E3E]"
                        }`}
                      >
                        <button
                          onClick={() => handleSeleccionarLeccion(leccion)}
                          className="flex-shrink-0 text-gray-400 hover:text-gray-200"
                        >
                          <FileText size={16} />
                        </button>
                        <Input
                          placeholder="Nombre de la lección"
                          value={leccion.titulo}
                          onChange={(e) => actualizarLeccion(i, j, "titulo", e.target.value)}
                          onClick={() => handleSeleccionarLeccion(leccion)}
                          className={`flex-1 h-7 text-sm border-0 bg-transparent focus-visible:ring-1 text-gray-300 placeholder:text-gray-600 ${
                            isSelected ? "font-medium text-blue-400" : ""
                          }`}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => eliminarLeccion(i, j)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-950 h-7 w-7 p-0"
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    )
                  })}

                  {/* Add lesson button */}
                  <Button
                    onClick={() => agregarLeccion(item.modulo.id!)}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2 text-gray-400 hover:text-blue-400 hover:bg-[#3E3E3E] h-8 mt-1"
                  >
                    <Plus size={14} />
                    <span className="text-xs">Agregar lección</span>
                  </Button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {!estructura.length && (
        <div className="text-center py-8 text-gray-400 text-sm">
          <FolderOpen size={48} className="mx-auto text-gray-600 mb-3" />
          <p>No hay módulos aún.</p>
          <p className="text-xs mt-1">Haz clic en "Agregar módulo" para comenzar.</p>
        </div>
      )}

      {/* Save button */}
      {estructura.length > 0 && (
        <Button onClick={guardarTodo} className="w-full bg-blue-600 hover:bg-blue-700 gap-2 text-white">
          Guardar estructura
        </Button>
      )}
    </div>
  )
}
