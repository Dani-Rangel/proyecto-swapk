"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Image from "next/image"
import { useTranslation } from "@/lib/useTranslations"
import { useRouter } from "next/navigation"; // ✅ Corregido: next/router → next/navigation
import toast, { Toaster } from 'react-hot-toast'
import Link from "next/link"
import { Input } from "@/components/ui/input"
import {
  Search,
  Menu,
  X,
  User,
  Bell,
  MessageSquare,
  HomeIcon,
  Star,
  Camera,
  Plus,
  Home,
  Settings,
  Moon, 
  Sun,
  PlusIcon,
  LogOut,
  Calendar,
  TrendingUp,
  RefreshCw,
  BookOpen,
  Edit,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import CrearTruequeModal, { TruequeFormData } from "@/components/ui/CreateTruequeForm"
import { TipoHabilidad } from "@/services/intercambio"
import {
  obtenerIntercambios,
  eliminarIntercambio,
  crearIntercambio,
  IntercambioResponse,
  EstadoIntercambio,
  ModoIntercambio,
  NivelIntercambio,
  IdiomaIntercambio,
  Habilidad,
  obtenerTodasHabilidades,
} from "@/services/intercambio"
import { actualizarIntercambio } from "@/services/intercambio"
import { useNotificaciones } from "@/context/notificacionesContext"
import { getCurrentUser } from "@/lib/auth"
import ProtectedRoute from "@/components/protected_routes/protected_routes";
import { MainSidebar } from "@/components/MainSidebar"

function SwapkPlatformComponent() {
  const router = useRouter()
  const { t } = useTranslation()
  const { agregarNotificacion } = useNotificaciones()

  // Tema oscuro
  const [isDark, setIsDark] = useState(true)
  const toggleTheme = () => setIsDark(prev => !prev)

  // Estados
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [modalidad, setModalidad] = useState("")
  const [nivel, setNivel] = useState("")
  const [idioma, setIdioma] = useState("")
  const [isCrearModalOpen, setIsCrearModalOpen] = useState(false)
  const [truequeEditando, setTruequeEditando] = useState<IntercambioResponse | null>(null)
  const [habilidades, setHabilidades] = useState<Habilidad[]>([])
  const [trueques, setTrueques] = useState<IntercambioResponse[]>([])
  const [currentUser, setCurrentUser] = useState(getCurrentUser())
  const [user, setUser] = useState<any>(null)
  const [perfil, setPerfil] = useState<any>(null)

  // Validar usuario logueado
  useEffect(() => {
    const user = getCurrentUser()
    if (user) setCurrentUser(user)
    else router.push("/auth/login") // ✅ Corregido: /login → /auth/login
  }, [router])

  // Cargar intercambios y habilidades
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [truequesData, habilidadesData] = await Promise.all([
          obtenerIntercambios(),
          obtenerTodasHabilidades(),
        ])
        setHabilidades(habilidadesData)
        setTrueques(truequesData)
      } catch (error) {
        console.error("Error cargando trueques o habilidades:", error)
      }
    }
    fetchData()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    router.push("/auth/login") // ✅ Corregido: /login → /auth/login
  }

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => e.preventDefault()

  // Transformar IntercambioResponse a TruequeFormData para el modal
  const mapIntercambioToFormData = (intercambio: IntercambioResponse): TruequeFormData => ({
    modalidad: intercambio.modo || "",
    nivel: intercambio.nivel || "",
    idioma: intercambio.idioma || "",
    descripcion: intercambio.descripcion || "",
    disponibilidad: intercambio.disponibilidad || "",
    habilidades_ofrecidas_ids: intercambio.habilidades_ofrece?.map(h => h.id) || [],
    habilidades_buscadas_ids: intercambio.habilidades_busca?.map(h => h.id) || [],
  })

  // Crear o actualizar trueque
  const handleSaveTrueque = async (formData: TruequeFormData) => {
    if (!currentUser) {
      alert(t("login_required_exchange"))
      return
    }

    const mapHabilidades = (ids: number[], tipo: TipoHabilidad) =>
      ids.map((id) => ({
        id: id,
        nombre: habilidades.find((h) => h.id === id)?.nombre || "",
        tipo,
      }))

    if (truequeEditando) {
      const updatedTrueque = {
        id_usuario1: currentUser.id,
        id_perfil: currentUser.id,
        modo: formData.modalidad as ModoIntercambio,
        nivel: formData.nivel as NivelIntercambio,
        idioma: formData.idioma as IdiomaIntercambio,
        descripcion: formData.descripcion,
        disponibilidad: formData.disponibilidad,
        estado: truequeEditando.estado || EstadoIntercambio.Pendiente,
        habilidades_ofrecidas_ids: formData.habilidades_ofrecidas_ids,
        habilidades_buscadas_ids: formData.habilidades_buscadas_ids,
      }

      try {
        const updated = await actualizarIntercambio(truequeEditando.id, updatedTrueque)
        if (updated) {
          setTrueques((prev) =>
            prev.map((t) => (t.id === updated.id ? updated : t))
          )
        }
      } catch (error) {
        console.error("❌ Error al actualizar intercambio:", error)
      }
    } else {
      const newTrueque = {
        id_usuario1: currentUser.id,
        id_perfil: currentUser.id,
        modo: formData.modalidad as ModoIntercambio,
        nivel: formData.nivel as NivelIntercambio,
        idioma: formData.idioma as IdiomaIntercambio,
        descripcion: formData.descripcion,
        disponibilidad: formData.disponibilidad,
        estado: EstadoIntercambio.Pendiente,
        habilidades_ofrecidas_ids: formData.habilidades_ofrecidas_ids,  
        habilidades_buscadas_ids: formData.habilidades_buscadas_ids,  
      }

      try {
        const saved = await crearIntercambio(newTrueque)
        if (saved) {
        setTrueques((prev) => [...prev, saved])

        // 🚀 Solo si es una NUEVA publicación (no edición), crear notificación
        if (!truequeEditando) {
          const user = getCurrentUser()
          const nombreUsuario = user?.nombre || "Un usuario"

          agregarNotificacion({
            tipo: "Intercambio", // ✅ Coincide con tu enum en el backend
            contenido: `El usuario ${nombreUsuario} ha creado un nuevo intercambio: ${formData.modalidad} - ${formData.nivel}.`,
            id_usuario: user?.id || 0,
          })
        }
      }
      } catch (error) {
        console.error("❌ Error al crear intercambio:", error)
      }
    }

    setTruequeEditando(null)
    setIsCrearModalOpen(false)
  }

  const handleDeleteTrueque = async (id: number) => {
    if (!confirm(t("confirm_delete_exchange"))) return
    const eliminado = await eliminarIntercambio(id)
    if (eliminado) setTrueques(trueques.filter((t) => t.id !== id))
  }

  const handleEditTrueque = (trueque: IntercambioResponse) => {
    setTruequeEditando(trueque)
    setIsCrearModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsCrearModalOpen(false)
    setTruequeEditando(null)
  }

  const renderStars = (rating: number) =>
    Array.from({ length: 4 }, (_, i) => (
      <span key={i} className={`text-yellow-400 ${i < rating ? "opacity-100" : "opacity-30"}`}>
        ★
      </span>
    ))

  const renderEstadoCircle = (estado?: string) => {
    let color = "bg-gray-500"
    if (estado === EstadoIntercambio.Pendiente) color = "bg-orange-500"
    if (estado === EstadoIntercambio.Confirmado) color = "bg-green-500"
    if (estado === EstadoIntercambio.Finalizado) color = "bg-red-500"
    return <span className={`w-3 h-3 rounded-full ${color} inline-block`} />
  }

  const filteredTrueques = trueques.filter((trueque) => {
    const query = searchQuery.toLowerCase()
    const matchesSearchQuery =
      trueque.descripcion?.toLowerCase().includes(query) ||
      trueque.nivel?.toLowerCase().includes(query) ||
      trueque.modo?.toLowerCase().includes(query)

    const matchesFilters =
      (!modalidad || trueque.modo === modalidad) &&
      (!nivel || trueque.nivel === nivel) &&
      (!idioma || trueque.idioma === idioma)

    return matchesSearchQuery && matchesFilters
  })

  // Clases de estilo consistentes con el Sidebar
  const sidebarBgClass = isDark ? "bg-[#1E1E1E]" : "bg-white";
  const sidebarBorderClass = isDark ? "border-[#2E2E2E]" : "border-gray-200";
  const sidebarTextClass = isDark ? "text-[#F5F5F5]" : "text-gray-900";
  const sidebarMutedTextClass = isDark ? "text-[#A0A0A0]" : "text-gray-600";
  const sidebarInputClass = isDark ? "bg-[#1E1E1E] text-[#F5F5F5] placeholder-[#A0A0A0] border-[#2E2E2E]" : "bg-gray-100 text-gray-900 placeholder-gray-500 border-gray-300";
  const sidebarCardClass = isDark ? "bg-[#2E2E2E] border-[#2E2E2E]" : "bg-white border-gray-200";
  const sidebarButtonClass = isDark ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-500 hover:bg-blue-600";

  return (
    <div className={`flex h-screen ${isDark ? "bg-[#1A1A1A]" : "bg-gray-50"} ${sidebarTextClass}`}>
      {/* Botón Hamburguesa */}
      <div className="absolute top-4 left-4 md:hidden z-50">
        <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`${isDark ? "text-gray-300" : "text-gray-600"}`}>
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
      </div>

      {/* Sidebar Izquierdo */}
       <MainSidebar
                  isDark={isDark}
                  toggleTheme={toggleTheme}
                  isSidebarOpen={isSidebarOpen}
                  setIsSidebarOpen={setIsSidebarOpen}
                />

      {/* Main */}
      <div className="flex-1 transition-all duration-300 ml-2">
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Encabezado */}
          <div className={`flex items-center justify-between mb-8 ${sidebarBgClass} ${sidebarBorderClass} p-4 rounded-lg border`}>
            <h2 className={`text-2xl font-bold ${sidebarTextClass}`}>{t("exchanges_title")}</h2>
            <Button
              onClick={() => setIsCrearModalOpen(true)}
              className={sidebarButtonClass}
            >
              {t("create_exchange")}
            </Button>
          </div>

          {/* Filtros */}
          <div className={`mb-6 ${sidebarBgClass} ${sidebarBorderClass} p-4 rounded-lg border`}>
            <form
              onSubmit={handleSearch}
              className="flex flex-col md:flex-row md:items-center md:gap-4"
            >
              {/* Buscador */}
              <div className={`flex items-center ${isDark ? "bg-[#1E1E1E]" : "bg-gray-100"} px-3 py-2 rounded-lg flex-1 border ${isDark ? "border-[#2E2E2E]" : "border-gray-300"}`}>
                <Search className={`w-5 h-5 ${sidebarMutedTextClass} mr-2`} />
                <input
                  type="text"
                  placeholder={t("search_placeholder_exchange")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent outline-none w-full placeholder-current text-inherit"
                />
              </div>

              {/* Filtros */}
              <select
                value={modalidad}
                onChange={(e) => setModalidad(e.target.value)}
                className={`${sidebarInputClass} px-3 py-2 rounded-lg mt-2 md:mt-0`}
              >
                <option value="">{t("all_modalities")}</option>
                {Object.values(ModoIntercambio).map((modo) => (
                  <option key={modo} value={modo} className={sidebarTextClass}>
                    {modo}
                  </option>
                ))}
              </select>

              <select
                value={nivel}
                onChange={(e) => setNivel(e.target.value)}
                className={`${sidebarInputClass} px-3 py-2 rounded-lg mt-2 md:mt-0`}
              >
                <option value="">{t("all_levels")}</option>
                {Object.values(NivelIntercambio).map((niv) => (
                  <option key={niv} value={niv} className={sidebarTextClass}>
                    {niv}
                  </option>
                ))}
              </select>

              <select
                value={idioma}
                onChange={(e) => setIdioma(e.target.value)}
                className={`${sidebarInputClass} px-3 py-2 rounded-lg mt-2 md:mt-0`}
              >
                <option value="">{t("all_languages")}</option>
                {Object.values(IdiomaIntercambio).map((idi) => (
                  <option key={idi} value={idi} className={sidebarTextClass}>
                    {idi}
                  </option>
                ))}
              </select>

              <Button
                type="submit"
                className={`${sidebarButtonClass} mt-2 md:mt-0`}
              >
                {t("search_button")}
              </Button>
            </form>
          </div>

          {/* Listado de trueques */}
          {filteredTrueques.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {filteredTrueques.map((trueque) => (
                <div
                  key={trueque.id}
                  className={`${sidebarCardClass} rounded-xl p-6 flex flex-col hover:shadow-lg transition-shadow`}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <Image
                      src={trueque.perfil?.foto_perfil || "/img/user.png"}
                      alt={trueque.usuario1?.nombre || "Usuario"}
                      width={80}
                      height={80}
                      className="rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 justify-between">
                        <h3 className={`text-xl font-semibold ${sidebarTextClass}`}>
                          {trueque.usuario1?.nombre}
                        </h3>
                        {renderEstadoCircle(trueque.estado)}
                      </div>
                      <div className="flex">{renderStars(trueque.valoracion || 0)}</div>
                      <p className={sidebarMutedTextClass}>{trueque.nivel}</p>

                      <div className="mt-2">
                        <p className="text-xs text-blue-400">{t("offer_label")}</p>
                        <div className="flex flex-wrap gap-1">
                          {trueque.habilidades_ofrece?.map((h, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {String(h.nombre)}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-red-400 mt-2">{t("seek_label")}</p>
                        <div className="flex flex-wrap gap-1">
                          {trueque.habilidades_busca?.map((h, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
                            >
                              {h.nombre}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className={sidebarTextClass} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {trueque.descripcion}
                  </p>

                  {trueque.disponibilidad && (
                    <div className="mt-3 flex items-center gap-2 text-gray-400 text-sm">
                      <Calendar size={16} />
                      <span>{trueque.disponibilidad}</span>
                    </div>
                  )}

                  {/* Botones editar / eliminar si el usuario es dueño */}
                  {currentUser?.id === trueque.id_usuario1 && (
                    <div className="mt-4 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 flex items-center justify-center gap-2"
                        onClick={() => handleEditTrueque(trueque)}
                      >
                        <Edit size={16} /> {t("edit_exchange")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 flex items-center justify-center gap-2 text-red-500 border-red-500 hover:bg-red-500 hover:text-white"
                        onClick={() => handleDeleteTrueque(trueque.id)}
                      >
                        <Trash2 size={16} /> {t("delete_exchange")}
                      </Button>
                    </div>
                  )}
                  {currentUser?.id !== trueque.id_usuario1 && (
                    <div className="mt-4">
                      <Button
                      className={sidebarButtonClass}
                      onClick={() => {
                        const user = getCurrentUser()
                        const nombreUsuario = user?.nombre || "Un usuario"

                        agregarNotificacion({
                          tipo: "Intercambio",
                          contenido: `El usuario ${nombreUsuario} está interesado en tu intercambio: ${trueque.modo} - ${trueque.nivel}.`,
                          id_usuario: trueque.id_usuario1, // ✅ Notificar al autor del intercambio
                        })

                        alert(`Propuesta enviada a ${trueque.usuario1?.nombre}`)
                      }}
                    >
                      {t("propose_exchange")}
                    </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className={`text-center py-16 px-6 rounded-lg ${sidebarBgClass} ${sidebarBorderClass}`}>
              <p className={`${sidebarMutedTextClass} mb-6`}>
                {t("no_exchanges_found")}
              </p>
              <Button
                className={sidebarButtonClass}
                onClick={() => setIsCrearModalOpen(true)}
              >
                {t("create_exchange")}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Modal Crear/Editar Trueque */}
      {isCrearModalOpen && (
        <CrearTruequeModal
          isOpen={isCrearModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveTrueque}
          habilidades={habilidades}
          initialData={truequeEditando ? mapIntercambioToFormData(truequeEditando) : undefined}
          isEditing={!!truequeEditando}
        />
      )}
    </div>
  )
}

// ✅ Exportamos el componente protegido
export default function SwapkPlatform() {
  return (
    <ProtectedRoute>
      <SwapkPlatformComponent />
    </ProtectedRoute>
  )
}