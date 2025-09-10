"use client"

import { useTranslation } from "../../lib/useTranslations"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/router"
import {
  X, Search, HomeIcon, Star, Camera, Plus, Settings,
  LogOut, User, Bell, MessageSquare, Eye, Edit, MapPin, Menu, Sun, Moon
} from "lucide-react"

import { skillsAPI, SkillAssociation, Skill, SkillAssociationResponse } from "@/services/api_Skills"
import { AddSkillForm } from "../../components/ui/AddSkillForm"
import CreateSkillForm from "../../components/ui/CreateSkillForm"
import Image from "next/image"
import axios from "axios"

interface Perfil {
  id: number
  nombre: string
  id_usuario: number
  correo?: string
  descripcion?: string
  ubicacion?: string
  Tel?: number
  foto_perfil?: string
  habilidades: any[]
}

export default function ProfilePage() {
  const { t } = useTranslation()
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true) // Abierto por defecto
  const [showAddForm, setShowAddForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeSkillIndex, setActiveSkillIndex] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const skillContainerRef = useRef<HTMLDivElement>(null)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const [habilidadesDisponibles, setHabilidadesDisponibles] = useState<Skill[]>([])
  const [habilidadesPerfil, setHabilidadesPerfil] = useState<SkillAssociationResponse[]>([])
  const [isDark, setIsDark] = useState(true)

  // Detectar tamaño de pantalla
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false)
      } else {
        setIsSidebarOpen(true)
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Cargar usuario y perfil
  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (!storedUser) {
      router.push("../auth/login")
      return
    }

    try {
      const parsedUser = JSON.parse(storedUser)
      if (!parsedUser.token) {
        console.warn("❌ No hay token en el objeto de usuario")
        setLoading(false)
        return
      }

      setUser(parsedUser)

      axios
        .get(`http://localhost:8000/perfil/usuario/${parsedUser.id}`, {
          headers: { Authorization: `Bearer ${parsedUser.token}` },
        })
        .then((response) => setPerfil(response.data))
        .catch((error) => {
          console.error("Error al obtener el perfil:", error)
          setError("No se pudo cargar el perfil.")
        })
    } catch (err) {
      console.error("Error al parsear localStorage", err)
    } finally {
      setLoading(false)
    }
  }, [router])

  // Cargar habilidades disponibles
  useEffect(() => {
    skillsAPI
      .getSkills()
      .then(setHabilidadesDisponibles)
      .catch((err) => console.error("❌ Error al cargar habilidades disponibles:", err))
  }, [])

  // Cargar habilidades del perfil
  useEffect(() => {
    if (!perfil?.id) return
    skillsAPI
      .getPerfilSkills(perfil.id)
      .then(setHabilidadesPerfil)
      .catch((err) => console.error(err))
  }, [perfil?.id])

  const handleSaveAssociation = async (assoc: SkillAssociation) => {
    try {
      if (!perfil) return
      setLoading(true)

      const nuevaAsociacion = await skillsAPI.associateSkill({
        Perfil_id: perfil.id,
        habilidad_id: assoc.habilidad_id,
        tipo: assoc.tipo,
        nivel: assoc.nivel,
      })

      const habilidadCompleta = habilidadesDisponibles.find((h) => h.id === assoc.habilidad_id)

      setHabilidadesPerfil((prev) => [
        ...prev,
        { ...nuevaAsociacion, habilidad_nombre: habilidadCompleta?.nombre || "" },
      ])
      setShowAddForm(false)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveSkill = async (idAsociacion: number) => {
    if (!perfil) return
    try {
      setLoading(true)
      await skillsAPI.deleteSkillAssociation(idAsociacion)
      setHabilidadesPerfil((prev) => prev.filter((h) => h.id !== idAsociacion))
    } catch (error) {
      console.error(error)
      alert("Error al eliminar la habilidad.")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    router.push("/login")
  }

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.log("Buscando:", searchQuery)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center">
        <div className="text-white text-lg">Cargando perfil...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-4 text-red-500 font-semibold">
        🚫 No hay token de autenticación. Por favor, inicia sesión.
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-[#141414] flex transition-colors duration-300 ${isDark ? "text-[#F5F5F5]" : "text-gray-900"}`}>
      {/* Botón Hamburguesa (solo en móvil) */}
      <div className="absolute top-4 left-4 z-50 md:hidden">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="text-white hover:text-blue-400 transition-colors"
        >
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Overlay en móvil */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <nav
        className={`fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:static flex flex-col border-r
          ${isDark ? "bg-[#1E1E1E] border-[#2E2E2E]" : "bg-white border-gray-200"}
        `}
      >
        {/* Logo + Tema */}
        <div className={`p-4 border-b ${isDark ? "border-[#2E2E2E]" : "border-gray-200"}`}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <Image src="/img/logoswapk.png" alt="Logo Swapk" width={20} height={20} />
              <span className="text-white font-bold">SWAPK</span>
            </div>
            <button
              onClick={() => setIsDark(!isDark)}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
                    {/* Buscador */}
          <form onSubmit={handleSearch} className="relative mb-8">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-gray-400" : "text-gray-500"}`} />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-10 w-full h-10 rounded-lg border-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isDark
                  ? "bg-gray-800 text-white placeholder-gray-400"
                  : "bg-gray-100 text-gray-900 placeholder-gray-500"
              }`}
            />
          </form>

          {/* Íconos rápidos */}
          <div className="flex justify-center gap-3 mb-4">
            <button
              onClick={() => router.push("/message/messages")}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors
                ${isDark ? "text-gray-300 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-100"}`}
              title="Mensajes"
            >
              <MessageSquare className="w-5 h-5" />
            </button>
            <button
              onClick={() => router.push("/notifications")}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors
                ${isDark ? "text-gray-300 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-100"}`}
              title="Notificaciones"
            >
              <Bell className="w-5 h-5" />
            </button>
            <button
              onClick={() => router.push("/profile/profile")}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors
                ${isDark ? "text-gray-300 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-100"}`}
              title="Perfil"
            >
              <User className="w-5 h-5" />
            </button>
            <button
              onClick={() => router.push("/settings/profile_edit")}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors
                ${isDark ? "text-gray-300 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-100"}`}
              title="Ajustes"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>


          {/* Menú de navegación */}
          <nav className="flex-1 p-3">
            <div className="space-y-4">
              {[
                { icon: HomeIcon, label: "INICIO", href: "/" },
                { icon: Search, label: "EXPLORAR", href: "/explore" },
                { icon: Star, label: "MIS TRUEQUES", href: "/mis-trueques" },
                { icon: Camera, label: "MIS CURSOS", href: "/mis-cursos" },
                { icon: Plus, label: "COMUNIDAD", href: "/comunidad" },
                { icon: Settings, label: "AJUSTES", href: "/settings/profile_edit" },
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => router.push(item.href)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors
                    ${isDark
                      ? "text-gray-300 hover:bg-gray-700 hover:text-white"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </button>
              ))}
            </div>
          </nav>

          {/* Logout */}
          <div className={`p-3 border-t ${isDark ? "border-[#2E2E2E]" : "border-gray-200"}`}>
            <button
              onClick={handleLogout}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors
                ${isDark
                  ? "text-red-400 hover:bg-red-900 hover:text-white"
                  : "text-red-600 hover:bg-red-100 hover:text-red-800"
                }`}
            >
              <LogOut className="w-5 h-5" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6 md:ml-0 transition-all duration-300">
        {/* Profile Card */}
        <div className="max-w-6xl mx-auto">
          <div className="bg-[#1E1E1E] border-[#2E2E2E] rounded-xl p-6 border shadow-lg mb-6">
            <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full overflow-hidden">
                  <Image
                    src={perfil?.foto_perfil || "/img/cat_profile.jpg"}
                    alt="Profile"
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button className="absolute -bottom-1 -right-1 bg-blue-600 p-2 rounded-full hover:bg-blue-700 transition-colors">
                  <Camera className="w-4 h-4 text-white" />
                </button>
              </div>

              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-bold flex items-center justify-center md:justify-start gap-2">
                  {perfil?.nombre || "Cargando..."}
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </h2>
                <div className="flex items-center justify-center md:justify-start gap-1 text-gray-400 mt-1">
                  <MapPin className="w-5 h-5" />
                  <span>{perfil?.ubicacion || "Ubicación no especificada"}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-center mb-6">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
            </div>

            <div className="flex justify-center">
              <button
                className="bg-gradient-to-r from-gray-900 to-gray-600 text-white px-6 py-2.5 rounded-lg hover:from-gray-600 hover:to-gray-500 transition-all duration-200 flex items-center gap-2 shadow-lg"
                onClick={() => router.push("/profile/edit")}
              >
                <Edit className="w-4 h-4" />
                Editar perfil
              </button>
            </div>

            <div className="mt-6 p-4 bg-gray-900/50 rounded-lg">
              <p className="text-gray-300 text-sm leading-relaxed">
                {perfil?.descripcion || "¡Bienvenido a tu perfil!"}
              </p>
            </div>
          </div>

          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Información de Intercambios */}
            <div className="bg-[#1E1E1E] border-[#2E2E2E] rounded-xl p-6">
              <h3 className="text-white text-lg font-bold mb-6">Información de Intercambios</h3>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-white mb-1">5</div>
                  <div className="text-gray-400 text-sm">intercambios realizados</div>
                  <div className="text-gray-500 text-xs">cursos completos</div>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-white mb-1">2</div>
                  <div className="text-gray-400 text-sm">Intercambios Inscrito</div>
                  <div className="text-gray-500 text-xs">Cursos a realizar</div>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-white mb-1">7</div>
                  <div className="text-gray-400 text-sm">Persona conocidas</div>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                  <div className="text-gray-400 text-sm">Personas de intercambio</div>
                  <div className="text-gray-500 text-xs">instructores</div>
                </div>
              </div>

              <div className="border-t border-gray-700 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-white text-lx font-semibold">Certificados</h4>
                  <div className="flex gap-2">
                    <button className="bg-blue-600 px-3 py-2 rounded text-white text-sm flex items-center gap-1">
                      <Plus className="w-4 h-4" />
                      Agregar
                    </button>
                    <button className="bg-gray-700 px-3 py-2 rounded text-white text-sm flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      Ver más
                    </button>
                  </div>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-6">
                  <div className="text-center text-gray-400">
                    <p className="text-sm">No tienes certificados aún</p>
                    <p className="text-xs text-gray-500">Subelos a tu perfil para obtener reconocimiento!</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Habilidades */}
            <div className="bg-[#1E1E1E] border-[#2E2E2E] rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white text-lg font-bold">Habilidades</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="bg-blue-600 px-3 py-2 rounded text-white text-sm"
                  >
                    Añadir habilidad
                  </button>
                  <button className="text-emerald-400 text-sm hover:text-emerald-300 transition-colors font-medium hover:underline">
                    Ver más
                  </button>
                </div>
              </div>

              <div ref={skillContainerRef} className="flex flex-wrap gap-3 mb-6">
                {habilidadesPerfil.length > 0 ? (
                  habilidadesPerfil.map((skill, index) => (
                    <div key={skill.id} className="relative group">
                      <span
                        onClick={() => setActiveSkillIndex(prev => (prev === index ? null : index))}
                        className="bg-gradient-to-r from-purple-600 to-purple-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg hover:scale-105 transition-all cursor-pointer"
                      >
                        #{skill.habilidad_nombre || `Habilidad ${index + 1}`}
                      </span>
                      <button
                        onClick={() => handleRemoveSkill(skill.id)}
                        className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                      {activeSkillIndex === index && (
                        <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs p-3 rounded-lg shadow-lg z-10 max-w-xs">
                          <p className="mb-1">
                            <span className="font-semibold">Tipo:</span> {skill.tipo}
                          </p>
                          <p>
                            <span className="font-semibold">Nivel:</span> {skill.nivel}
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-sm">No hay habilidades agregadas</p>
                )}
              </div>

              {showAddForm && (
                <AddSkillForm
                  onClose={() => setShowAddForm(false)}
                  onSave={handleSaveAssociation}
                  perfilId={perfil?.id || 0}
                  habilidades={habilidadesDisponibles}
                />
              )}

              {/* Historial de intercambios */}
              <div className="border-t border-gray-700 pt-6">
                <h4 className="text-white text-lg font-bold mb-4">Historial de intercambios</h4>
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex-shrink-0 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">U</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="font-medium">Usuario</span>
                        <span className="text-gray-400 text-sm">Clases de cocina por lecciones de fotografía</span>
                      </div>
                      <div className="flex gap-1 mb-4">
                        {[...Array(4)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <p className="text-gray-400 text-sm italic mb-3">
                        "Me encantó el intercambio, aprendí mucho y la experiencia fue genial."
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}