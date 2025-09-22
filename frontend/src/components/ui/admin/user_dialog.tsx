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
} from "../dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { type Usuario, RolUsuario, type CreateUsuarioData, type UpdateUsuarioData } from "@/services/user"
import { Plus, Save } from "lucide-react"

interface UserDialogProps {
  user?: Usuario
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: CreateUsuarioData | UpdateUsuarioData) => void
}

export function UserDialog({ user, open, onOpenChange, onSave }: UserDialogProps) {
  const [formData, setFormData] = useState({
    nombre: "",
    correo: "",
    contrasena: "",
    rol: RolUsuario.Usuario,
  })

  // 🟢 ACTUALIZA los datos del formulario cuando cambie el usuario seleccionado
  useEffect(() => {
    if (user) {
      setFormData({
        nombre: user.nombre,
        correo: user.correo,
        contrasena: "",
        rol: user.rol,
      })
    } else {
      setFormData({
        nombre: "",
        correo: "",
        contrasena: "",
        rol: RolUsuario.Usuario,
      })
    }
  }, [user])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (user) {
      const updateData: UpdateUsuarioData = {}
      if (formData.nombre !== user.nombre) updateData.nombre = formData.nombre
      if (formData.correo !== user.correo) updateData.correo = formData.correo
      if (formData.rol !== user.rol) updateData.rol = formData.rol
      onSave(updateData)
    } else {
      const createData: CreateUsuarioData = {
        nombre: formData.nombre,
        correo: formData.correo,
        contrasena: formData.contrasena,
        rol: formData.rol,
      }
      onSave(createData)
    }

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[450px] bg-gray-900 border border-gray-700 shadow-2xl backdrop-blur-sm rounded-xl p-6 text-white"
        aria-modal="true"
        role="dialog"
      >
        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl font-bold text-white">
            {user ? (
                                            <>
                                              <Save className="w-4 h-4" /> Editar Usuario
                                            </>
                                          ) : (
                                            <>
                                              <Plus className="w-4 h-4" /> Crear Nuevo Usuario
                                            </>
                                          )}
          </DialogTitle>
          <DialogDescription className="text-gray-300 mt-2">
            {user
              ? "Modifica los datos del usuario seleccionado."
              : "Completa los datos para crear un nuevo usuario."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* === Nombre === */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="nombre" className="text-right text-gray-200 font-medium">
              Nombre
            </Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="col-span-3 bg-gray-800 border border-gray-600 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              required
              placeholder="Ej: Juan Pérez"
              autoFocus
            />
          </div>

          {/* === Correo === */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="correo" className="text-right text-gray-200 font-medium">
              Correo
            </Label>
            <Input
              id="correo"
              type="email"
              value={formData.correo}
              onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
              className="col-span-3 bg-gray-800 border border-gray-600 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              required
              placeholder="usuario@ejemplo.com"
            />
          </div>

          {/* === Contraseña (solo al crear) === */}
          {!user && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="contrasena" className="text-right text-gray-200 font-medium">
                Contraseña
              </Label>
              <Input
                id="contrasena"
                type="password"
                value={formData.contrasena}
                onChange={(e) => setFormData({ ...formData, contrasena: e.target.value })}
                className="col-span-3 bg-gray-800 border border-gray-600 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                required
                placeholder="••••••••"
              />
            </div>
          )}

          {/* === Rol === */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="rol" className="text-right text-gray-200 font-medium">
              Rol
            </Label>
            <Select
              value={formData.rol}
              onValueChange={(value: RolUsuario) => setFormData({ ...formData, rol: value })}
            >
              <SelectTrigger
                id="rol"
                className="col-span-3 bg-gray-800 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border border-gray-600 text-white">
                <SelectItem
                  value={RolUsuario.Usuario}
                  className="hover:bg-blue-600 focus:bg-blue-600 cursor-pointer transition-colors"
                >
                  Usuario
                </SelectItem>
                <SelectItem
                  value={RolUsuario.Moderador}
                  className="hover:bg-yellow-600 focus:bg-yellow-600 cursor-pointer transition-colors"
                >
                  Moderador
                </SelectItem>
                <SelectItem
                  value={RolUsuario.Administrador}
                  className="hover:bg-red-600 focus:bg-red-600 cursor-pointer transition-colors"
                >
                  Administrador
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* === Footer === */}
          <DialogFooter className="mt-8 pt-4 border-t border-gray-700">
            <Button
              type="submit"
              className="w-full py-3 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              {user ? (
                                            <>
                                              <Save className="w-4 h-4" /> Actualizar Usuario
                                            </>
                                          ) : (
                                            <>
                                              <Plus className="w-4 h-4" /> Crear Usuario
                                            </>
                                          )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}