"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import Image from "next/image"

import { UserManagementTable } from "@/components/ui/admin/user-management-table"
import { CourseManagementTable } from "@/components/ui/admin/course-management-table"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, ShieldAlert } from "lucide-react"
import { RolUsuario } from "@/services/user"
import { IntercambioManagementTable } from "@/components/ui/admin/intercambio-management-table"
import { PublicacionManagementTable } from "@/components/ui/admin/publicacion-management-table"
import { MainSidebar } from "@/components/MainSidebar"



import {
  X, Search, HomeIcon, Star, Camera, Plus, Settings,
  LogOut, User, Bell, MessageSquare, Menu
} from "lucide-react"

export default function AdminPage() {
  const [currentUserRole, setCurrentUserRole] = useState<RolUsuario | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()
  const [isDark, setIsDark] = useState<boolean>(true)

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        setCurrentUserRole(RolUsuario.Administrador)
      } catch (error) {
        console.error("Error verificando rol del usuario:", error)
        setCurrentUserRole(null)
      } finally {
        setLoading(false)
      }
    }

    checkUserRole()
  }, [])

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.log("Buscando:", searchQuery)
  }

  const handleLogout = () => {
    // Aquí deberías limpiar la sesión/token y redirigir
    console.log("Cerrando sesión...")
    router.push("/login")
  }

  const toggleTheme = () => {
    setIsDark(!isDark)
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <Shield className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">Verificando permisos...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (currentUserRole !== RolUsuario.Administrador) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>
            No tienes permisos para acceder a esta página. Solo los administradores pueden gestionar usuarios y cursos.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-[#141414] flex">
      {/* Sidebar */}
      <MainSidebar
                  isDark={isDark}
                  toggleTheme={toggleTheme}
                  isSidebarOpen={isSidebarOpen}
                  setIsSidebarOpen={setIsSidebarOpen}
                />

      {/* Main content */}
      <div className="container mx-auto py-2 space-y-8 ">
        <div className="flex items-center gap-2 ">
          <Shield className="h-6 w-6 text-white" />
          <h1 className="text-3xl font-bold text-white">Panel de Administración</h1>
        </div>

        <Tabs defaultValue="users" className="space-y-6 bg-[#2a2a2a] rounded p-6 text-white">
          <TabsList className="grid w-full grid-cols-4 bg-[#3e3e3e] p-1 rounded-lg">
            <TabsTrigger value="users">Gestión de Usuarios</TabsTrigger>
            <TabsTrigger value="courses">Gestión de Cursos</TabsTrigger>
            <TabsTrigger value="intercambios">Gestión de Intercambios</TabsTrigger>
            <TabsTrigger value="publicaciones">Gestión de Publicaciones</TabsTrigger>
          </TabsList>
          <TabsContent value="users" className="space-y-6">
            <UserManagementTable />
          </TabsContent>

          <TabsContent value="courses" className="space-y-6">
            <CourseManagementTable />
          </TabsContent>

          <TabsContent value="intercambios" className="space-y-6">
            <IntercambioManagementTable />
          </TabsContent>

          <TabsContent value="publicaciones" className="space-y-6">
            <PublicacionManagementTable />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
