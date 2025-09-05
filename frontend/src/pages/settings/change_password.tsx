"use client"

import { useTranslation } from "../../lib/useTranslations"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import SettingsLayout from "../../components/settings_layout"

export default function ChangePassword() {
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

  // 🔁 Cargar datos del usuario al iniciar
  useEffect(() => {
    const loadUserData = () => {
      try {
        const savedUserStr = localStorage.getItem("user")
        if (!savedUserStr) {
          toast.error(t("no_session"))
          return
        }

        const savedUser = JSON.parse(savedUserStr)
        setUsername(savedUser.perfil?.nombre || savedUser.user?.nombre || "")
      } catch (err) {
        console.error("Error al cargar usuario:", err)
        toast.error(t("error_loading_user"))
      }
    }

    loadUserData()
  }, [t])

  // ✅ Cambiar contraseña o nombre de usuario
  const handleSubmit = async () => {
    if (!username.trim()) {
      toast.error(t("username_empty"))
      return
    }

    if (newPassword && newPassword.length < 6) {
      toast.error(t("password_too_short"))
      return
    }

    if (newPassword && newPassword !== confirmPassword) {
      toast.error(t("passwords_do_not_match"))
      return
    }

    setLoading(true)

    try {
      const savedUserStr = localStorage.getItem("user")
      if (!savedUserStr) {
        toast.error(t("no_session"))
        setLoading(false)
        return
      }

      const savedUser = JSON.parse(savedUserStr)
      const token = savedUser.token
      const userId = savedUser.id

      const res = await fetch(`http://localhost:8000/perfil/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombre: username,
          ...(newPassword && { contrasena: newPassword }),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.detail || t("update_error"))
      }

      const updatedUser = {
        ...savedUser,
        perfil: { ...savedUser.perfil, nombre: username },
        user: { ...savedUser.user, nombre: username },
      }
      localStorage.setItem("user", JSON.stringify(updatedUser))

      toast.success(t("data_updated_success"))
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")

    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const togglePasswordVisibility = (field: "current" | "new" | "confirm") => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }))
  }

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">{t("change_password_title")}</h1>

        <Card className="bg-[#1a1a1a] border-[#1a1a1a]">
          <CardHeader>
            <CardTitle>{t("update_data_card_title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Nombre de usuario */}
            <div>
              <label className="block text-sm font-medium mb-2">{t("username")}</label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t("username_placeholder")}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>

            {/* Contraseña actual */}
            <div>
              <label className="block text-sm font-medium mb-2">{t("current_password")}</label>
              <div className="relative">
                <Input
                  type={showPasswords.current ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white pr-10"
                  placeholder={t("current_password_placeholder")}
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
              <label className="block text-sm font-medium mb-2">{t("new_password_optional")}</label>
              <div className="relative">
                <Input
                  type={showPasswords.new ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white pr-10"
                  placeholder={t("new_password_placeholder")}
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
              <label className="block text-sm font-medium mb-2">{t("confirm_new_password")}</label>
              <div className="relative">
                <Input
                  type={showPasswords.confirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white pr-10"
                  placeholder={t("confirm_new_password_placeholder")}
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
                {loading ? t("saving") : t("save_changes")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </SettingsLayout>
  )
}
