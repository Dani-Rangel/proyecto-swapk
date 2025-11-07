"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ImageIcon, Video, FileText, Trash2, GripVertical, Type } from "lucide-react"
import { type BloqueContenido, bloqueContenidoAPI } from "@/services/contenidoCursoApi"
import { RichTextEditor } from "@/components/ui/text_editor"

interface BloqueEditable extends BloqueContenido {
  tempId?: string
}

interface CursoContenidoEditorAreaProps {
  leccion: any | null
  cursoId: number
  isCreator: boolean
  onGuardar: () => void
}

export function CursoContenidoEditorArea({ leccion, isCreator, onGuardar }: CursoContenidoEditorAreaProps) {
  const [bloques, setBloques] = useState<BloqueEditable[]>([])
  const [loading, setLoading] = useState(true)

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
          setBloques(data.map((b) => ({ ...b })))
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
    setBloques((prev) => [...prev, nuevo])
  }

  const actualizarBloque = (index: number, campo: keyof BloqueContenido, valor: string) => {
    setBloques((prev) => {
      const nuevos = [...prev]
      nuevos[index] = { ...nuevos[index], [campo]: valor }
      return nuevos
    })
  }

  const eliminarBloque = (index: number) => {
    if (confirm("¿Eliminar este bloque?")) {
      setBloques((prev) => prev.filter((_, i) => i !== index))
    }
  }

  const moverBloque = (from: number, to: number) => {
    setBloques((prev) => {
      const nuevos = [...prev]
      const [movido] = nuevos.splice(from, 1)
      nuevos.splice(to, 0, movido)
      return nuevos.map((b, i) => ({ ...b, orden: i }))
    })
  }

  const handleGuardar = async () => {
    if (!leccion || leccion.nivel !== 2) return

    try {
      for (let i = 0; i < bloques.length; i++) {
        const b = bloques[i]
        const datos = { tipo: b.tipo, contenido: b.contenido, orden: i }

        if (b.tempId) {
          const nuevo = await bloqueContenidoAPI.crear(leccion.id, datos)
          setBloques((prev) => prev.map((p) => (p.tempId === b.tempId ? { ...nuevo, orden: i } : p)))
        } else {
          await bloqueContenidoAPI.actualizar(b.id, datos)
        }
      }

      onGuardar()
      alert("✅ Contenido guardado correctamente.")
    } catch (err) {
      console.error("Error al guardar bloques:", err)
      alert("❌ Error al guardar el contenido.")
    }
  }

  const renderBloqueEditor = (bloque: BloqueEditable, index: number) => {
    const tipoIcons = {
      texto: <Type size={16} />,
      video: <Video size={16} />,
      imagen: <ImageIcon size={16} />,
      archivo: <FileText size={16} />,
    }

    return (
      <div
        key={bloque.tempId || bloque.id}
        className="group relative bg-[#2E2E2E] border border-[#3E3E3E] rounded-lg p-4 hover:border-blue-800 hover:shadow-md transition-all"
      >
        {/* Block controls */}
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-[#3E3E3E]">
          <div className="flex items-center gap-2">
            <button className="text-gray-400 hover:text-gray-200 cursor-move">
              <GripVertical size={16} />
            </button>
            <Select value={bloque.tipo} onValueChange={(val) => actualizarBloque(index, "tipo", val)}>
              <SelectTrigger className="w-36 h-8 text-sm border-[#4E4E4E] bg-[#1A1A1A] text-gray-300">
                <div className="flex items-center gap-2">
                  {tipoIcons[bloque.tipo]}
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-[#2E2E2E] border-[#3E3E3E]">
                <SelectItem value="texto" className="text-gray-300">
                  <div className="flex items-center gap-2">
                    <Type size={14} />
                    Texto
                  </div>
                </SelectItem>
                <SelectItem value="video" className="text-gray-300">
                  <div className="flex items-center gap-2">
                    <Video size={14} />
                    Video
                  </div>
                </SelectItem>
                <SelectItem value="imagen" className="text-gray-300">
                  <div className="flex items-center gap-2">
                    <ImageIcon size={14} />
                    Imagen
                  </div>
                </SelectItem>
                <SelectItem value="archivo" className="text-gray-300">
                  <div className="flex items-center gap-2">
                    <FileText size={14} />
                    Archivo
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => moverBloque(index, Math.max(0, index - 1))}
              disabled={index === 0}
              className="h-7 w-7 p-0 text-gray-400 hover:text-white hover:bg-[#3E3E3E]"
            >
              ↑
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => moverBloque(index, Math.min(bloques.length - 1, index + 1))}
              disabled={index === bloques.length - 1}
              className="h-7 w-7 p-0 text-gray-400 hover:text-white hover:bg-[#3E3E3E]"
            >
              ↓
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => eliminarBloque(index)}
              className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-950"
            >
              <Trash2 size={14} />
            </Button>
          </div>
        </div>

        {/* Block content */}
        {bloque.tipo === "texto" && (
          <RichTextEditor
            value={bloque.contenido}
            onChange={(val) => actualizarBloque(index, "contenido", val)}
            placeholder="Escribe el contenido de la lección aquí..."
            rows={8}
          />
        )}

        {bloque.tipo === "video" && (
          <div className="space-y-3">
            <Input
              value={bloque.contenido}
              onChange={(e) => actualizarBloque(index, "contenido", e.target.value)}
              placeholder="URL del video (YouTube, Vimeo, etc.)"
              className="border-[#4E4E4E] bg-[#1A1A1A] text-gray-300 placeholder:text-gray-600 focus:border-blue-600"
            />
            {bloque.contenido && (
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <iframe
                  width="100%"
                  height="100%"
                  src={bloque.contenido}
                  title="Video preview"
                  allowFullScreen
                  className="border-0"
                />
              </div>
            )}
          </div>
        )}

        {bloque.tipo === "imagen" && (
          <div className="space-y-3">
            <Input
              value={bloque.contenido}
              onChange={(e) => actualizarBloque(index, "contenido", e.target.value)}
              placeholder="URL de la imagen"
              className="border-[#4E4E4E] bg-[#1A1A1A] text-gray-300 placeholder:text-gray-600 focus:border-blue-600"
            />
            {bloque.contenido && (
              <img
                src={bloque.contenido || "/placeholder.svg"}
                alt="Preview"
                className="max-w-full h-auto rounded-lg border border-[#3E3E3E]"
              />
            )}
          </div>
        )}

        {bloque.tipo === "archivo" && (
          <div className="space-y-3">
            <Input
              value={bloque.contenido}
              onChange={(e) => actualizarBloque(index, "contenido", e.target.value)}
              placeholder="URL del archivo"
              className="border-[#4E4E4E] bg-[#1A1A1A] text-gray-300 placeholder:text-gray-600 focus:border-blue-600"
            />
            {bloque.contenido && (
              <a
                href={bloque.contenido}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <FileText size={16} />
                Ver archivo
              </a>
            )}
          </div>
        )}
      </div>
    )
  }

  if (!leccion) {
    return (
      <div className="bg-[#2E2E2E] rounded-xl shadow-sm p-12 text-center border border-[#3E3E3E]">
        <FileText size={48} className="mx-auto text-gray-600 mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Selecciona una lección</h3>
        <p className="text-gray-400 text-sm">Elige una lección del menú lateral para editar su contenido.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#2E2E2E] rounded-xl shadow-sm p-6 border border-[#3E3E3E]">
        <h2 className="text-2xl font-bold text-white mb-2">{leccion.titulo}</h2>
        <p className="text-sm text-gray-400">Edita el contenido de esta lección</p>
      </div>

      {loading ? (
        <div className="bg-[#2E2E2E] rounded-xl shadow-sm p-12 text-center border border-[#3E3E3E]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando contenido...</p>
        </div>
      ) : (
        <>
          {/* Blocks */}
          <div className="space-y-4">{bloques.map((bloque, index) => renderBloqueEditor(bloque, index))}</div>

          {/* Add block buttons */}
          <div className="bg-[#2E2E2E] rounded-xl shadow-sm p-6 border border-[#3E3E3E]">
            <p className="text-sm font-medium text-gray-300 mb-3">Agregar contenido:</p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => agregarBloque("texto")}
                variant="outline"
                className="gap-2 border-[#4E4E4E] text-gray-300 hover:bg-[#3E3E3E] hover:text-white"
              >
                <Type size={16} />
                Texto
              </Button>
              <Button
                size="sm"
                onClick={() => agregarBloque("imagen")}
                variant="outline"
                className="gap-2 border-[#4E4E4E] text-gray-300 hover:bg-[#3E3E3E] hover:text-white"
              >
                <ImageIcon size={16} />
                Imagen
              </Button>
              <Button
                size="sm"
                onClick={() => agregarBloque("video")}
                variant="outline"
                className="gap-2 border-[#4E4E4E] text-gray-300 hover:bg-[#3E3E3E] hover:text-white"
              >
                <Video size={16} />
                Video
              </Button>
              <Button
                size="sm"
                onClick={() => agregarBloque("archivo")}
                variant="outline"
                className="gap-2 border-[#4E4E4E] text-gray-300 hover:bg-[#3E3E3E] hover:text-white"
              >
                <FileText size={16} />
                Archivo
              </Button>
            </div>
          </div>

          {/* Save button */}
          <div className="sticky bottom-6 bg-[#2E2E2E] rounded-xl shadow-lg p-4 border border-[#3E3E3E]">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">
                {bloques.length} {bloques.length === 1 ? "bloque" : "bloques"} de contenido
              </p>
              <Button onClick={handleGuardar} className="bg-blue-600 hover:bg-blue-700 gap-2 text-white">
                Guardar contenido
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}