"use client"

import React, { useState, useEffect } from "react"
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
import { Button } from "@/components/ui/button"
import {
  Intercambio,
  EstadoIntercambio,
  ModoIntercambio,
  NivelIntercambio,
  IdiomaIntercambio,
  IntercambioForm,
} from "@/services/intercambioAdmin"
import { Plus, Save } from "lucide-react"

interface UsuarioRelacionado {
  id: number
  nombre: string
}

interface PerfilRelacionado {
  id: number
}

interface IntercambioDialogProps {
  intercambio?: Intercambio
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: IntercambioForm) => void
  usuarios?: UsuarioRelacionado[] | null
  perfiles?: PerfilRelacionado[] | null
}

const initialFormData = {
  id_usuario1: null,
  id_perfil: null,
  nivel: NivelIntercambio.Principiante,
  modo: ModoIntercambio.Virtual,
  disponibilidad: "",
  idioma: IdiomaIntercambio.Espanol,
  descripcion: "",
  valoracion: 0,
  estado_trueque: true,
  estado: EstadoIntercambio.Pendiente,
}

export function IntercambioDialog({
  intercambio,
  open,
  onOpenChange,
  onSave,
  usuarios = [],
  perfiles = [],
}: IntercambioDialogProps) {
  const [formData, setFormData] = useState<IntercambioForm>(initialFormData)

  useEffect(() => {
    if (intercambio) {
      setFormData({
        id_usuario1: intercambio.usuario1?.id ?? null,
        id_perfil: intercambio.perfil?.id ?? null,
        nivel: intercambio.nivel ?? NivelIntercambio.Principiante,
        modo: intercambio.modo ?? ModoIntercambio.Virtual,
        disponibilidad: intercambio.disponibilidad ?? "",
        idioma: intercambio.idioma ?? IdiomaIntercambio.Espanol,
        descripcion: intercambio.descripcion ?? "",
        valoracion: intercambio.valoracion ?? 0,
        estado_trueque: intercambio.estado_trueque ?? true,
        estado: intercambio.estado ?? EstadoIntercambio.Pendiente,
      })
    } else {
      setFormData(initialFormData)
    }
  }, [intercambio, open])

  const isFormValid =
    formData.id_usuario1 != null &&
    formData.id_usuario1 > 0 &&
    formData.id_perfil != null &&
    formData.id_perfil > 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.id_usuario1 || formData.id_usuario1 <= 0) {
      alert("Por favor, selecciona un usuario válido.")
      return
    }

    if (!formData.id_perfil || formData.id_perfil <= 0) {
      alert("Por favor, selecciona un perfil válido.")
      return
    }

    console.log("✅ Datos válidos que se enviarán al backend:", formData)
    onSave(formData)
    onOpenChange(false)
    setFormData(initialFormData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* 👇 Añadido aria-modal y role para accesibilidad */}
      <DialogContent
        className="sm:max-w-[500px] bg-gray-900 border border-gray-700 shadow-2xl backdrop-blur-sm rounded-xl p-6 text-white"
        aria-modal="true"
        role="dialog"
      >
        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl font-bold text-white">
            {intercambio ? (
                                          <>
                                            <Save className="w-4 h-4" /> Editar Intercambio
                                          </>
                                        ) : (
                                          <>
                                            <Plus className="w-4 h-4" /> Crear Nuevo Intercambio
                                          </>
                                        )}
          </DialogTitle>
          <DialogDescription className="text-gray-300 mt-2">
            {intercambio
              ? "Modifica los datos del intercambio."
              : "Completa los datos para crear un nuevo intercambio."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-2">

            {/* Usuario */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-gray-200 font-medium">Usuario</Label>
              <Select
                value={formData.id_usuario1 !== null ? formData.id_usuario1.toString() : ""}
                onValueChange={(value) =>
                  setFormData({ ...formData, id_usuario1: Number(value) })
                }
              >
                <SelectTrigger className="col-span-3 bg-gray-800 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all">
                  <SelectValue placeholder="Selecciona usuario" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border border-gray-600 text-white">
                  {usuarios?.map((usuario) => (
                    <SelectItem
                      key={usuario.id}
                      value={usuario.id.toString()}
                      className="hover:bg-blue-600 focus:bg-blue-600 cursor-pointer transition-colors"
                    >
                      {usuario.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Perfil */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-gray-200 font-medium">Perfil</Label>
              <Select
                value={formData.id_perfil !== null ? formData.id_perfil.toString() : ""}
                onValueChange={(value) =>
                  setFormData({ ...formData, id_perfil: Number(value) })
                }
              >
                <SelectTrigger className="col-span-3 bg-gray-800 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all">
                  <SelectValue placeholder="Selecciona perfil" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border border-gray-600 text-white">
                  {perfiles?.map((perfil) => (
                    <SelectItem
                      key={perfil.id}
                      value={perfil.id.toString()}
                      className="hover:bg-blue-600 focus:bg-blue-600 cursor-pointer transition-colors"
                    >
                      Perfil {perfil.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Nivel */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-gray-200 font-medium">Nivel</Label>
              <Select
                value={formData.nivel}
                onValueChange={(value: NivelIntercambio) =>
                  setFormData({ ...formData, nivel: value })
                }
              >
                <SelectTrigger className="col-span-3 bg-gray-800 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all">
                  <SelectValue placeholder="Selecciona nivel" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border border-gray-600 text-white">
                  {Object.values(NivelIntercambio).map((nivel) => (
                    <SelectItem
                      key={nivel}
                      value={nivel}
                      className="hover:bg-blue-600 focus:bg-blue-600 cursor-pointer transition-colors"
                    >
                      {nivel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Modo */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-gray-200 font-medium">Modo</Label>
              <Select
                value={formData.modo}
                onValueChange={(value: ModoIntercambio) =>
                  setFormData({ ...formData, modo: value })
                }
              >
                <SelectTrigger className="col-span-3 bg-gray-800 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all">
                  <SelectValue placeholder="Selecciona modo" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border border-gray-600 text-white">
                  {Object.values(ModoIntercambio).map((modo) => (
                    <SelectItem
                      key={modo}
                      value={modo}
                      className="hover:bg-blue-600 focus:bg-blue-600 cursor-pointer transition-colors"
                    >
                      {modo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Disponibilidad */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-gray-200 font-medium">Disponibilidad</Label>
              <Input
                value={formData.disponibilidad}
                onChange={(e) =>
                  setFormData({ ...formData, disponibilidad: e.target.value })
                }
                className="col-span-3 bg-gray-800 border border-gray-600 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Ej: Lunes a Viernes, 9am-5pm"
              />
            </div>

            {/* Idioma */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-gray-200 font-medium">Idioma</Label>
              <Select
                value={formData.idioma}
                onValueChange={(value: IdiomaIntercambio) =>
                  setFormData({ ...formData, idioma: value })
                }
              >
                <SelectTrigger className="col-span-3 bg-gray-800 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all">
                  <SelectValue placeholder="Selecciona idioma" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border border-gray-600 text-white">
                  {Object.values(IdiomaIntercambio).map((idioma) => (
                    <SelectItem
                      key={idioma}
                      value={idioma}
                      className="hover:bg-blue-600 focus:bg-blue-600 cursor-pointer transition-colors"
                    >
                      {idioma}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Descripción */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-gray-200 font-medium">Descripción</Label>
              <Input
                value={formData.descripcion}
                onChange={(e) =>
                  setFormData({ ...formData, descripcion: e.target.value })
                }
                className="col-span-3 bg-gray-800 border border-gray-600 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Describe brevemente el intercambio"
              />
            </div>

            {/* Valoración */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-gray-200 font-medium">Valoración</Label>
              <Input
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={formData.valoracion}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    valoracion: parseFloat(e.target.value) || 0,
                  })
                }
                className="col-span-3 bg-gray-800 border border-gray-600 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="0.0 - 5.0"
              />
            </div>

            {/* Estado Trueque */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-gray-200 font-medium">Estado Trueque</Label>
              <Select
                value={formData.estado_trueque ? "true" : "false"}
                onValueChange={(value) =>
                  setFormData({ ...formData, estado_trueque: value === "true" })
                }
              >
                <SelectTrigger className="col-span-3 bg-gray-800 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all">
                  <SelectValue placeholder="Selecciona estado" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border border-gray-600 text-white">
                  <SelectItem value="true" className="hover:bg-green-600 focus:bg-green-600 transition-colors">Activo</SelectItem>
                  <SelectItem value="false" className="hover:bg-red-600 focus:bg-red-600 transition-colors">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Estado */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-gray-200 font-medium">Estado</Label>
              <Select
                value={formData.estado}
                onValueChange={(value: EstadoIntercambio) =>
                  setFormData({ ...formData, estado: value })
                }
              >
                <SelectTrigger className="col-span-3 bg-gray-800 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all">
                  <SelectValue placeholder="Selecciona estado" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border border-gray-600 text-white">
                  {Object.values(EstadoIntercambio).map((estado) => (
                    <SelectItem
                      key={estado}
                      value={estado}
                      className="hover:bg-blue-600 focus:bg-blue-600 cursor-pointer transition-colors"
                    >
                      {estado}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="mt-8 pt-4 border-t border-gray-700">
            <Button 
              type="submit" 
              disabled={!isFormValid}
              className={`w-full py-3 text-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                isFormValid
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  : "bg-gray-700 cursor-not-allowed text-gray-500"
              }`}
            >
              {intercambio ? (
                <>
                  <Save className="w-4 h-4" /> Guardar Cambios
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" /> Crear Intercambio
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}