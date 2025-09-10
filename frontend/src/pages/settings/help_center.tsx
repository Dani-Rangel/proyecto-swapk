"use client"

import { useTranslation } from "../../lib/useTranslations"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { MessageSquare } from "lucide-react"
import { useTheme } from "../../components/state/theme_context"
import SettingsLayout from "../../components/settings_layout"
import { useState } from "react"

export default function HelpCenter() {
  const { t } = useTranslation()
  const { theme } = useTheme()

  const [nombre, setNombre] = useState("")
  const [email, setEmail] = useState("")
  const [tipo, setTipo] = useState("Soporte") // Valor por defecto
  const [message, setMessage] = useState("")
  const [status, setStatus] = useState("")

  const cardBg = theme === "dark" ? "bg-[#1a1a1a]" : "bg-gray-50"
  const borderColor = theme === "dark" ? "border-gray-700" : "border-gray-200"

  const handleSend = async () => {
    if (!nombre || !email || !tipo || !message) {
      return alert("Por favor, llena todos los campos")
    }

    try {
      const res = await fetch("http://localhost:8000/help/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email, tipo, mensaje: message })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Error al enviar el mensaje")
      alert(data.msg)
      
      // Limpiar formulario
      setNombre("")
      setEmail("")
      setTipo("Bug")
      setMessage("")
    } catch (err: any) {
      alert(err.message)
    }
  }

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t("help_center_title")}</h1>
        </div>

        {/* Información */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className={`${cardBg} border ${borderColor}`}>
            <CardContent className="p-6 text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-green-500" />
              <h3 className="font-semibold mb-2">{t("user_manual")}</h3>
              <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"} mb-4`}>
                {t("user_manual_desc")}
              </p>
              <Button variant="outline" className="w-full bg-transparent">
                {t("download")}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Formulario de contacto */}
        <Card className={`${cardBg} border ${borderColor}`}>
          <CardHeader>
            <CardTitle>{t("contact_support")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Nombre */}
            <div>
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Tu nombre"
                className={`${theme === "dark" ? "bg-[#2a2a2a] border-gray-600" : "bg-white border-gray-300"}`}
              />
            </div>

            {/* Correo */}
            <div>
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tuemail@ejemplo.com"
                className={`${theme === "dark" ? "bg-[#2a2a2a] border-gray-600" : "bg-white border-gray-300"}`}
              />
            </div>

            {/* Tipo de mensaje */}
            <div>
              <Label htmlFor="tipo">Motivo</Label>
              <select
                id="tipo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className={`w-full px-3 py-2 rounded-md border focus:outline-none ${
                  theme === "dark" ? "bg-[#2a2a2a] border-gray-600 text-white" : "bg-white border-gray-300 text-black"
                }`}
              >
                <option value="Bug">Bug</option>
                <option value="Sugerencia">Sugerencia</option>
                <option value="Soporte">Soporte</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            {/* Mensaje */}
            <div>
              <Label htmlFor="message">{t("message")}</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t("message_placeholder")}
                className={`${theme === "dark" ? "bg-[#2a2a2a] border-gray-600" : "bg-white border-gray-300"} min-h-[120px]`}
              />
            </div>

            {/* Botón */}
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSend}>
              {t("send_message")}
            </Button>

            {status && <p className="mt-2 text-sm">{status}</p>}
          </CardContent>
        </Card>
      </div>
    </SettingsLayout>
  )
}
