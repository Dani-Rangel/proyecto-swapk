"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MoreHorizontal, Plus, Pencil, Trash2, Search } from "lucide-react"
import {
  Publicacion,
  CreatePublicacionData,
  UpdatePublicacionData,
  PublicacionService,
} from "@/services/publicacionAdmin"
import { PublicacionDialog } from "./publicacion_dialog"

export function PublicacionManagementTable() {
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([])
  const [selectedPublicacion, setSelectedPublicacion] = useState<Publicacion | undefined>()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 🚀 Cargar publicaciones del backend
  const cargarPublicaciones = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await PublicacionService.listar()
      setPublicaciones(data)
    } catch (err) {
      console.error("Error al cargar publicaciones:", err)
      setError("No se pudieron cargar las publicaciones. Verifica tu conexión.")
    } finally {
      setLoading(false)
    }
  }

  // 🔄 Cargar al montar
  useEffect(() => {
    cargarPublicaciones()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleCreate = () => {
    setSelectedPublicacion(undefined)
    setDialogOpen(true)
  }

  const handleEdit = (pub: Publicacion) => {
    setSelectedPublicacion(pub)
    setDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("¿Seguro que quieres eliminar esta publicación?")) return

    try {
      await PublicacionService.eliminar(id)
      await cargarPublicaciones() // recargar lista
    } catch (err) {
      alert("Error al eliminar la publicación")
      console.error(err)
    }
  }

  const handleSave = async (data: CreatePublicacionData | UpdatePublicacionData) => {
    try {
      if (selectedPublicacion) {
        // 🔄 Actualizar
        const updated = await PublicacionService.actualizar(selectedPublicacion.id, data as UpdatePublicacionData)
        setPublicaciones((prev) =>
          prev.map((p) => (p.id === selectedPublicacion.id ? updated : p))
        )
      } else {
        // ➕ Crear
        const created = await PublicacionService.crear(data as CreatePublicacionData)
        setPublicaciones((prev) => [...prev, created])
      }
      setDialogOpen(false)
      setSelectedPublicacion(undefined)
    } catch (err) {
      alert("Error al guardar la publicación")
      console.error(err)
    }
  }

  // 🔍 Filtrar por búsqueda
  const publicacionesFiltradas = publicaciones.filter(
    (pub) =>
      pub.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pub.contenido.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pub.usuario?.nombre?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Card className="bg-[#121212] border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Gestión de Publicaciones</CardTitle>
        <CardDescription className="text-white">Administra las publicaciones del sistema.</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="flex items-center space-x-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground text-white" />
            <input
              type="text"
              placeholder="Buscar publicaciones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 py-2 px-3 w-full rounded-md border border-gray-700 bg-[#1e1e1e] text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Button onClick={handleCreate} className="text-white flex items-center gap-2 bg-blue-600 hover:bg-blue-700 transition-colors">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Publicación
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-white">Cargando publicaciones...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-400">{error}</div>
        ) : (
          <div className="rounded-md border border-gray-700 bg-[#1e1e1e] text-white overflow-x-auto">
            <Table>
              <TableHeader className="bg-[#2a2a2a] text-white">
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Imagen</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {publicacionesFiltradas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-4">
                      No se encontraron publicaciones.
                    </TableCell>
                  </TableRow>
                ) : (
                  publicacionesFiltradas.map((pub) => (
                    <TableRow key={pub.id} className="hover:bg-[#2a2a2a] transition-colors">
                      <TableCell>{pub.id}</TableCell>
                      <TableCell className="font-medium">{pub.titulo}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{pub.tipo}</Badge>
                      </TableCell>
                      <TableCell>
                        {pub.imagen ? (
                          <img
                            src={pub.imagen}
                            alt={pub.titulo}
                            className="h-8 w-8 rounded object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                              if (target.nextSibling) {
                                target.nextSibling.textContent = "Img error";
                              }
                            }}
                          />
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(pub.fecha_creacion)}</TableCell>
                      <TableCell>
                        {pub.usuario ? (
                          <div>
                            <div>{pub.usuario.nombre}</div>
                            <div className="text-xs text-gray-400">{pub.usuario.correo}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {pub.perfil ? (
                          <Badge variant="outline">Perfil {pub.perfil.id}</Badge>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-[#1e1e1e] border-gray-700 text-white">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleEdit(pub)}>
                              <Pencil className="mr-2 h-4 w-4" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(pub.id)}
                              className="text-red-400 focus:bg-red-900 focus:text-red-100"
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Eliminar
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

        <PublicacionDialog
          publicacion={selectedPublicacion}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSave={handleSave}
        />
      </CardContent>
    </Card>
  )
}