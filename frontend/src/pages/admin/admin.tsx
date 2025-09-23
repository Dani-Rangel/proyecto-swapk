"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { Shield, ShieldAlert, Users, BookOpen, RefreshCw, FileText, LogOut } from "lucide-react"

import { UserManagementTable } from "@/components/ui/admin/user-management-table"
import { CourseManagementTable } from "@/components/ui/admin/course-management-table"
import { IntercambioManagementTable } from "@/components/ui/admin/intercambio-management-table"
import { PublicacionManagementTable } from "@/components/ui/admin/publicacion-management-table"

import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RolUsuario } from "@/services/user"

export default function AdminPage() {
  const [currentUserRole, setCurrentUserRole] = useState<RolUsuario | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("users") // pestaña activa
  const router = useRouter()

  // Simula la verificación de permisos
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

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/auth/login")
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
    <div className="relative min-h-screen flex bg-[#141414] text-white">
      {/* ====================== */}
      {/* Sidebar interna */}
      {/* ====================== */}
      <aside className="w-64 bg-[#1e1e1e] border-r border-gray-800 flex flex-col p-4">
        <div className="flex items-center gap-2 mb-8">
          <Shield className="h-6 w-6 text-blue-400" />
          <span className="text-lg font-bold">Admin Panel</span>
        </div>

        <nav className="space-y-2">
          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg transition-colors ${
              activeTab === "users" ? "bg-blue-600 text-white" : "hover:bg-gray-700"
            }`}
          >
            <Users className="h-5 w-5" />
            Gestión de Usuarios
          </button>

          <button
            onClick={() => setActiveTab("courses")}
            className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg transition-colors ${
              activeTab === "courses" ? "bg-blue-600 text-white" : "hover:bg-gray-700"
            }`}
          >
            <BookOpen className="h-5 w-5" />
            Gestión de Cursos
          </button>

          <button
            onClick={() => setActiveTab("intercambios")}
            className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg transition-colors ${
              activeTab === "intercambios" ? "bg-blue-600 text-white" : "hover:bg-gray-700"
            }`}
          >
            <RefreshCw className="h-5 w-5" />
            Gestión de Intercambios
          </button>

          <button
            onClick={() => setActiveTab("publicaciones")}
            className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg transition-colors ${
              activeTab === "publicaciones" ? "bg-blue-600 text-white" : "hover:bg-gray-700"
            }`}
          >
            <FileText className="h-5 w-5" />
            Gestión de Publicaciones
          </button>
        </nav>

        <div className="mt-auto pt-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-red-400 hover:bg-red-900 hover:text-white rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ====================== */}
      {/* Contenido principal */}
      {/* ====================== */}
      <main className="flex-1 p-8">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="h-6 w-6 text-white" />
          <h1 className="text-3xl font-bold">Panel de Administración</h1>
        </div>

        <div className="bg-[#2a2a2a] rounded p-6 text-white">
          {activeTab === "users" && (
            <div>
              <h2 className="text-xl font-bold mb-4">Gestión de Usuarios</h2>
              <UserManagementTable />
            </div>
          )}

          {activeTab === "courses" && (
            <div>
              <h2 className="text-xl font-bold mb-4">Gestión de Cursos</h2>
              <CourseManagementTable />
            </div>
          )}

          {activeTab === "intercambios" && (
            <div>
              <h2 className="text-xl font-bold mb-4">Gestión de Intercambios</h2>
              <IntercambioManagementTable />
            </div>
          )}

          {activeTab === "publicaciones" && (
            <div>
              <h2 className="text-xl font-bold mb-4">Gestión de Publicaciones</h2>
              <PublicacionManagementTable />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
