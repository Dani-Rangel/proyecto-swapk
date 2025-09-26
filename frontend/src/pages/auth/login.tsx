"use client"
import React, { useState, useEffect } from "react"
import { Eye, EyeOff, Sun, Moon } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/router"
import { GoogleLogin } from "@react-oauth/google"
import axios from "axios"

const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    emailOrUsername: "",
    password: "",
    showPassword: false,
  })
  const [error, setError] = useState("")
  const [darkMode, setDarkMode] = useState(true)
  const [attempts, setAttempts] = useState(0)
  const [isLocked, setIsLocked] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const router = useRouter()

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (isLocked && countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000)
    }
    if (countdown === 0 && isLocked) {
      setIsLocked(false)
      setAttempts(0)
    }
    return () => clearInterval(timer)
  }, [isLocked, countdown])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const togglePasswordVisibility = () =>
    setFormData((prev) => ({ ...prev, showPassword: !prev.showPassword }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLocked) return

    try {
      const res = await fetch("http://localhost:8000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailOrUsername: formData.emailOrUsername,
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
        setError(data.detail || "Error al iniciar sesión")
        setAttempts((prev) => prev + 1)
      }
    } catch (err) {
      console.error(err)
      setError("Error de conexión con el servidor")
      setAttempts((prev) => prev + 1)
    }

    if (attempts + 1 >= 5) {
      setIsLocked(true)
      setCountdown(5)
    }
  }

  return (
    <div className={`min-h-screen ${darkMode ? "bg-[#121212] text-white" : "bg-gray-100 text-gray-900"}`}>
      <header
        className={`flex justify-between items-center shadow-sm border-b px-6 py-4 ${
          darkMode ? "bg-[#121212]" : "bg-white"
        }`}
      >
        <div className="flex items-center gap-3">
          <a href="./">
            <Image src="/img/logoswapk.png" alt="Logo Swapk" width={35} height={35} className="rounded-lg" />
          </a>
          <span className="text-xl font-bold">SWAPK</span>
        </div>
        <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-lg border">
          {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-700" />}
        </button>
      </header>

      <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <Image src="/img/logoswapk.png" alt="Logo Swapk" width={35} height={35} className="mx-auto rounded-lg mb-4" />
            <h1 className="text-3xl font-bold">Sw<span className="text-blue-600">a</span>pk</h1>
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <input
              type="text"
              name="emailOrUsername"
              placeholder="Correo electrónico o usuario"
              value={formData.emailOrUsername}
              onChange={handleInputChange}
              required
              disabled={isLocked}
              className="w-full px-4 py-2 rounded-lg border"
            />
            <div className="relative">
              <input
                type={formData.showPassword ? "text" : "password"}
                name="password"
                placeholder="Contraseña"
                value={formData.password}
                onChange={handleInputChange}
                required
                disabled={isLocked}
                className="w-full px-4 py-2 rounded-lg border"
              />
              <button type="button" onClick={togglePasswordVisibility} className="absolute right-3 top-3 text-gray-500">
                {formData.showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>
            <button
              type="submit"
              disabled={isLocked}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700"
            >
              Iniciar sesión
            </button>
          </form>

          <p className="text-center text-sm">Otra opcion de inicio de sesión</p>
          {/* Google login */}
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                const token = credentialResponse.credential
                if (!token) {
                  setError("No se obtuvo el token de Google ❌")
                  return
                }
                try {
                  const res = await axios.post("http://localhost:8000/auth/google/login", { token })
                  const data = res.data
                  const userData = {
                    token: data.token,
                    id: data.id,
                    nombre: data.nombre,
                    correo: data.correo,
                    perfil: data.perfil,
                    rol: data.user.rol,
                  }
                  localStorage.setItem("user", JSON.stringify(userData))
                  document.cookie = `token=${data.token}; path=/; max-age=3600; secure; samesite=strict`
                  router.push("/dashboard/index_dashboard")
                } catch (err: any) {
                  console.error(err.response || err)
                  setError(err.response?.data?.detail || "Error al iniciar sesión con Google ❌")
                }
              }}
              onError={() => setError("Error en Google Login ❌")}
              useOneTap
              theme="filled_blue"
              shape="circle"
            />
          </div>

          {/* Links extras */}
          <div className="text-center space-y-2">
            <p className="text-sm">
              ¿No tienes cuenta?{" "}
              <button
                onClick={() => router.push("/auth/register")}
                className="text-blue-600 hover:underline"
              >
                Regístrate aquí
              </button>
            </p>
            <p className="text-sm">
              <button
                onClick={() => router.push("/auth/forgot_password")}
                className="text-gray-500 hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
