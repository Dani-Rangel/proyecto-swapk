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
import {
  Publicacion,
  TipoPublicacion,
  CreatePublicacionData,
  UpdatePublicacionData,
  PublicacionService,
} from "@/services/publicacionAdmin"
import { Plus, Save } from "lucide-react"

interface UsuarioRelacionado {
  id: number
  nombre: string
  correo: string
}

interface PerfilRelacionado {
  id: number
}

interface PublicacionDialogProps {
  publicacion?: Publicacion
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: CreatePublicacionData | UpdatePublicacionData) => void
}

export function PublicacionDialog({
  publicacion,
  open,
  onOpenChange,
  onSave,
}: PublicacionDialogProps) {
  const [formData, setFormData] = useState({
    titulo: "",
    contenido: "",
    tipo: "Intercambio" as TipoPublicacion,
    imagen: "",
    id_usuario: 0,
    id_perfil: 0,
  })

  const [usuarios, setUsuarios] = useState<UsuarioRelacionado[]>([])
  const [perfiles, setPerfiles] = useState<PerfilRelacionado[]>([])
  const [loading, setLoading] = useState(false)

  // 🚀 Cargar usuarios y perfiles al montar
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [usuariosData, perfilesData] = await Promise.all([
          PublicacionService.listarUsuarios(),
          PublicacionService.listarPerfiles(),
        ])
        setUsuarios(usuariosData)
        setPerfiles(perfilesData)
      } catch (err) {
        console.error("Error al cargar usuarios o perfiles:", err)
      }
    }
    cargarDatos()
  }, [])

  // 🔄 Cargar datos si estamos editando
  useEffect(() => {
    if (publicacion) {
      setFormData({
        titulo: publicacion.titulo || "",
        contenido: publicacion.contenido || "",
        tipo: publicacion.tipo || "Intercambio",
        imagen: publicacion.imagen || "",
        id_usuario: publicacion.id_usuario || 0,
        id_perfil: publicacion.id_perfil || 0,
      })
    } else {
      setFormData({
        titulo: "",
        contenido: "",
        tipo: "Intercambio",
        imagen: "",
        id_usuario: 0,
        id_perfil: 0,
      })
    }
  }, [publicacion])

  // ✅ Validación: título, contenido, usuario y tipo son obligatorios
  const isFormValid =
    formData.titulo.trim().length > 0 &&
    formData.contenido.trim().length > 0 &&
    formData.id_usuario > 0 &&
    formData.tipo.length > 0

  // 📤 Manejar envío
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!isFormValid) {
      alert("Por favor, completa todos los campos obligatorios.")
      return
    }

    const dataToSend = {
      titulo: formData.titulo,
      contenido: formData.contenido,
      tipo: formData.tipo,
      imagen: formData.imagen || null,
      id_usuario: formData.id_usuario,
      id_perfil: formData.id_perfil > 0 ? formData.id_perfil : undefined,
    }

    console.log("🚀 Enviando datos de publicación:", dataToSend)
    onSave(dataToSend)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[550px] bg-gray-900 border border-gray-700 shadow-2xl backdrop-blur-sm rounded-xl p-6 text-white"
        aria-modal="true"
        role="dialog"
      >
        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl font-bold text-white">
            {publicacion ? (
                                                        <>
                                                          <Save className="w-4 h-4" /> Editar Publicacion
                                                        </>
                                                      ) : (
                                                        <>
                                                          <Plus className="w-4 h-4" /> Crear Nueva Publicacion
                                                        </>
                                                      )}
          </DialogTitle>
          <DialogDescription className="text-gray-300 mt-2">
            {publicacion
              ? "Modifica los datos de la publicación."
              : "Completa el formulario para crear una nueva publicación."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* === Título === */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="titulo" className="text-right text-gray-200 font-medium">
              Título
            </Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              className="col-span-3 bg-gray-800 border border-gray-600 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              required
              placeholder="Ej: Mi primer intercambio"
              autoFocus
            />
          </div>

          {/* === Contenido === */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="contenido" className="text-right text-gray-200 font-medium">
              Contenido
            </Label>
            <textarea
              id="contenido"
              value={formData.contenido}
              onChange={(e) => setFormData({ ...formData, contenido: e.target.value })}
              className="col-span-3 bg-gray-800 border border-gray-600 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all p-3 rounded-md resize-none"
              rows={4}
              required
              placeholder="Describe tu publicación..."
            />
          </div>

          {/* === Tipo === */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tipo" className="text-right text-gray-200 font-medium">
              Tipo
            </Label>
            <Select
              value={formData.tipo}
              onValueChange={(value: TipoPublicacion) =>
                setFormData({ ...formData, tipo: value })
              }
            >
              <SelectTrigger
                id="tipo"
                className="col-span-3 bg-gray-800 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                <SelectValue placeholder="Selecciona un tipo" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border border-gray-600 text-white">
                {(["Intercambio", "Curso", "Pregunta", "Logro"] as TipoPublicacion[]).map(
                  (tipo) => (
                    <SelectItem
                      key={tipo}
                      value={tipo}
                      className="hover:bg-blue-600 focus:bg-blue-600 cursor-pointer transition-colors"
                    >
                      {tipo}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          {/* === Usuario === */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="usuario" className="text-right text-gray-200 font-medium">
              Usuario
            </Label>
            <Select
              key={usuarios.length || 0}
              value={formData.id_usuario > 0 ? formData.id_usuario.toString() : ""}
              onValueChange={(value) =>
                setFormData({ ...formData, id_usuario: Number(value) })
              }
            >
              <SelectTrigger
                id="usuario"
                className="col-span-3 bg-gray-800 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                <SelectValue placeholder="Selecciona usuario" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border border-gray-600 text-white">
                {usuarios.length > 0 ? (
                  usuarios.map((usuario) => (
                    <SelectItem
                      key={usuario.id}
                      value={usuario.id.toString()}
                      className="hover:bg-blue-600 focus:bg-blue-600 cursor-pointer transition-colors"
                    >
                      {usuario.nombre} ({usuario.correo})
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="" disabled>
                    Cargando usuarios...
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* === Perfil === */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="perfil" className="text-right text-gray-200 font-medium">
              Perfil
            </Label>
            <Select
              key={perfiles.length || 0}
              value={formData.id_perfil > 0 ? formData.id_perfil.toString() : ""}
              onValueChange={(value) =>
                setFormData({ ...formData, id_perfil: Number(value) })
              }
            >
              <SelectTrigger
                id="perfil"
                className="col-span-3 bg-gray-800 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                <SelectValue placeholder="Opcional: selecciona perfil" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border border-gray-600 text-white">
                <SelectItem value="0" className="text-gray-400">
                  — Sin perfil —
                </SelectItem>
                {perfiles.length > 0 ? (
                  perfiles.map((perfil) => (
                    <SelectItem
                      key={perfil.id}
                      value={perfil.id.toString()}
                      className="hover:bg-blue-600 focus:bg-blue-600 cursor-pointer transition-colors"
                    >
                      Perfil {perfil.id}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="" disabled>
                    Cargando perfiles...
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* === Imagen === */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="imagen" className="text-right text-gray-200 font-medium">
              URL Imagen
            </Label>
            <Input
              id="imagen"
              value={formData.imagen}
              onChange={(e) => setFormData({ ...formData, imagen: e.target.value })}
              className="col-span-3 bg-gray-800 border border-gray-600 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="Opcional: https://ejemplo.com/imagen.jpg"
              type="url"
            />
          </div>

          {/* === Footer === */}
          <DialogFooter className="mt-8 pt-4 border-t border-gray-700">
            <Button
              type="submit"
              disabled={!isFormValid}
              className={`w-full py-3 text-lg font-semibold transition-all duration-200 ${
                isFormValid
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  : "bg-gray-700 cursor-not-allowed text-gray-500"
              }`}
            >
              {publicacion ? (
                                                          <>
                                                            <Save className="w-4 h-4" /> Actualizar Publicacion
                                                          </>
                                                        ) : (
                                                          <>
                                                            <Plus className="w-4 h-4" /> Crear Pubilcacion
                                                          </>
                                                        )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}