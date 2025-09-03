"use client"

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
import type { Curso, CreateCursoData, UpdateCursoData } from "@/types/course"
import type { Usuario } from "@/types/user"

interface CourseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  course?: Curso
  onSave: (data: CreateCursoData | UpdateCursoData) => void
  usuarios: Usuario[]
}

export function CourseDialog({ open, onOpenChange, course, onSave, usuarios }: CourseDialogProps) {
  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    objetivo: "",
    User_Id: 0,
    img_Cursos: "",
  })

  useEffect(() => {
    if (course) {
      setFormData({
        titulo: course.titulo,
        descripcion: course.descripcion,
        objetivo: course.objetivo,
        User_Id: course.User_Id,
        img_Cursos: course.img_Cursos || "",
      })
    } else {
      setFormData({
        titulo: "",
        descripcion: "",
        objetivo: "",
        User_Id: 0,
        img_Cursos: "",
      })
    }
  }, [course, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.titulo && formData.descripcion && formData.objetivo && formData.User_Id) {
      onSave(formData)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{course ? "Editar Curso" : "Crear Nuevo Curso"}</DialogTitle>
          <DialogDescription>
            {course ? "Modifica los datos del curso." : "Completa los datos para crear un nuevo curso."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="titulo">Título</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Título del curso"
                required
              />
            </div>
            <div>
              <Label htmlFor="objetivo">Objetivo</Label>
              <Input
                id="objetivo"
                value={formData.objetivo}
                onChange={(e) => setFormData({ ...formData, objetivo: e.target.value })}
                placeholder="Objetivo del curso"
                required
              />
            </div>
            <div>
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Descripción detallada del curso"
                rows={4}
                required
              />
            </div>
            <div>
              <Label htmlFor="instructor">Instructor</Label>
              <Select
                value={formData.User_Id.toString()}
                onValueChange={(value) => setFormData({ ...formData, User_Id: Number.parseInt(value) })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un instructor" />
                </SelectTrigger>
                <SelectContent>
                  {usuarios.map((usuario) => (
                    <SelectItem key={usuario.id} value={usuario.id.toString()}>
                      {usuario.nombre} - {usuario.correo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="imagen">URL de Imagen (opcional)</Label>
              <Input
                id="imagen"
                value={formData.img_Cursos}
                onChange={(e) => setFormData({ ...formData, img_Cursos: e.target.value })}
                placeholder="https://ejemplo.com/imagen.jpg"
                type="url"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">{course ? "Actualizar" : "Crear"} Curso</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
