"use client"

import React, { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Intercambio, EstadoIntercambio, ModoIntercambio, NivelIntercambio, IdiomaIntercambio } from "@/services/intercambioAdmin"

interface IntercambioDialogProps {
  intercambio?: Intercambio
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: Partial<Intercambio>) => void
}

export function IntercambioDialog({ intercambio, open, onOpenChange, onSave }: IntercambioDialogProps) {
  const [formData, setFormData] = useState({
    nivel: intercambio?.nivel || NivelIntercambio.Principiante,
    modo: intercambio?.modo || ModoIntercambio.Virtual,
    disponibilidad: intercambio?.disponibilidad || "",
    idioma: intercambio?.idioma || IdiomaIntercambio.Espanol,
    descripcion: intercambio?.descripcion || "",
    valoracion: intercambio?.valoracion ?? 0,
    estado_trueque: intercambio?.estado_trueque ?? true,
    estado: intercambio?.estado || EstadoIntercambio.Pendiente,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
    onOpenChange(false)
    setFormData({
      nivel: NivelIntercambio.Principiante,
      modo: ModoIntercambio.Virtual,
      disponibilidad: "",
      idioma: IdiomaIntercambio.Espanol,
      descripcion: "",
      valoracion: 0,
      estado_trueque: true,
      estado: EstadoIntercambio.Pendiente,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{intercambio ? "Editar Intercambio" : "Crear Nuevo Intercambio"}</DialogTitle>
          <DialogDescription>
            {intercambio ? "Modifica los datos del intercambio." : "Completa los datos para crear un nuevo intercambio."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4 text-white">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nivel" className="text-right">Nivel</Label>
              <Select
                value={formData.nivel}
                onValueChange={(value: NivelIntercambio) => setFormData({ ...formData, nivel: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecciona un nivel" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(NivelIntercambio).map((nivel) => (
                    <SelectItem key={nivel} value={nivel}>{nivel}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="modo" className="text-right">Modo</Label>
              <Select
                value={formData.modo}
                onValueChange={(value: ModoIntercambio) => setFormData({ ...formData, modo: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecciona un modo" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(ModoIntercambio).map((modo) => (
                    <SelectItem key={modo} value={modo}>{modo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="disponibilidad" className="text-right">Disponibilidad</Label>
              <Input
                id="disponibilidad"
                value={formData.disponibilidad}
                onChange={(e) => setFormData({ ...formData, disponibilidad: e.target.value })}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="idioma" className="text-right">Idioma</Label>
              <Select
                value={formData.idioma}
                onValueChange={(value: IdiomaIntercambio) => setFormData({ ...formData, idioma: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecciona un idioma" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(IdiomaIntercambio).map((idioma) => (
                    <SelectItem key={idioma} value={idioma}>{idioma}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="descripcion" className="text-right">Descripción</Label>
              <Input
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="valoracion" className="text-right">Valoración</Label>
              <Input
                id="valoracion"
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={formData.valoracion}
                onChange={(e) => setFormData({ ...formData, valoracion: parseFloat(e.target.value) || 0 })}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="estado_trueque" className="text-right">Estado Trueque</Label>
              <Select
                value={formData.estado_trueque ? "true" : "false"}
                onValueChange={(value) =>
                  setFormData({ ...formData, estado_trueque: value === "true" })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecciona estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Activo</SelectItem>
                  <SelectItem value="false">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="estado" className="text-right">Estado</Label>
              <Select
                value={formData.estado}
                onValueChange={(value: EstadoIntercambio) => setFormData({ ...formData, estado: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecciona estado" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(EstadoIntercambio).map((estado) => (
                    <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">{intercambio ? "Guardar Cambios" : "Crear Intercambio"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
