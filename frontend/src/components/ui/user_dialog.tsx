"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { type Usuario, RolUsuario, type CreateUsuarioData, type UpdateUsuarioData } from "@/services/user"

interface UserDialogProps {
  user?: Usuario
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: CreateUsuarioData | UpdateUsuarioData) => void
}

export function UserDialog({ user, open, onOpenChange, onSave }: UserDialogProps) {
  const [formData, setFormData] = useState({
    nombre: user?.nombre || "",
    correo: user?.correo || "",
    contrasena: "",
    rol: user?.rol || RolUsuario.Usuario,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (user) {
      // Editing existing user
      const updateData: UpdateUsuarioData = {}
      if (formData.nombre !== user.nombre) updateData.nombre = formData.nombre
      if (formData.correo !== user.correo) updateData.correo = formData.correo
      if (formData.rol !== user.rol) updateData.rol = formData.rol
      onSave(updateData)
    } else {
      // Creating new user
      const createData: CreateUsuarioData = {
        nombre: formData.nombre,
        correo: formData.correo,
        contrasena: formData.contrasena,
        rol: formData.rol,
      }
      onSave(createData)
    }

    onOpenChange(false)
    setFormData({ nombre: "", correo: "", contrasena: "", rol: RolUsuario.Usuario })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{user ? "Editar Usuario" : "Crear Nuevo Usuario"}</DialogTitle>
          <DialogDescription>
            {user ? "Modifica los datos del usuario seleccionado." : "Completa los datos para crear un nuevo usuario."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nombre" className="text-right">
                Nombre
              </Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="correo" className="text-right">
                Correo
              </Label>
              <Input
                id="correo"
                type="email"
                value={formData.correo}
                onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                className="col-span-3"
                required
              />
            </div>
            {!user && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="contrasena" className="text-right">
                  Contraseña
                </Label>
                <Input
                  id="contrasena"
                  type="password"
                  value={formData.contrasena}
                  onChange={(e) => setFormData({ ...formData, contrasena: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rol" className="text-right">
                Rol
              </Label>
              <Select
                value={formData.rol}
                onValueChange={(value: RolUsuario) => setFormData({ ...formData, rol: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={RolUsuario.Usuario}>Usuario</SelectItem>
                  <SelectItem value={RolUsuario.Moderador}>Moderador</SelectItem>
                  <SelectItem value={RolUsuario.Administrador}>Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">{user ? "Guardar Cambios" : "Crear Usuario"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
