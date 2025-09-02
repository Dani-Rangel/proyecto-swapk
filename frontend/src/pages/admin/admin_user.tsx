"use client"

import { useState, useEffect } from "react"
import { UserManagementTable } from "@/components/admin/user-management-table"
import { CourseManagementTable } from "@/components/admin/course-management-table"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, ShieldAlert } from "lucide-react"
import { RolUsuario } from "@/types/user"

export default function AdminPage() {
  const [currentUserRole, setCurrentUserRole] = useState<RolUsuario | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simular verificación de rol del usuario actual
    // En una aplicación real, esto vendría de tu sistema de autenticación
    const checkUserRole = async () => {
      try {
        // Simular llamada a API para obtener el rol del usuario actual
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Para demo, simular que el usuario es administrador
        // En producción, esto vendría de tu JWT token o sesión
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
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold">Panel de Administración</h1>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
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
  )
}
