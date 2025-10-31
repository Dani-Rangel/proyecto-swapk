// src/components/ui/contenido-curso/CursoContenidoEditorNav.tsx
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react"
import { contenidoCursoAPI, ContenidoItem } from "@/services/contenidoCursoApi"

interface ModuloConLecciones {
  modulo: ContenidoItem
  lecciones: ContenidoItem[]
}

interface CursoContenidoEditorNavProps {
  cursoId: number
  isDark: boolean
  onLeccionSeleccionada: (leccion: ContenidoItem | null) => void
}

export function CursoContenidoEditorNav({ cursoId, isDark, onLeccionSeleccionada }: CursoContenidoEditorNavProps) {
  const [estructura, setEstructura] = useState<ModuloConLecciones[]>([])
  const [loading, setLoading] = useState(true)
  const [moduloSeleccionado, setModuloSeleccionado] = useState<number | null>(null)
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
          titulo: "",
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

  const agregarLeccion = () => {
    if (moduloSeleccionado === null) return

    setEstructura((prev) => {
      const nuevas = [...prev]
      const indiceModulo = nuevas.findIndex(m => m.modulo.id === moduloSeleccionado)
      if (indiceModulo !== -1) {
        nuevas[indiceModulo].lecciones.push({
          titulo: "",
          tipo: "texto",
          contenido: "",
          orden: nuevas[indiceModulo].lecciones.length,
          nivel: 2,
          parent_id: moduloSeleccionado,
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

  const actualizarLeccion = (moduloIndex: number, leccionIndex: number, campo: keyof ContenidoItem, valor: string | number | null) => {
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
    setEstructura((prev) => {
      const nuevas = [...prev]
      nuevas.splice(moduloIndex, 1)
      return nuevas
    })
  }

  const eliminarLeccion = (moduloIndex: number, leccionIndex: number) => {
    setEstructura((prev) => {
      const nuevas = [...prev]
      nuevas[moduloIndex].lecciones.splice(leccionIndex, 1)
      return nuevas
    })
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

  // Actualizar la lección seleccionada cuando cambia
  useEffect(() => {
    if (leccionSeleccionada !== null) {
      const leccion = estructura
        .flatMap(m => m.lecciones)
        .find(l => l.id === leccionSeleccionada)
      onLeccionSeleccionada(leccion || null)
    } else {
      onLeccionSeleccionada(null)
    }
  }, [leccionSeleccionada, estructura])

  if (loading) return <div>Cargando...</div>

  return (
    <div className={`p-4 rounded-lg ${isDark ? "bg-[#2E2E2E]" : "bg-gray-50"} h-full flex flex-col`}>
      <h3 className="text-lg font-semibold mb-4">Estructura del curso</h3>

      {/* Select de módulos */}
      <div className="mb-4">
        <Select value={moduloSeleccionado?.toString() || ""} onValueChange={(val) => setModuloSeleccionado(val ? parseInt(val) : null)}>
          <SelectTrigger className={isDark ? "bg-[#3E3E3E] text-[#F5F5F5] border-[#4E4E4E]" : "border"}>
            <SelectValue placeholder="Selecciona un módulo" />
          </SelectTrigger>
          <SelectContent className={isDark ? "bg-[#2E2E2E] text-[#F5F5F5] border-[#4E4E4E]" : "bg-white"}>
            {estructura.map((item, i) => (
              <SelectItem key={i} value={item.modulo.id?.toString() || `temp-${i}`}>
                {item.modulo.titulo || `Módulo ${i + 1}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Botón para agregar módulo */}
      <Button onClick={agregarModulo} variant="outline" size="sm" className="mb-4">
        <Plus size={16} className="mr-1" /> Agregar módulo
      </Button>

      {/* Select de lecciones (solo si hay módulo seleccionado) */}
      {moduloSeleccionado !== null && (
        <div className="mb-4">
          <Select value={leccionSeleccionada?.toString() || ""} onValueChange={(val) => setLeccionSeleccionada(val ? parseInt(val) : null)}>
            <SelectTrigger className={isDark ? "bg-[#3E3E3E] text-[#F5F5F5] border-[#4E4E4E]" : "border"}>
              <SelectValue placeholder="Selecciona una lección" />
            </SelectTrigger>
            <SelectContent className={isDark ? "bg-[#2E2E2E] text-[#F5F5F5] border-[#4E4E4E]" : "bg-white"}>
              {estructura
                .find(m => m.modulo.id === moduloSeleccionado)
                ?.lecciones.map((lec, j) => (
                  <SelectItem key={j} value={lec.id?.toString() || `temp-${j}`}>
                    {lec.titulo || `Lección ${j + 1}`}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Botón para agregar lección (solo si hay módulo seleccionado) */}
      {moduloSeleccionado !== null && (
        <Button onClick={agregarLeccion} variant="outline" size="sm" className="mb-4">
          <Plus size={16} className="mr-1" /> Agregar lección
        </Button>
      )}

      {/* Lista de módulos y lecciones (para edición rápida) */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {estructura.map((item, i) => (
          <div key={i} className={`p-3 rounded ${isDark ? "bg-[#3E3E3E]" : "bg-white"} border`}>
            <div className="flex items-center justify-between mb-2">
              <Input
                placeholder="Nombre del módulo"
                value={item.modulo.titulo}
                onChange={(e) => actualizarModulo(i, "titulo", e.target.value)}
                className={isDark ? "bg-[#2E2E2E] border-[#4E4E4E] text-[#F5F5F5]" : ""}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => eliminarModulo(i)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 size={16} />
              </Button>
            </div>

            {/* Lecciones */}
            {item.lecciones.map((leccion, j) => (
              <div key={j} className={`ml-4 p-2 rounded ${isDark ? "bg-[#2A2A2A]" : "bg-gray-100"} mt-2`}>
                <div className="flex items-center justify-between">
                  <Input
                    placeholder="Nombre de la lección"
                    value={leccion.titulo}
                    onChange={(e) => actualizarLeccion(i, j, "titulo", e.target.value)}
                    className={isDark ? "bg-[#2E2E2E] border-[#4E4E4E] text-[#F5F5F5]" : ""}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => eliminarLeccion(i, j)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Botón de guardar */}
      <div className="mt-4">
        <Button onClick={guardarTodo}>💾 Guardar estructura</Button>
      </div>
    </div>
  )
}