// src/components/ui/contenido-curso/CursoContenidoEditorArea.tsx
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ImageIcon, Video, FileText, Plus, Trash2, Move } from "lucide-react"
import { BloqueContenido, bloqueContenidoAPI } from "@/services/contenidoCursoApi"

interface BloqueEditable extends BloqueContenido {
  tempId?: string // para nuevos bloques no guardados
}

interface CursoContenidoEditorAreaProps {
  leccion: any | null // ahora incluye bloques
  cursoId: number
  isDark: boolean
  isCreator: boolean
  onGuardar: () => void
}

export function CursoContenidoEditorArea({
  leccion,
  isDark,
  isCreator,
  onGuardar,
}: CursoContenidoEditorAreaProps) {
  const [bloques, setBloques] = useState<BloqueEditable[]>([])
  const [loading, setLoading] = useState(true)

  // Cargar bloques al cambiar de lección
  useEffect(() => {
    if (!leccion) {
      setBloques([])
      setLoading(false)
      return
    }

    const cargarBloques = async () => {
      try {
        if (leccion.nivel === 2 && leccion.id) {
          const data = await bloqueContenidoAPI.obtenerPorLeccion(leccion.id)
          setBloques(data.map(b => ({ ...b })))
        } else {
          setBloques([])
        }
      } catch (err) {
        console.error("Error al cargar bloques:", err)
        setBloques([])
      } finally {
        setLoading(false)
      }
    }

    cargarBloques()
  }, [leccion])

  const agregarBloque = (tipo: BloqueContenido["tipo"]) => {
    const nuevo: BloqueEditable = {
      id: 0,
      tipo,
      contenido: tipo === "texto" ? "" : "",
      orden: bloques.length,
      tempId: `temp-${Date.now()}`,
    }
    setBloques(prev => [...prev, nuevo])
  }

  const actualizarBloque = (index: number, campo: keyof BloqueContenido, valor: string) => {
    setBloques(prev => {
      const nuevos = [...prev]
      nuevos[index] = { ...nuevos[index], [campo]: valor }
      return nuevos
    })
  }

  const eliminarBloque = (index: number) => {
    setBloques(prev => prev.filter((_, i) => i !== index))
  }

  const moverBloque = (from: number, to: number) => {
    setBloques(prev => {
      const nuevos = [...prev]
      const [movido] = nuevos.splice(from, 1)
      nuevos.splice(to, 0, movido)
      return nuevos.map((b, i) => ({ ...b, orden: i }))
    })
  }

  const handleGuardar = async () => {
    if (!leccion || leccion.nivel !== 2) return

    try {
      // Guardar/actualizar/eliminar bloques
      for (let i = 0; i < bloques.length; i++) {
        const b = bloques[i]
        const datos = { tipo: b.tipo, contenido: b.contenido, orden: i }

        if (b.tempId) {
          // Nuevo bloque
          const nuevo = await bloqueContenidoAPI.crear(leccion.id, datos)
          setBloques(prev =>
            prev.map(p => (p.tempId === b.tempId ? { ...nuevo, orden: i } : p))
          )
        } else {
          // Actualizar
          await bloqueContenidoAPI.actualizar(b.id, datos)
        }
      }

      // TODO: eliminar bloques que ya no están (comparar con backend)
      // Por simplicidad, asumimos que no se eliminan bloques existentes aquí

      onGuardar()
      alert("✅ Contenido guardado correctamente.")
    } catch (err) {
      console.error("Error al guardar bloques:", err)
      alert("❌ Error al guardar el contenido.")
    }
  }

  const renderBloqueEditor = (bloque: BloqueEditable, index: number) => {
    const commonClasses = isDark
      ? "bg-[#2E2E2E] border-[#4E4E4E] text-[#F5F5F5]"
      : "bg-white border-gray-300"

    return (
      <div
        key={bloque.tempId || bloque.id}
        className={`p-4 rounded-lg mb-4 border ${commonClasses} relative`}
      >
        {/* Controles de edición (solo creador) */}
        {isCreator && (
          <div className="absolute top-2 right-2 flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => moverBloque(index, Math.max(0, index - 1))}
              disabled={index === 0}
            >
              <Move size={14} />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => eliminarBloque(index)}>
              <Trash2 size={14} className="text-red-500" />
            </Button>
          </div>
        )}

        <div className="mb-2">
          <Select
            value={bloque.tipo}
            onValueChange={val => actualizarBloque(index, "tipo", val)}
            disabled={!isCreator}
          >
            <SelectTrigger className={commonClasses}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className={isDark ? "bg-[#2E2E2E] text-[#F5F5F5]" : "bg-white"}>
              <SelectItem value="texto">Texto</SelectItem>
              <SelectItem value="video">Video</SelectItem>
              <SelectItem value="imagen">Imagen</SelectItem>
              <SelectItem value="archivo">Archivo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {bloque.tipo === "texto" && (
          <Textarea
            value={bloque.contenido}
            onChange={e => actualizarBloque(index, "contenido", e.target.value)}
            placeholder="Escribe tu contenido..."
            className={commonClasses}
            rows={6}
            disabled={!isCreator}
          />
        )}

        {bloque.tipo === "video" && (
          <div>
            <Input
              value={bloque.contenido}
              onChange={e => actualizarBloque(index, "contenido", e.target.value)}
              placeholder="Pega la URL del video (YouTube/Vimeo)"
              className={commonClasses}
              disabled={!isCreator}
            />
            {bloque.contenido && (
              <div className="mt-2 aspect-video bg-black rounded overflow-hidden">
                <iframe
                  width="100%"
                  height="100%"
                  src={bloque.contenido}
                  title="Video"
                  allowFullScreen
                  className="border-0"
                />
              </div>
            )}
          </div>
        )}

        {bloque.tipo === "imagen" && (
          <div>
            <Input
              value={bloque.contenido}
              onChange={e => actualizarBloque(index, "contenido", e.target.value)}
              placeholder="URL de la imagen"
              className={commonClasses}
              disabled={!isCreator}
            />
            {bloque.contenido && (
              <img
                src={bloque.contenido}
                alt="Imagen"
                className="mt-2 max-w-full h-auto rounded"
              />
            )}
          </div>
        )}

        {bloque.tipo === "archivo" && (
          <div>
            <Input
              value={bloque.contenido}
              onChange={e => actualizarBloque(index, "contenido", e.target.value)}
              placeholder="URL del archivo"
              className={commonClasses}
              disabled={!isCreator}
            />
            {bloque.contenido && (
              <a
                href={bloque.contenido}
                target="_blank"
                rel="noopener noreferrer"
                className={`mt-2 inline-block px-3 py-1 rounded ${
                  isDark ? "bg-blue-700" : "bg-blue-600"
                } text-white text-sm`}
              >
                📎 Abrir archivo
              </a>
            )}
          </div>
        )}
      </div>
    )
  }

  const renderBloqueLectura = (bloque: BloqueContenido) => {
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
          className="inline-block mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded"
        >
          📎 Descargar archivo
        </a>
      )
    }
    return null
  }

  if (!leccion) {
    return (
      <div className={`p-8 rounded-lg ${isDark ? "bg-[#2E2E2E]" : "bg-white"} text-center`}>
        <p className={isDark ? "text-[#A0A0A0]" : "text-gray-500"}>
          Selecciona una lección para ver su contenido.
        </p>
      </div>
    )
  }

  return (
    <div className={`p-6 rounded-lg ${isDark ? "bg-[#2E2E2E]" : "bg-white"} h-full flex flex-col`}>
      <h3 className={`text-xl font-semibold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>
        {leccion.titulo}
      </h3>

      {loading ? (
        <p className={isDark ? "text-[#A0A0A0]" : "text-gray-500"}>Cargando contenido...</p>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {isCreator ? (
            <>
              {/* Lista de bloques editables */}
              {bloques.map((bloque, index) => renderBloqueEditor(bloque, index))}

              {/* Botones para agregar bloques */}
              <div className="flex flex-wrap gap-2 mt-4">
                <Button size="sm" onClick={() => agregarBloque("texto")} variant="outline">
                  <Plus size={14} className="mr-1" /> Texto
                </Button>
                <Button size="sm" onClick={() => agregarBloque("imagen")} variant="outline">
                  <ImageIcon size={14} className="mr-1" /> Imagen
                </Button>
                <Button size="sm" onClick={() => agregarBloque("video")} variant="outline">
                  <Video size={14} className="mr-1" /> Video
                </Button>
                <Button size="sm" onClick={() => agregarBloque("archivo")} variant="outline">
                  <FileText size={14} className="mr-1" /> Archivo
                </Button>
              </div>

              <div className="mt-6">
                <Button onClick={handleGuardar}>💾 Guardar contenido</Button>
              </div>
            </>
          ) : (
            // Vista de solo lectura para estudiantes
            <div className="prose prose-invert max-w-none">
              {leccion.bloques && leccion.bloques.length > 0 ? (
                leccion.bloques.map((bloque: BloqueContenido) => (
                  <div key={bloque.id} className="mb-6">
                    {renderBloqueLectura(bloque)}
                  </div>
                ))
              ) : (
                <p className={isDark ? "text-[#A0A0A0]" : "text-gray-500"}>
                  Esta lección aún no tiene contenido.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}