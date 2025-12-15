"use client"

import { useState } from "react"
import { Eye, EyeOff, Sun, Moon, X } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/router"
import { GoogleLogin } from "@react-oauth/google"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    nombre: "",
    correo: "",
    password: "",
    acceptTerms: false,
    showPassword: false,
  })
  const [darkMode, setDarkMode] = useState(true)
  const [error, setError] = useState<string[]>([])
  const [showModal, setShowModal] = useState(false)
  const router = useRouter()

  const TERMS_TEXT = `
Swapk - Términos y Condiciones

1. Introducción
Bienvenido a Swapk. Al registrarte y utilizar la plataforma aceptas estos términos y condiciones. Swapk es una plataforma para el intercambio de conocimientos y servicios entre usuarios.

2. Registro y cuenta
— Debes proporcionar información veraz y mantener tus datos actualizados.
— Eres responsable de la seguridad de tu cuenta y de cualquier actividad que ocurra bajo ella.

3. Uso permitido
— Está prohibido publicar contenido ilegal, fraudulento, que infrinja derechos de terceros o que viole las normas comunitarias.
— Los usuarios deben comportarse con respeto y honradez.

4. Contenido e intellectual property
— Cada usuario conserva la propiedad de su contenido. Al publicar en Swapk, otorgas una licencia no exclusiva para mostrar ese contenido en la plataforma.

5. Privacidad y datos
— Tratamos tus datos conforme a la ley y nuestra política de privacidad. Al aceptar los términos también aceptas el tratamiento básico de datos para proveer el servicio.

6. Cancelación y suspensión
— Swapk puede suspender cuentas que violen estos términos. El usuario puede dar de baja su cuenta en cualquier momento siguiendo el proceso disponible en la plataforma.

7. Limitación de responsabilidad
— Swapk actúa como intermediario y no se hace responsable por la veracidad, desempeño o calidad del trabajo ofrecido por terceros.

8. Cambios a los términos
— Podemos actualizar estos términos; notificaremos cambios relevantes.

9. Contacto
— Para consultas: swapk.soporte@gmail.com
`

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const togglePasswordVisibility = () =>
    setFormData((prev) => ({ ...prev, showPassword: !prev.showPassword }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError([])

    if (!formData.acceptTerms) {
      setError(["Debes aceptar los términos y condiciones para registrar tu cuenta."])
      return
    }

    // ✅ Usar directamente la variable de entorno
    const API_URL = process.env.NEXT_PUBLIC_API_URL
    if (!API_URL) {
      setError(["Error: API_URL no configurada. Verifica las variables en Railway."])
      return
    }

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: formData.nombre,
          email: formData.correo,
          password: formData.password,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        const userData = {
          token: data.token,
          id: data.user.id,
          nombre: data.user.nombre,
          correo: data.user.correo,
          perfil: data.perfil,
          rol: data.user.rol,
        }

        localStorage.setItem("user", JSON.stringify(userData))
        document.cookie = `token=${data.token}; path=/; max-age=3600; secure; samesite=strict`

        router.push("/dashboard/index_dashboard")
      } else {
        if (Array.isArray(data.detail)) {
          setError(data.detail.map((e: any) => e.msg))
        } else if (typeof data.detail === "string") {
          setError([data.detail])
        } else {
          setError(["Error desconocido"])
        }
      }
    } catch (err) {
      console.error("Error en el registro:", err)
      setError(["Error en el registro. Revisa tu conexión."])
    }
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-500 ${
        darkMode ? "bg-[#121212] text-white" : "bg-gray-100 text-gray-900"
      }`}
    >
      {/* Header */}
      <header
        className={`flex justify-between items-center shadow-sm border-b px-6 py-4 ${
          darkMode ? "bg-[#121212]" : "bg-white"
        }`}
      >
        <div className="flex items-center gap-3">
          <a href="./">
            <Image
              src="/img/logoswapk.png"
              alt="Logo Swapk"
              width={35}
              height={35}
              className="rounded-lg"
            />
          </a>
          <span className="text-xl font-bold">SWAPK</span>
        </div>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-lg border hover:bg-gray-200 dark:hover:bg-gray-700 transition"
        >
          {darkMode ? (
            <Sun className="w-5 h-5 text-yellow-400" />
          ) : (
            <Moon className="w-5 h-5 text-gray-700" />
          )}
        </button>
      </header>

      {/* Content */}
      <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <Image
              src="/img/logoswapk.png"
              alt="Logo Swapk"
              width={35}
              height={35}
              className="mx-auto rounded-lg mb-4"
            />
            <h1 className="text-3xl font-bold">
              Sw<span className="text-blue-600">a</span>pk
            </h1>
          </div>

          {/* Errores */}
          {error.length > 0 && (
            <ul className="text-red-500 text-sm text-center list-disc list-inside mb-4">
              {error.map((msg, i) => (
                <li key={i}>{msg}</li>
              ))}
            </ul>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <input
              type="text"
              name="nombre"
              placeholder="Nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              required
              className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 ${
                darkMode
                  ? "bg-gray-800 text-white border-gray-700"
                  : "bg-white text-gray-900 border-gray-300"
              }`}
            />
            <input
              type="email"
              name="correo"
              placeholder="Correo electrónico"
              value={formData.correo}
              onChange={handleInputChange}
              required
              className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 ${
                darkMode
                  ? "bg-gray-800 text-white border-gray-700"
                  : "bg-white text-gray-900 border-gray-300"
              }`}
            />

            <div className="relative">
              <input
                type={formData.showPassword ? "text" : "password"}
                name="password"
                placeholder="Contraseña"
                value={formData.password}
                onChange={handleInputChange}
                required
                className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 ${
                  darkMode
                    ? "bg-gray-800 text-white border-gray-700"
                    : "bg-white text-gray-900 border-gray-300"
                }`}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                aria-label={formData.showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {formData.showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <label className="flex items-start gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                name="acceptTerms"
                checked={formData.acceptTerms}
                onChange={handleInputChange}
                className="mt-1 cursor-pointer"
              />
              <span>
                Acepto los <strong>términos y condiciones</strong>.{' '}
                <button
                  type="button"
                  onClick={() => setShowModal(true)}
                  className="text-blue-600 hover:underline ml-1"
                >
                  Leer más
                </button>
              </span>
            </label>

            <button
              type="submit"
              disabled={!formData.acceptTerms}
              className={`w-full py-3 px-4 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${
                !formData.acceptTerms
                  ? "bg-gray-400 text-gray-800"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              Registrarte
            </button>
          </form>

          <div className="text-center text-sm">
            ¿Ya tienes una cuenta?{' '}
            <a href="./login" className="text-blue-600 hover:text-blue-700 font-medium">
              Inicia sesión aquí
            </a>
          </div>

          {/* Google Login */}
          <div className="space-y-4">
            <p className="text-center text-sm">Otras opciones de registro</p>
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  const token = credentialResponse.credential
                  if (!token) {
                    setError(["No se obtuvo el token de Google ❌"])
                    return
                  }

                  const API_URL = process.env.NEXT_PUBLIC_API_URL
                  if (!API_URL) {
                    setError(["Error: API_URL no configurada."])
                    return
                  }

                  try {
                    const res = await fetch(`${API_URL}/auth/google/login`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ token }),
                      credentials: "include",
                    })
                    const data = await res.json()

                    if (!res.ok) throw new Error(data.detail || "Error en Google")

                    const userData = {
                      token: data.token,
                      id: data.user.id,
                      nombre: data.user.nombre,
                      correo: data.user.correo,
                      perfil: data.perfil,
                      rol: data.user.rol,
                    }

                    localStorage.setItem("user", JSON.stringify(userData))
                    document.cookie = `token=${data.token}; path=/; max-age=3600; secure; samesite=strict`
                    router.push("/dashboard/index_dashboard")
                  } catch (err: any) {
                    console.error(err)
                    setError([err.message || "Error al registrarse con Google ❌"])
                  }
                }}
                onError={() => setError(["Error en Google Register ❌"])}
                useOneTap
                theme="filled_blue"
                shape="circle"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Términos */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className={`relative w-full max-w-2xl mx-auto rounded-2xl shadow-lg ${darkMode ? 'bg-[#0f1724] text-white' : 'bg-white text-gray-900'}`}>
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Términos y Condiciones — Swapk</h3>
              <button aria-label="Cerrar" onClick={() => setShowModal(false)} className="p-2 rounded hover:bg-gray-200/30">
                <X />
              </button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-auto prose prose-sm">
              <pre className="whitespace-pre-wrap">{TERMS_TEXT}</pre>
            </div>
            <div className="flex items-center justify-end gap-3 p-4 border-t">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg border">
                Cerrar
              </button>
              <button
                onClick={() => {
                  setFormData((prev) => ({ ...prev, acceptTerms: true }))
                  setShowModal(false)
                }}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white"
              >
                Aceptar y continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
