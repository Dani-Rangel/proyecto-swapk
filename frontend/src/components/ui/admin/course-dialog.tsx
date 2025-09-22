// src/components/your-path/CourseDialog.tsx
import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,  
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Curso, CreateCursoData, UpdateCursoData } from "@/services/course"
import type { Usuario } from "@/services/user"
import { Plus, Save } from "lucide-react"

interface CourseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  course?: Curso
  onSave: (data: CreateCursoData | UpdateCursoData) => void
  usuarios: Usuario[]
}

export function CourseDialog({ open, onOpenChange, course, onSave, usuarios }: CourseDialogProps) {
  const [formData, setFormData] = useState<CreateCursoData>({
    titulo: "",
    descripcion: "",
    objetivo: "",
    user_id: 0,
    img_Cursos: "",   // si no existe imagen lo mandas vacío
  })

  useEffect(() => {
    if (open) {
      if (course) {
        // Cargar datos en edición
        setFormData({
          titulo: course.titulo || "",
          descripcion: course.descripcion || "",
          objetivo: course.objetivo || "",
          user_id: course.user_id,  // debe existir en course
          img_Cursos: course.img_Cursos ?? "", 
        })
      } else {
        // Reset en creación
        setFormData({
          titulo: "",
          descripcion: "",
          objetivo: "",
          user_id: 0,
          img_Cursos: "",
        })
      }
    }
  }, [course, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validaciones mínimas: los campos que consideras obligatorios
    if (!formData.titulo.trim()) {
      alert("El título es obligatorio")
      return
    }
    if (formData.user_id === 0) {
      alert("Selecciona un instructor")
      return
    }

    if (course) {
      const updateData: UpdateCursoData = {
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        objetivo: formData.objetivo,
        user_id: formData.user_id,
        img_Cursos: formData.img_Cursos || undefined,  // si está vacío, envía undefined
      }
      onSave(updateData)
    } else {
      const createData: CreateCursoData = {
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        objetivo: formData.objetivo,
        user_id: formData.user_id,
        img_Cursos: formData.img_Cursos || undefined,
      }
      onSave(createData)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[600px] bg-gray-900 border border-gray-700 shadow-2xl backdrop-blur-sm rounded-xl p-6 text-white"
        aria-modal="true"
        role="dialog"
      >
        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl font-bold text-white">
            {course ? (
                              <>
                                <Save className="w-4 h-4" /> Editar Curso
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4" /> Crear Nuevo Curso
                              </>
                            )}
          </DialogTitle>
          <DialogDescription className="text-gray-300 mt-2">
            {course
              ? "Modifica los datos del curso."
              : "Completa los datos para crear un nuevo curso."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* === Título === */}
          <div>
            <Label htmlFor="titulo" className="text-gray-200 font-medium block mb-2">
              Título
            </Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              placeholder="Título del curso"
              required
              className="w-full bg-gray-800 border border-gray-600 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>

          {/* === Objetivo === */}
          <div>
            <Label htmlFor="objetivo" className="text-gray-200 font-medium block mb-2">
              Objetivo
            </Label>
            <Input
              id="objetivo"
              value={formData.objetivo}
              onChange={(e) => setFormData({ ...formData, objetivo: e.target.value })}
              placeholder="Objetivo del curso"
              required
              className="w-full bg-gray-800 border border-gray-600 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>

          {/* === Descripción === */}
          <div>
            <Label htmlFor="descripcion" className="text-gray-200 font-medium block mb-2">
              Descripción
            </Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder="Descripción detallada del curso"
              rows={4}
              required
              className="w-full bg-gray-800 border border-gray-600 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none p-3 rounded-md"
            />
          </div>

          {/* === Instructor === */}
          <div>
            <Label htmlFor="instructor" className="text-gray-200 font-medium block mb-2">
              Instructor
            </Label>
            <Select
              key={usuarios.length || 0}
              value={formData.user_id > 0 ? String(formData.user_id) : ""}
              onValueChange={(value) => {
                const num = Number(value)
                if (!isNaN(num)) {
                  setFormData({ ...formData, user_id: num })
                }
              }}
            >
              <SelectTrigger className="w-full bg-gray-800 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all">
                <SelectValue placeholder="Selecciona un instructor" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border border-gray-600 text-white">
                {usuarios.length > 0 ? (
                  usuarios.map((usuario) => (
                    <SelectItem
                      key={usuario.id}
                      value={usuario.id.toString()}
                      className="hover:bg-blue-600 focus:bg-blue-600 cursor-pointer transition-colors"
                    >
                      {usuario.nombre} — {usuario.correo}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="" disabled>
                    Cargando instructores...
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* === URL de Imagen === */}
          <div>
            <Label htmlFor="imagen" className="text-gray-200 font-medium block mb-2">
              URL de Imagen (opcional)
            </Label>
            <Input
              id="imagen"
              value={formData.img_Cursos}
              onChange={(e) => setFormData({ ...formData, img_Cursos: e.target.value })}
              placeholder="https://ejemplo.com/imagen.jpg"
              type="url"
              className="w-full bg-gray-800 border border-gray-600 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>

          {/* === Footer === */}
          <DialogFooter className="mt-8 pt-4 border-t border-gray-700 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white transition-all"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="w-full sm:w-auto py-3 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              {course ? (
                              <>
                                <Save className="w-4 h-4" /> Actualizar Curso
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4" /> Crear Curso
                              </>
                            )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}