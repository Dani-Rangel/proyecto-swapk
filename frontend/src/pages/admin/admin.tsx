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
      <nav
        className={`fixed md:relative h-screen bg-[rgb(30,30,30)] border-[#2E2E2E] backdrop-blur-md border-r flex flex-col transition-all duration-300
        ${isSidebarOpen ? "w-60 fixed" : "w-14 fixed"}`}
      >
        <div className="flex justify-end p-2 left-0.5">
          <button
            className="flex justify-end text-white hover:text-blue-400 transition-colors left-2.5"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {isSidebarOpen && (
          <div className="flex items-center mb-8 px-4">
            <Image
              src="/img/logoswapk.png"
              alt="Logo Swapk"
              width={22}
              height={22}
              className="w-6 h-6 mr-3"
            />
            <span className="text-white font-bold text-rm">Swapk</span>
          </div>
        )}

        {isSidebarOpen && (
          <div className="flex gap-12 justify-center mb-12">
            <User className="w-6 h-6 text-white hover:text-blue-400 cursor-pointer transition-colors" />
            <Bell className="w-6 h-6 text-white hover:text-blue-400 cursor-pointer transition-colors" />
            <MessageSquare className="w-6 h-6 text-white hover:text-blue-400 cursor-pointer transition-colors" />
          </div>
        )}

        {isSidebarOpen && (
          <div className="mb-20 px-3">
            <form onSubmit={handleSearch} className="flex flex-col gap-6">
              <input
                type="text"
                placeholder="¿Qué aprenderás hoy?"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-gray-800/80 text-white px-4 py-3 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-emerald-400/20 w-full transition-all duration-200"
              />
              <button
                type="submit"
                className="cursor-pointer bg-gradient-to-r bg-blue-600 px-4 py-3 rounded-lg hover:bg-blue-500 hover:to-blue-600 transition-all duration-200 flex items-center justify-center gap-2 text-white font-medium shadow-lg hover:shadow-emerald-500/25"
              >
                <Search className="w-4 h-4" />
                Buscar
              </button>
            </form>
          </div>
        )}

        <div className="flex flex-col gap-4 mb-8 px-5">
          <button className="cursor-pointer flex items-center gap-3 text-white font-medium py-3 px-2 rounded-lg hover:bg-blue-500/20 hover:text-blue-400 transition-all duration-200">
            <HomeIcon className="w-5 h-5" />
            {isSidebarOpen && "INICIO"}
          </button>
          <button className="cursor-pointer flex items-center gap-3 text-white font-medium py-3 px-2 rounded-lg hover:bg-blue-500/20 hover:text-blue-400 transition-all duration-200">
            <Search className="w-5 h-5" />
            {isSidebarOpen && "EXPLORAR"}
          </button>
          <button className="cursor-pointer flex items-center gap-3 text-white font-medium py-3 px-2 rounded-lg hover:bg-blue-500/20 hover:text-blue-400 transition-all duration-200">
            <Star className="w-5 h-5" />
            {isSidebarOpen && "MIS TRUEQUES"}
          </button>
          <button className="cursor-pointer flex items-center gap-3 text-white font-medium py-3 px-2 rounded-lg hover:bg-blue-500/20 hover:text-blue-400 transition-all duration-200">
            <Camera className="w-5 h-5" />
            {isSidebarOpen && "MIS CURSOS"}
          </button>
          <button className="cursor-pointer flex items-center gap-3 text-white font-medium py-3 px-2 rounded-lg hover:bg-blue-500/20 hover:text-blue-400 transition-all duration-200">
            <Plus className="w-5 h-5" />
            {isSidebarOpen && "COMUNIDAD"}
          </button>
          <button className="cursor-pointer flex items-center gap-3 text-white font-medium py-3 px-2 rounded-lg hover:bg-blue-500/20 hover:text-blue-400 transition-all duration-200">
            <Settings className="w-5 h-5" />
            {isSidebarOpen && "AJUSTES"}
          </button>
        </div>

        <div className="mt-auto px-2 mb-4">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 text-red-500 hover:text-red-400 transition w-full"
          >
            <LogOut className="w-5 h-5" />
            {isSidebarOpen && <span>Cerrar sesión</span>}
          </button>
        </div>
      </nav>

      {/* Main content */}
      <div className="container mx-auto py-2 space-y-8 ">
        <div className="flex items-center gap-2 ">
          <Shield className="h-6 w-6 text-white" />
          <h1 className="text-3xl font-bold text-white">Panel de Administración</h1>
        </div>

        <Tabs defaultValue="users" className="space-y-6 bg-[#2a2a2a] rounded p-6 text-white">
          <TabsList className="grid w-full grid-cols-2 bg-[#3e3e3e] p-1 rounded-lg">
            <TabsTrigger value="users">Gestión de Usuarios</TabsTrigger>
            <TabsTrigger value="courses">Gestión de Cursos</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            <UserManagementTable />
          </TabsContent>

          <TabsContent value="courses" className="space-y-6">
            <CourseManagementTable />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
