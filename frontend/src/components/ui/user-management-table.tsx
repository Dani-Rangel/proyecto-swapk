"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MoreHorizontal, Plus, Pencil, Trash2 } from "lucide-react"
import { type Usuario, RolUsuario, type CreateUsuarioData, type UpdateUsuarioData } from "@/services/user"
import { UserDialog } from "./user_dialog"

// Mock data - en una aplicación real, esto vendría de una API
const mockUsers: Usuario[] = [
  {
    id: 1,
    nombre: "Juan Pérez",
    correo: "juan@example.com",
    rol: RolUsuario.Administrador,
    fecha_creacion: "2024-01-15T10:30:00Z",
  },
  {
    id: 2,
    nombre: "María García",
    correo: "maria@example.com",
    rol: RolUsuario.Moderador,
    fecha_creacion: "2024-01-20T14:15:00Z",
  },
  {
    id: 3,
    nombre: "Carlos López",
    correo: "carlos@example.com",
    rol: RolUsuario.Usuario,
    fecha_creacion: "2024-02-01T09:45:00Z",
  },
  {
    id: 4,
    nombre: "Ana Martínez",
    correo: "ana@example.com",
    rol: RolUsuario.Usuario,
    fecha_creacion: "2024-02-05T16:20:00Z",
  },
]

export function UserManagementTable() {
  const [users, setUsers] = useState<Usuario[]>(mockUsers)
  const [selectedUser, setSelectedUser] = useState<Usuario | undefined>()
  const [dialogOpen, setDialogOpen] = useState(false)

  const getRoleBadgeVariant = (rol: RolUsuario) => {
    switch (rol) {
      case RolUsuario.Administrador:
        return "destructive"
      case RolUsuario.Moderador:
        return "default"
      case RolUsuario.Usuario:
        return "secondary"
      default:
        return "secondary"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleCreateUser = () => {
    setSelectedUser(undefined)
    setDialogOpen(true)
  }

  const handleEditUser = (user: Usuario) => {
    setSelectedUser(user)
    setDialogOpen(true)
  }

  const handleDeleteUser = (userId: number) => {
    if (confirm("¿Estás seguro de que quieres eliminar este usuario?")) {
      setUsers(users.filter((user) => user.id !== userId))
    }
  }

  const handleSaveUser = (data: CreateUsuarioData | UpdateUsuarioData) => {
    if (selectedUser) {
      // Update existing user
      setUsers(users.map((user) => (user.id === selectedUser.id ? { ...user, ...data } : user)))
    } else {
      // Create new user
      const createData = data as CreateUsuarioData
      const newUser: Usuario = {
        id: Math.max(...users.map((u) => u.id)) + 1,
        nombre: createData.nombre,
        correo: createData.correo,
        rol: createData.rol,
        fecha_creacion: new Date().toISOString(),
      }
      setUsers([...users, newUser])
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Gestión de Usuarios</CardTitle>
            <CardDescription>
              Administra los usuarios del sistema. Solo los administradores pueden acceder a esta sección.
            </CardDescription>
          </div>
          <Button onClick={handleCreateUser}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Usuario
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Fecha de Creación</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.id}</TableCell>
                <TableCell>{user.nombre}</TableCell>
                <TableCell>{user.correo}</TableCell>
                <TableCell>
                  <Badge variant={getRoleBadgeVariant(user.rol)}>{user.rol}</Badge>
                </TableCell>
                <TableCell>{formatDate(user.fecha_creacion)}</TableCell>
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
                      <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.correo)}>
                        Copiar correo
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleEditUser(user)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteUser(user.id)} className="text-destructive">
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

        <UserDialog user={selectedUser} open={dialogOpen} onOpenChange={setDialogOpen} onSave={handleSaveUser} />
      </CardContent>
    </Card>
  )
}
