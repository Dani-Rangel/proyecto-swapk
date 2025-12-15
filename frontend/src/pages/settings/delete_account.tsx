"use client"

import { useTranslation } from "../../lib/useTranslations"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"
import SettingsLayout from "../../components/settings_layout"
import ProtectedRoute from "@/components/protected_routes/protected_routes";

function DeleteAccountComponent() {
  const { t } = useTranslation()
  const [confirmText, setConfirmText] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [userData, setUserData] = useState<{
    nombre: string
    correo: string
    id: number
  } | null>(null)

  // 🔁 Cargar datos del usuario
  useEffect(() => {
    const loadUserData = () => {
      try {
        const savedUserStr = localStorage.getItem("user")
        if (!savedUserStr) {
          setMessage("No hay sesión activa")
          return
        }

        const savedUser = JSON.parse(savedUserStr)
        setUserData({
          nombre: savedUser.nombre || savedUser.user?.nombre || "Usuario",
          correo: savedUser.correo || savedUser.user?.correo || "No disponible",
          id: savedUser.id
        })
      } catch (err) {
        console.error("Error cargando datos del usuario", err)
        setMessage("Error cargando datos del usuario")
      }
    }

    loadUserData()
  }, []) 


  // Eliminar cuenta
  const handleDelete = async () => {
    if (confirmText !== "ELIMINAR") {
      setMessage(t("confirm_text_error"))
      return
    }

    if (!password) {
      setMessage(t("password_required"))
      return
    }

    if (!window.confirm(t("delete_confirm_alert"))) {
      return
    }

    try {
      setLoading(true)
      setMessage("")

      const savedUserStr = localStorage.getItem("user")
      if (!savedUserStr) {
        setMessage(t("no_session"))
        return
      }

      const savedUser = JSON.parse(savedUserStr)
      const token = savedUser.token

      const res = await fetch("https://backend-production-fc5e.up.railway.app/users/me", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ password }) // enviar contraseña para verificación
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.detail || t("delete_error"))
      }

      // Éxito
      localStorage.removeItem("user")
      localStorage.removeItem("token")
      setMessage(t("delete_success"))

      setTimeout(() => {
        window.location.href = "/auth/login"
      }, 2000)

    } catch (err: any) {
      setMessage(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">{t("delete_account_title")}</h1>

        {message && (
          <p className={`text-sm ${message.includes("Error") || message.includes("no") ? "text-red-400" : "text-green-400"}`}>
            {message}
          </p>
        )}

        {/* Datos del usuario */}
        {userData && (
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h3 className="font-semibold">{t("verify_identity")}</h3>
            <p><strong>{t("name")}:</strong> {userData.nombre}</p>
            <p><strong>{t("email")}:</strong> {userData.correo}</p>
          </div>
        )}

        <Card className="bg-red-900/20 border-red-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-5 h-5" />
              {t("danger_zone")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-red-900/30 p-4 rounded-lg border border-red-700">
              <h3 className="font-semibold text-red-300 mb-2">{t("warning_title")}</h3>
              <p className="text-sm text-red-200">{t("delete_warning")}</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t("write_delete_to_confirm")}</label>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="ELIMINAR"
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t("confirm_password")}</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>

            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={confirmText !== "ELIMINAR" || !password || loading}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? t("deleting") : t("delete_account_button")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </SettingsLayout>
  )
}

// ✅ Exportamos el componente protegido
export default function DeleteAccount() {
  return (
    <ProtectedRoute>
      <DeleteAccountComponent />
    </ProtectedRoute>
  )
}
