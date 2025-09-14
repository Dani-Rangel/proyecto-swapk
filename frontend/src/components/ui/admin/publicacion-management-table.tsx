import React, { useState } from "react"
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
import { Publicacion, CreatePublicacionData, UpdatePublicacionData } from "@/services/publicacionAdmin"
import { PublicacionDialog } from "./publicacion_dialog"

const mockPublicaciones: Publicacion[] = [
  {
    id: 1,
    titulo: "Intercambio de Libros",
    contenido: "Estoy buscando intercambiar libros de ciencia ficción.",
    tipo: "Intercambio",    // coincide con tu enum
    imagen: "https://via.placeholder.com/40x40.png?text=Libro",
    fecha_creacion: "2025-09-01T10:30:00Z",
    id_usuario: 2,
    nombre_usuario: "Juan Pérez",
  },
  {
    id: 2,
    titulo: "Nuevo Curso de Python",
    contenido: "Curso avanzado para mejorar tus habilidades en Python.",
    tipo: "Curso",
    imagen: null,
    fecha_creacion: "2025-08-25T15:00:00Z",
    id_usuario: 3,
    nombre_usuario: "María López",
  },
  {
    id: 3,
    titulo: "¿Cómo usar hooks en React?",
    contenido: "Tengo dudas con useEffect, ¿alguien me ayuda?",
    tipo: "Pregunta",
    imagen: "https://via.placeholder.com/40x40.png?text=React",
    fecha_creacion: "2025-09-05T08:45:00Z",
    id_usuario: 1,
    nombre_usuario: "Admin",
  },
  {
    id: 4,
    titulo: "¡Logré completar el curso de Node.js!",
    contenido: "Estoy muy contento de haber terminado este curso.",
    tipo: "Logro",
    imagen: null,
    fecha_creacion: "2025-09-07T12:00:00Z",
    id_usuario: 4,
    nombre_usuario: "Carlos Díaz",
  },
]

export function PublicacionManagementTable() {
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>(mockPublicaciones)
  const [selectedPublicacion, setSelectedPublicacion] = useState<Publicacion | undefined>()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const idUsuarioActual = 1 // Aquí podrías poner el id del usuario logueado

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

  const handleDelete = (id: number) => {
    if (confirm("¿Seguro que quieres eliminar esta publicación?")) {
      setPublicaciones(publicaciones.filter((p) => p.id !== id))
    }
  }

  const handleSave = (data: CreatePublicacionData | UpdatePublicacionData) => {
    if (selectedPublicacion) {
      // Actualizar publicación
      setPublicaciones((prev) =>
        prev.map((p) => (p.id === selectedPublicacion.id ? { ...p, ...data } : p))
      )
    } else {
      // Crear nueva publicación
      const createData = data as CreatePublicacionData
      const newPub: Publicacion = {
        id: Math.max(...publicaciones.map((p) => p.id)) + 1,
        titulo: createData.titulo,
        contenido: createData.contenido,
        tipo: createData.tipo,
        imagen: createData.imagen ?? null,
        fecha_creacion: new Date().toISOString(),
        id_usuario: createData.id_usuario,
        nombre_usuario: "Usuario Actual", // o carga el nombre real del usuario actual
      }
      setPublicaciones([...publicaciones, newPub])
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-white">Gestión de Publicaciones</CardTitle>
        <CardDescription>Administra las publicaciones del sistema.</CardDescription>
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
          <Button onClick={handleCreate} className="text-white">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Publicación
          </Button>
        </div>

        <div className="rounded-md border border-gray-700 bg-[#1e1e1e] text-white overflow-x-auto">
          <Table>
            <TableHeader className="bg-[#2a2a2a] text-white">
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Imagen</TableHead>
                <TableHead>Fecha de Creación</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {publicaciones
                .filter(
                  (pub) =>
                    pub.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    pub.contenido.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((pub) => (
                  <TableRow key={pub.id}>
                    <TableCell>{pub.id}</TableCell>
                    <TableCell>{pub.titulo}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{pub.tipo}</Badge>
                    </TableCell>
                    <TableCell>
                      {pub.imagen ? (
                        <img src={pub.imagen} alt={pub.titulo} className="h-8 w-8 rounded" />
                      ) : (
                        <span>No hay</span>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(pub.fecha_creacion)}</TableCell>
                    <TableCell>{pub.nombre_usuario ?? "Desconocido"}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEdit(pub)}>
                            <Pencil className="mr-2 h-4 w-4" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDelete(pub.id)} className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>

        <PublicacionDialog
          publicacion={selectedPublicacion}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSave={handleSave}
          idUsuarioActual={idUsuarioActual}
        />
      </CardContent>
    </Card>
  )
}
