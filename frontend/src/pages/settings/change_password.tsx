"use client"

import { useTranslation } from "../../lib/useTranslations"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import SettingsLayout from "../../components/settings_layout"
import ProtectedRoute from "@/components/protected_routes/protected_routes";
function ChangePasswordComponent() {
  const { t } = useTranslation()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [username, setUsername] = useState("")
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadUserData = () => {
      try {
        const savedUserStr = localStorage.getItem("user")
        if (!savedUserStr) return
        const savedUser = JSON.parse(savedUserStr)
        setUsername(savedUser.perfil?.nombre || savedUser.user?.nombre || "")
      } catch (err) {
        console.error("Error al cargar usuario:", err)
      }
    }
    loadUserData()
  }, [])

  const handleSubmit = async () => {
    if (!username.trim()) {
      toast.error("El nombre de usuario no puede estar vacío")
      return
    }

    if (newPassword && newPassword.length < 6) {
      toast.error("La nueva contraseña debe tener al menos 6 caracteres")
      return
    }

    if (newPassword && newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden")
      return
    }

    setLoading(true)

    try {
      const savedUserStr = localStorage.getItem("user")
      if (!savedUserStr) throw new Error("No hay sesión activa")
      const savedUser = JSON.parse(savedUserStr)
      const token = savedUser.token

      // 1️⃣ Actualizar solo nombre de usuario
      await fetch(`http://localhost:8000/perfil/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nombre: username }),
      })

      // 2️⃣ Actualizar contraseña solo si hay nueva
      if (newPassword) {
        const res = await fetch("http://localhost:8000/users/me/change-password", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            old_password: currentPassword,
            new_password: newPassword,
          }),
        })

        const data = await res.json()
        if (!res.ok) throw new Error(data.detail || "Error al cambiar contraseña")
      }

      // ✅ Actualizar localStorage
      const updatedUser = {
        ...savedUser,
        perfil: { ...savedUser.perfil, nombre: username },
        user: { ...savedUser.user, nombre: username },
      }
      localStorage.setItem("user", JSON.stringify(updatedUser))

      toast.success("Datos actualizados correctamente")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")

    } catch (err: any) {
      console.error("Error al actualizar datos:", err)
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const togglePasswordVisibility = (field: "current" | "new" | "confirm") => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }))
  }

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Cambiar contraseña</h1>

        <Card className="bg-[#1a1a1a] border-[#1a1a1a]">
          <CardHeader>
            <CardTitle>Actualizar datos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Nombre de usuario */}
            <div>
              <label className="block text-sm font-medium mb-2">Nombre de usuario</label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nombre de usuario"
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>

            {/* Contraseña actual */}
            <div>
              <label className="block text-sm font-medium mb-2">Contraseña actual</label>
              <div className="relative">
                <Input
                  type={showPasswords.current ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white pr-10"
                  placeholder="Contraseña actual"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                  onClick={() => togglePasswordVisibility("current")}
                >
                  {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Nueva contraseña */}
            <div>
              <label className="block text-sm font-medium mb-2">Nueva contraseña (opcional)</label>
              <div className="relative">
                <Input
                  type={showPasswords.new ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white pr-10"
                  placeholder="Nueva contraseña"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                  onClick={() => togglePasswordVisibility("new")}
                >
                  {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Confirmar nueva contraseña */}
            <div>
              <label className="block text-sm font-medium mb-2">Confirmar nueva contraseña</label>
              <div className="relative">
                <Input
                  type={showPasswords.confirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white pr-10"
                  placeholder="Confirmar nueva contraseña"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                  onClick={() => togglePasswordVisibility("confirm")}
                >
                  {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Botón */}
            <div className="pt-4">
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-70"
              >
                {loading ? "Guardando..." : "Guardar cambios"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </SettingsLayout>
  )
}

// ✅ Exportamos el componente protegido
export default function ChangePassword() {
  return (
    <ProtectedRoute>
      <ChangePasswordComponent />
    </ProtectedRoute>
  )
}