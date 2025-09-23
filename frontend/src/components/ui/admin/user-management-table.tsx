// src/components/admin/UserManagementTable.tsx

"use client"

import { useState, useEffect } from "react"
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
import { UserDialog } from "./user_dialog"
import { getUsers, createUser, updateUser, deleteUser, Usuario, RolUsuario, CreateUsuarioData, UpdateUsuarioData } from "@/services/user"

export function UserManagementTable() {
  const [users, setUsers] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<Usuario | undefined>()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [menuKey, setMenuKey] = useState(0)

  // Cargar usuarios al montar
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await getUsers()
        setUsers(data)
      } catch (error) {
        console.error("Error loading users:", error)
        alert("Error al cargar los usuarios")
      } finally {
        setLoading(false)
      }
    }
    loadUsers()
  }, [])

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

  const handleDeleteUser = async (userId: number) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este usuario?")) return

    try {
      await deleteUser(userId)
      setUsers(users.filter((user) => user.id !== userId))
    } catch (error) {
      console.error("Error deleting user:", error)
      alert("Error al eliminar el usuario")
    }
  }

  const handleSaveUser = async (data: CreateUsuarioData | UpdateUsuarioData) => {
    try {
      if (selectedUser) {
        // Update
        const updatedUser = await updateUser(selectedUser.id, data as UpdateUsuarioData)
        setUsers(users.map((user) => (user.id === selectedUser.id ? updatedUser : user)))
      } else {
        // Create
        const newUser = await createUser(data as CreateUsuarioData)
        setUsers([...users, newUser])
      }
      setDialogOpen(false)
    } catch (error) {
      console.error("Error saving user:", error)
      alert("Error al guardar el usuario")
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.correo.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-10 text-gray-400">Cargando usuarios...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-[#121212] border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">Gestión de Usuarios</CardTitle>
            <CardDescription className="text-gray-400">
              Administra los usuarios del sistema. Solo los administradores pueden acceder a esta sección.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Buscador y botón */}
        <div className="flex items-center space-x-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground text-white" />
            <input
              placeholder="Buscar usuarios..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 py-2 px-3 w-full rounded-md border border-gray-700 bg-[#1e1e1e] text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Button onClick={handleCreateUser} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Usuario
          </Button>
        </div>

        {/* Tabla con fondo oscuro */}
        <div className="rounded-md border border-gray-700 bg-[#1e1e1e] text-white overflow-hidden">
          <Table>
            <TableHeader className="bg-[#2a2a2a] text-white">
              <TableRow>
                <TableHead className="text-white">ID</TableHead>
                <TableHead className="text-white">Nombre</TableHead>
                <TableHead className="text-white">Correo</TableHead>
                <TableHead className="text-white">Rol</TableHead>
                <TableHead className="text-white">Fecha de Creación</TableHead>
                <TableHead className="text-right text-white">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4 text-gray-400">
                    No se encontraron usuarios.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-[#2a2a2a] transition-colors">
                    <TableCell className="font-medium text-white">{user.id}</TableCell>
                    <TableCell className="text-white">{user.nombre}</TableCell>
                    <TableCell className="text-white">{user.correo}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.rol)}>{user.rol}</Badge>
                    </TableCell>
                    <TableCell className="text-white">{formatDate(user.fecha_creacion)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu key={`${user.id}-${menuKey}`}>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0 hover:bg-gray-800"
                            onClick={() => setMenuKey(prev => prev + 1)} // ← ¡ESTA LÍNEA ES CLAVE!
                          >
                            <span className="sr-only">Abrir menú</span>
                            <MoreHorizontal className="h-4 w-4 text-white" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#2a2a2a] border-gray-700 text-white">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => {
                              navigator.clipboard.writeText(user.correo)
                              setMenuKey(prev => prev + 1) // Reinicia después de acción
                            }}
                            className="hover:bg-gray-700 cursor-pointer"
                          >
                            Copiar correo
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-gray-700" />
                          <DropdownMenuItem
                            onClick={() => {
                              handleEditUser(user)
                              setMenuKey(prev => prev + 1) // Reinicia después de acción
                            }}
                            className="hover:bg-gray-700 cursor-pointer"
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              handleDeleteUser(user.id)
                              setMenuKey(prev => prev + 1) // Reinicia después de acción
                            }}
                            className="text-red-400 hover:bg-gray-700 cursor-pointer"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
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

        <UserDialog user={selectedUser} open={dialogOpen} onOpenChange={setDialogOpen} onSave={handleSaveUser} />
      </CardContent>
    </Card>
  )
}