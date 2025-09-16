"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Publicacion, TipoPublicacion, CreatePublicacionData, UpdatePublicacionData } from "@/services/publicacionAdmin"

interface PublicacionDialogProps {
  publicacion?: Publicacion
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: CreatePublicacionData | UpdatePublicacionData) => void
  idUsuarioActual: number
}

export function PublicacionDialog({ publicacion, open, onOpenChange, onSave, idUsuarioActual }: PublicacionDialogProps) {
  const [formData, setFormData] = useState({
    titulo: "",
    contenido: "",
    tipo: "Intercambio" as TipoPublicacion,
    imagen: "",
  })

  // Carga datos si editamos
  useEffect(() => {
    if (publicacion) {
      setFormData({
        titulo: publicacion.titulo,
        contenido: publicacion.contenido,
        tipo: publicacion.tipo,
        imagen: publicacion.imagen ?? "",
      })
    } else {
      setFormData({
        titulo: "",
        contenido: "",
        tipo: "Intercambio",
        imagen: "",
      })
    }
  }, [publicacion])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (publicacion) {
      // Actualizar
      const updateData: UpdatePublicacionData = {}
      if (formData.titulo !== publicacion.titulo) updateData.titulo = formData.titulo
      if (formData.contenido !== publicacion.contenido) updateData.contenido = formData.contenido
      if (formData.tipo !== publicacion.tipo) updateData.tipo = formData.tipo
      if (formData.imagen !== (publicacion.imagen ?? "")) updateData.imagen = formData.imagen || null

      onSave(updateData)
    } else {
      // Crear nueva publicación
      const createData: CreatePublicacionData = {
        titulo: formData.titulo,
        contenido: formData.contenido,
        tipo: formData.tipo,
        imagen: formData.imagen || null,
        id_usuario: idUsuarioActual,
      }
      onSave(createData)
    }

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{publicacion ? "Editar Publicación" : "Nueva Publicación"}</DialogTitle>
          <DialogDescription>
            {publicacion
              ? "Modifica los datos de la publicación."
              : "Completa el formulario para crear una nueva publicación."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4 text-white">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="titulo" className="text-right">
              Título
            </Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              className="col-span-3"
              required
              autoFocus
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="contenido" className="text-right">
              Contenido
            </Label>
            <textarea
              id="contenido"
              value={formData.contenido}
              onChange={(e) => setFormData({ ...formData, contenido: e.target.value })}
              className="col-span-3 rounded-md border border-gray-700 bg-[#1e1e1e] p-2 text-white"
              rows={4}
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tipo" className="text-right">
              Tipo
            </Label>
            <Select
              value={formData.tipo}
              onValueChange={(value: TipoPublicacion) => setFormData({ ...formData, tipo: value })}
            >
              <SelectTrigger id="tipo" className="col-span-3">
                <SelectValue placeholder="Selecciona un tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Intercambio">Intercambio</SelectItem>
                <SelectItem value="Curso">Curso</SelectItem>
                <SelectItem value="Pregunta">Pregunta</SelectItem>
                <SelectItem value="Logro">Logro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="imagen" className="text-right">
              URL Imagen
            </Label>
            <Input
              id="imagen"
              value={formData.imagen}
              onChange={(e) => setFormData({ ...formData, imagen: e.target.value })}
              className="col-span-3"
              placeholder="Opcional"
              type="url"
            />
          </div>
          <DialogFooter>
            <Button type="submit">{publicacion ? "Guardar Cambios" : "Crear Publicación"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}