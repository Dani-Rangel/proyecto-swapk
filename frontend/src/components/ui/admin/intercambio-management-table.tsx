"use client"

import React, { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Plus, Pencil, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../dropdown-menu"
import { Intercambio, EstadoIntercambio, ModoIntercambio, NivelIntercambio, IdiomaIntercambio } from "@/services/intercambioAdmin"
import { IntercambioDialog } from "./intercambio-dialog"

const mockIntercambios: Intercambio[] = [
  {
    id: 1,
    id_usuario1: 1,
    id_perfil: 1,
    nivel: NivelIntercambio.Principiante,
    modo: ModoIntercambio.Virtual,
    disponibilidad: "Lunes a viernes 10-14",
    idioma: IdiomaIntercambio.Espanol,
    descripcion: "Intercambio para mejorar español",
    valoracion: 4.5,
    estado_trueque: true,
    estado: EstadoIntercambio.Pendiente,
    fecha_creacion: "2024-09-11T12:00:00Z",
  },
  // ...más datos de prueba
]

export function IntercambioManagementTable() {
  const [intercambios, setIntercambios] = useState<Intercambio[]>(mockIntercambios)
  const [selectedIntercambio, setSelectedIntercambio] = useState<Intercambio | undefined>(undefined)
  const [dialogOpen, setDialogOpen] = useState(false)

  const getEstadoBadgeVariant = (estado: EstadoIntercambio) => {
    switch (estado) {
      case EstadoIntercambio.Pendiente:
        return "secondary"
      case EstadoIntercambio.Confirmado:
        return "default"
      case EstadoIntercambio.Finalizado:
        return "destructive"
      default:
        return "secondary"
    }
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })

  const handleCreate = () => {
    setSelectedIntercambio(undefined)
    setDialogOpen(true)
  }

  const handleEdit = (intercambio: Intercambio) => {
    setSelectedIntercambio(intercambio)
    setDialogOpen(true)
  }

  const handleDelete = (id: number) => {
    if (confirm("¿Seguro que quieres eliminar este intercambio?")) {
      setIntercambios(intercambios.filter((i) => i.id !== id))
    }
  }

  const handleSave = (data: Partial<Intercambio>) => {
    if (selectedIntercambio) {
      setIntercambios(intercambios.map((i) => (i.id === selectedIntercambio.id ? { ...i, ...data } : i)))
    } else {
      const newId = intercambios.length ? Math.max(...intercambios.map((i) => i.id)) + 1 : 1
      setIntercambios([
        ...intercambios,
        {
          id: newId,
          id_usuario1: data.id_usuario1 ?? 0,
          id_perfil: data.id_perfil ?? 0,
          nivel: data.nivel ?? NivelIntercambio.Principiante,
          modo: data.modo ?? ModoIntercambio.Virtual,
          disponibilidad: data.disponibilidad ?? "",
          idioma: data.idioma ?? IdiomaIntercambio.Espanol,
          descripcion: data.descripcion ?? "",
          valoracion: data.valoracion ?? 0,
          estado_trueque: data.estado_trueque ?? true,
          estado: data.estado ?? EstadoIntercambio.Pendiente,
          fecha_creacion: new Date().toISOString(),
        },
      ])
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Gestión de Intercambios</CardTitle>
          <Button onClick={handleCreate} className="text-white flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nuevo Intercambio
          </Button>
        </div>
        <CardDescription className="text-white">Administra los intercambios del sistema.</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="rounded-md border border-gray-700 bg-[#1e1e1e] text-white">
          <Table>
            <TableHeader className="bg-[#2a2a2a] text-white">
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nivel</TableHead>
                <TableHead>Modo</TableHead>
                <TableHead>Disponibilidad</TableHead>
                <TableHead>Idioma</TableHead>
                <TableHead>Valoración</TableHead>
                <TableHead>Estado Trueque</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha de Creación</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {intercambios.map((intercambio) => (
                <TableRow key={intercambio.id} className="hover:bg-[#2a2a2a] transition-colors">
                  <TableCell>{intercambio.id}</TableCell>
                  <TableCell>{intercambio.nivel}</TableCell>
                  <TableCell>{intercambio.modo}</TableCell>
                  <TableCell>{intercambio.disponibilidad}</TableCell>
                  <TableCell>{intercambio.idioma}</TableCell>
                  <TableCell>{intercambio.valoracion.toFixed(1)}</TableCell>
                  <TableCell>{intercambio.estado_trueque ? "Activo" : "Inactivo"}</TableCell>
                  <TableCell>
                    <Badge variant={getEstadoBadgeVariant(intercambio.estado)}>{intercambio.estado}</Badge>
                  </TableCell>
                  <TableCell>{formatDate(intercambio.fecha_creacion)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menú</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleEdit(intercambio)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(intercambio.id)} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <IntercambioDialog open={dialogOpen} onOpenChange={setDialogOpen} onSave={handleSave} intercambio={selectedIntercambio} />
    </Card>
  )
}
