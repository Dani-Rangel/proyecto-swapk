"use client"

import React, { useState, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../table"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Plus, Pencil, Trash2, Search } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../dropdown-menu"
import {
  Intercambio,
  EstadoIntercambio,
  IntercambioService,
  IntercambioForm,
  IntercambioUpdateForm,
  PerfilRelacionado, 
} from "@/services/intercambioAdmin"
import { IntercambioDialog } from "./intercambio-dialog"

interface UsuarioRelacionado {
  id: number
  nombre: string
}

export function IntercambioManagementTable() {
  const [intercambios, setIntercambios] = useState<Intercambio[]>([])
  const [selectedIntercambio, setSelectedIntercambio] = useState<Intercambio | undefined>(undefined)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [usuarios, setUsuarios] = useState<UsuarioRelacionado[]>([])
  const [perfiles, setPerfiles] = useState<PerfilRelacionado[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  /** Cargar intercambios **/
  const cargarIntercambios = async () => {
    try {
      setLoading(true)
      const data: Intercambio[] = await IntercambioService.listar()
      setIntercambios(data)
    } catch (error) {
      console.error("Error al cargar intercambios", error)
    } finally {
      setLoading(false)
    }
  }

  /** Cargar usuarios **/
  const cargarUsuarios = async () => {
    try {
      const res = await fetch("http://localhost:8000/admin/intercambios/usuarios")
      const usuariosData = await res.json()
      setUsuarios(Array.isArray(usuariosData) ? usuariosData : [])
    } catch (error) {
      console.error("Error cargando usuarios", error)
      setUsuarios([])
    }
  }

  const cargarPerfiles = async () => {
    try {
      const res = await fetch("http://localhost:8000/admin/perfiles")
      const perfilesData = await res.json()
      setPerfiles(Array.isArray(perfilesData) ? perfilesData : [])
    } catch (error) {
      console.error("Error cargando perfiles", error)
      setPerfiles([])
    }
  }

  useEffect(() => {
    cargarIntercambios()
    cargarUsuarios()
    cargarPerfiles()
  }, [])

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
    setDialogOpen(false)
    setTimeout(() => {
      setDialogOpen(true)
    }, 0)
  }

  const handleEdit = (intercambio: Intercambio) => {
    setSelectedIntercambio(intercambio)
    setDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm("¿Seguro que quieres eliminar este intercambio?")) {
      try {
        await IntercambioService.eliminar(id)
        await cargarIntercambios()
      } catch (error) {
        console.error("Error al eliminar intercambio", error)
      }
    }
  }

  const handleSave = async (data: IntercambioForm) => {
    console.log("💾 Guardando intercambio:", data)
    try {
      if (selectedIntercambio) {
        await IntercambioService.actualizar(selectedIntercambio.id, data)
      } else {
        await IntercambioService.crear(data)
      }
      await cargarIntercambios()
      setDialogOpen(false)
      setSelectedIntercambio(undefined)
    } catch (error) {
      console.error("Error al guardar intercambio", error)
    }
  }

  // 🔍 Filtrar intercambios
  const intercambiosFiltrados = intercambios.filter((intercambio) => {
    const query = searchQuery.toLowerCase()
    return (
      intercambio.id.toString().includes(query) ||
      intercambio.usuario1?.nombre?.toLowerCase().includes(query) ||
      intercambio.nivel?.toLowerCase().includes(query) ||
      intercambio.modo?.toLowerCase().includes(query) ||
      intercambio.disponibilidad?.toLowerCase().includes(query) ||
      intercambio.idioma?.toLowerCase().includes(query) ||
      intercambio.estado?.toLowerCase().includes(query)
    )
  })

  return (
    <Card className="bg-[#121212] border-gray-700 text-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">Gestión de Intercambios</CardTitle>
            <CardDescription className="text-gray-400">
              Administra los intercambios del sistema.
            </CardDescription>
          </div>
          <Button
            onClick={handleCreate}
            className="text-white flex items-center gap-2 bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nuevo Intercambio
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {/* === Barra de búsqueda === */}
        <div className="flex items-center space-x-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por ID, usuario, nivel, modo, disponibilidad, idioma o estado..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#1e1e1e] border border-gray-700 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-white">Cargando intercambios...</div>
        ) : (
          <div className="rounded-lg border border-gray-700 bg-[#1e1e1e] text-white overflow-x-auto">
            <Table>
              <TableHeader className="bg-[#2a2a2a] text-white">
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Usuario</TableHead>
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
                {intercambiosFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-gray-400">
                      No se encontraron intercambios que coincidan con tu búsqueda.
                    </TableCell>
                  </TableRow>
                ) : (
                  intercambiosFiltrados.map((intercambio) => (
                    <TableRow
                      key={intercambio.id}
                      className="hover:bg-[#2a2a2a] transition-colors"
                    >
                      <TableCell>{intercambio.id}</TableCell>
                      <TableCell>{intercambio.usuario1?.nombre || "—"}</TableCell>
                      <TableCell>{intercambio.nivel}</TableCell>
                      <TableCell>{intercambio.modo}</TableCell>
                      <TableCell>{intercambio.disponibilidad}</TableCell>
                      <TableCell>{intercambio.idioma}</TableCell>
                      <TableCell>
                        {intercambio.valoracion != null
                          ? intercambio.valoracion.toFixed(1)
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={intercambio.estado_trueque ? "default" : "secondary"}>
                          {intercambio.estado_trueque ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getEstadoBadgeVariant(intercambio.estado)}>
                          {intercambio.estado}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(intercambio.fecha_creacion)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu key={`menu-${intercambio.id}`}>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-700">
                              <span className="sr-only">Abrir menú</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent 
                            align="end" 
                            className="bg-gray-800 border border-gray-600 rounded-lg p-1 min-w-[160px] shadow-xl"
                          >
                            <DropdownMenuLabel className="text-gray-300 text-xs font-semibold px-2 py-1.5">
                              Acciones
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-gray-600 my-1" />
                            <DropdownMenuItem 
                              onClick={() => handleEdit(intercambio)}
                              className="flex items-center gap-2 px-2 py-2 text-white hover:bg-blue-600 rounded-md cursor-pointer transition-colors"
                            >
                              <Pencil className="h-4 w-4" />
                              <span>Editar</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(intercambio.id)}
                              className="flex items-center gap-2 px-2 py-2 text-red-400 hover:bg-red-900 hover:text-red-100 rounded-md cursor-pointer transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span>Eliminar</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <IntercambioDialog
        key={dialogOpen ? "dialog-open" : "dialog-closed"}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        intercambio={selectedIntercambio}
        onSave={handleSave}
        usuarios={usuarios}
        perfiles={perfiles}
      />
    </Card>
  )
}