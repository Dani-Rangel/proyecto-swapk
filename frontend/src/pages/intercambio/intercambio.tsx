"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Image from "next/image"
import { useTranslation } from "@/lib/useTranslations"
import { useRouter } from "next/navigation"
import toast from 'react-hot-toast'
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
import { Shuffle } from "lucide-react"; 
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
import ProtectedRoute from "@/components/protected_routes/protected_routes"
import { MainSidebar } from "@/components/MainSidebar"
import axios from "axios"

const api = axios.create({
  baseURL: "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
})

// Añadir token a cada petición (leyendo desde el objeto 'user')
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.token) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${user.token}`;
        }
      } catch (e) {
        console.error("Error parsing user from localStorage", e);
      }
    }
  }
  return config;
});

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

  // Modal de propuestas
  const [propuestas, setPropuestas] = useState<any[]>([])
  const [showPropuestasModal, setShowPropuestasModal] = useState(false)
  const [selectedIntercambioId, setSelectedIntercambioId] = useState<number | null>(null)
  const [propuestasEnviadas, setPropuestasEnviadas] = useState<Set<number>>(new Set())

  // Modal de reseña
  const [showResenaModal, setShowResenaModal] = useState(false)
  const [truequeParaFinalizar, setTruequeParaFinalizar] = useState<IntercambioResponse | null>(null)

  // Verifica si el usuario actual es participante (creador o proponente aceptado)
const esParticipante = (trueque: IntercambioResponse): boolean => {
  if (!currentUser) return false;
  
  // Es el creador
  if (trueque.id_usuario1 === currentUser.id) return true;
  
  // Es el proponente aceptado (solo en estado Confirmado)
  if (trueque.estado === EstadoIntercambio.Confirmado) {
    const propuestaAceptada = trueque.propuestas?.find((p: any) => p.aceptada);
    return propuestaAceptada?.id_usuario_interesado === currentUser.id;
  }
  
  return false;
};

  // Validar usuario logueado
  useEffect(() => {
    const user = getCurrentUser()
    if (user) setCurrentUser(user)
    else router.push("/auth/login")
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

  useEffect(() => {
    const cargarMisPropuestas = async () => {
      if (!currentUser) return;

      try {
        const res = await api.get("/intercambios/mis-propuestas");
        const ids = new Set<number>();
        for (const prop of res.data) {
          ids.add(prop.id_intercambio);
        }
        setPropuestasEnviadas(ids);
      } catch (error: any) {
        console.error("❌ Error al cargar mis propuestas:", error.response?.data || error.message);
      }
    };
    cargarMisPropuestas();
  }, [currentUser]);

  const handleLogout = () => {
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    router.push("/auth/login")
  }

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => e.preventDefault()

  const mapIntercambioToFormData = (intercambio: IntercambioResponse): TruequeFormData => ({
    modalidad: intercambio.modo || "",
    nivel: intercambio.nivel || "",
    idioma: intercambio.idioma || "",
    descripcion: intercambio.descripcion || "",
    disponibilidad: intercambio.disponibilidad || "",
    habilidades_ofrecidas_ids: intercambio.habilidades_ofrece?.map(h => h.id) || [],
    habilidades_buscadas_ids: intercambio.habilidades_busca?.map(h => h.id) || [],
  })

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

          const user = getCurrentUser()
          const nombreUsuario = user?.nombre || "Un usuario"

          agregarNotificacion({
            tipo: "Intercambio",
            contenido: `El usuario ${nombreUsuario} ha creado un nuevo intercambio: ${formData.modalidad} - ${formData.nivel}.`,
            id_usuario: user?.id || 0,
          })
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

  // Cargar propuestas de un intercambio (solo para creador)
  const cargarPropuestas = async (intercambioId: number) => {
    try {
      const res = await api.get(`/intercambios/${intercambioId}/propuestas`)
      setPropuestas(res.data)
      setSelectedIntercambioId(intercambioId)
      setShowPropuestasModal(true)
    } catch (error: any) {
      console.error("Error al cargar propuestas:", error)
      toast.error(error.response?.data?.detail || "No se pudieron cargar las propuestas")
    }
  }

  // Enviar reseña y finalizar intercambio
 const enviarResena = async (calificacion: number, comentario: string) => {
  if (!truequeParaFinalizar || !currentUser) return

  try {
    await api.post(`/intercambios/${truequeParaFinalizar.id}/finalizar`, {
      intercambio_id: truequeParaFinalizar.id,
      usuario_id: currentUser.id,
      calificacion,
      comentario
    })

    toast.success("Intercambio finalizado con éxito")
    setShowResenaModal(false)
    setTruequeParaFinalizar(null)

    // ✅ Recargar intercambios para actualizar el estado y eliminar propuestas
    const [truequesData] = await Promise.all([obtenerIntercambios()])
    setTrueques(truequesData)
  } catch (error: any) {
    toast.error(error.response?.data?.detail || "Error al finalizar intercambio")
  }
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

  const sidebarBgClass = isDark ? "bg-[#1E1E1E]" : "bg-white";
  const sidebarBorderClass = isDark ? "border-[#2E2E2E]" : "border-gray-200";
  const sidebarTextClass = isDark ? "text-[#F5F5F5]" : "text-gray-900";
  const sidebarMutedTextClass = isDark ? "text-[#A0A0A0]" : "text-gray-600";
  const sidebarInputClass = isDark ? "bg-[#1E1E1E] text-[#F5F5F5] placeholder-[#A0A0A0] border-[#2E2E2E]" : "bg-gray-100 text-gray-900 placeholder-gray-500 border-gray-300";
  const sidebarCardClass = isDark ? "bg-[#2E2E2E] border-[#2E2E2E]" : "bg-white border-gray-200";
  const sidebarButtonClass = isDark ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-500 hover:bg-blue-600";

  return (
    <div className={`flex h-screen ${isDark ? "bg-[#1A1A1A]" : "bg-gray-50"} ${sidebarTextClass}`}>
      <div className="absolute top-4 left-4 md:hidden z-50">
        <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`${isDark ? "text-gray-300" : "text-gray-600"}`}>
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
      </div>

      <MainSidebar
        isDark={isDark}
        toggleTheme={toggleTheme}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        user={user}
      />

      <div className="flex-1 transition-all duration-300 ml-2">
        <div className="flex-1 p-6 overflow-y-auto">
          <div className={`flex items-center justify-between mb-8 ${sidebarBgClass} ${sidebarBorderClass} p-4 rounded-lg border`}>
            <h2 className={`text-2xl font-bold ${sidebarTextClass}`}>{t("exchanges_title")}</h2>
            <Button
              onClick={() => setIsCrearModalOpen(true)}
              className={sidebarButtonClass}
            >
              {t("create_exchange")}
            </Button>
          </div>

          <div className={`mb-6 ${sidebarBgClass} ${sidebarBorderClass} p-4 rounded-lg border`}>
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row md:items-center md:gap-4">
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

              <Button type="submit" className={`${sidebarButtonClass} mt-2 md:mt-0`}>
                {t("search_button")}
              </Button>
            </form>
          </div>

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
                        {trueque.estado === EstadoIntercambio.Confirmado ? (
                          // ✅ Mostrar ambos usuarios con icono de intercambio
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold ${sidebarTextClass}`}>
                              {trueque.usuario1?.nombre}
                            </span>
                            <div className="flex items-center text-gray-400">
                              <Shuffle className="mx-1 text-gray-500" />
                            </div>
                            {/* Obtener el nombre del proponente aceptado */}
                            {trueque.propuestas?.find((p: any) => p.aceptada)?.usuario_interesado?.nombre || "Usuario"}
                          </div>
                        ) : (
                          // Estado normal (solo creador)
                          <h3 className={`text-xl font-semibold ${sidebarTextClass}`}>
                            <Link
                              href={`/profile/${trueque.id_usuario1}`}
                              className="text-gray-400 hover:underline hover:text-gray-300 transition-colors"
                              onClick={(e) => {
                                if (trueque.id_usuario1 === currentUser?.id) {
                                  e.preventDefault();
                                }
                              }}
                            >
                              {trueque.usuario1?.nombre}
                            </Link>
                          </h3>
                        )}
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

                  {currentUser?.id === trueque.id_usuario1 && (
                  <div className="mt-4 flex gap-2">
                    {trueque.estado === EstadoIntercambio.Pendiente && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => cargarPropuestas(trueque.id)}
                      >
                        Ver propuestas
                      </Button>
                    )}
                    {/* ✅ Botón de finalizar SOLO para participantes */}
                    {esParticipante(trueque) && trueque.estado === EstadoIntercambio.Confirmado && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setTruequeParaFinalizar(trueque)
                          setShowResenaModal(true)
                        }}
                      >
                        Finalizar intercambio
                      </Button>
                    )}
                    
                    {trueque.estado === EstadoIntercambio.Finalizado && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                        onClick={async () => {
                          if (!window.confirm("¿Restablecer este intercambio a estado pendiente?")) return;
                          try {
                            await api.post(`/intercambios/${trueque.id}/restablecer`);
                            toast.success("Intercambio restablecido");
                            // Recargar intercambios
                            const [truequesData] = await Promise.all([obtenerIntercambios()]);
                            setTrueques(truequesData);
                          } catch (error: any) {
                            toast.error(error.response?.data?.detail || "Error al restablecer intercambio");
                          }
                        }}
                      >
                        Restablecer intercambio
                      </Button>
                    )}
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

                  {!esParticipante(trueque) && trueque.estado === EstadoIntercambio.Confirmado && (
                      <div className="mt-4">
                        <Button disabled className="opacity-70 w-full bg-blue-900/30 text-blue-200 cursor-not-allowed">
                          🤝 Intercambio en proceso entre {trueque.usuario1?.nombre} y otro usuario
                        </Button>
                      </div>
                    )}
                  {currentUser?.id !== trueque.id_usuario1 && trueque.estado === EstadoIntercambio.Pendiente && (
                    <div className="mt-4">
                      {propuestasEnviadas.has(trueque.id) ? (
                        <Button
                          variant="outline"
                          className="bg-red-500 hover:bg-red-600 text-white w-full"
                          onClick={async () => {
                            try {
                              // Obtener ID de la propuesta
                              const res = await api.get("/intercambios/mis-propuestas");
                              const miPropuesta = res.data.find((p: any) => p.id_intercambio === trueque.id);
                              if (!miPropuesta) return;

                              // Cancelar propuesta
                              await api.delete(`/intercambios/${trueque.id}/propuestas/${miPropuesta.id_propuesta}`);
                              toast.success("Propuesta cancelada");
                              setPropuestasEnviadas(prev => {
                                const newSet = new Set(prev);
                                newSet.delete(trueque.id);
                                return newSet;
                              });
                            } catch (error: any) {
                              toast.error(error.response?.data?.detail || "Error al cancelar propuesta");
                            }
                          }}
                        >
                          Cancelar propuesta
                        </Button>
                      ) : (
                        <Button
                          className={sidebarButtonClass}
                          onClick={async () => {
                            if (!currentUser) return;
                            try {
                              await api.post(`/intercambios/${trueque.id}/propuesta`);
                              toast.success(`Propuesta enviada a ${trueque.usuario1?.nombre}`);
                              // Recargar propuestas
                              const res = await api.get("/intercambios/mis-propuestas");
                              const ids = new Set<number>();
                              for (const prop of res.data) {
                                ids.add(prop.id_intercambio);
                              }
                              setPropuestasEnviadas(ids);
                            } catch (error: any) {
                              toast.error(error.response?.data?.detail || "Error al enviar propuesta");
                            }
                          }}
                        >
                          {t("propose_exchange")}
                        </Button>
                      )}
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

      {/* Modal de Propuestas */}
      {showPropuestasModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${sidebarBgClass} rounded-xl p-6 w-full max-w-md mx-4`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-xl font-bold ${sidebarTextClass}`}>Propuestas</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowPropuestasModal(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {propuestas.length === 0 ? (
              <p className={sidebarMutedTextClass}>No hay propuestas aún.</p>
            ) : (
              <div className="space-y-4">
                {propuestas.map((prop) => (
                  <div key={prop.id} className={`${sidebarCardClass} p-4 rounded-lg`}>
                    <div className="flex justify-between items-center">
                      <span className={sidebarTextClass}>{prop.usuario_interesado.nombre}</span>
                      {prop.aceptada ? (
                        <span className="text-green-500">Confirmado</span>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={async () => {
                              try {
                                const res = await api.post(`/intercambios/${selectedIntercambioId}/propuestas/${prop.id}/aceptar`);
                                toast.success("Propuesta aceptada");
                                router.push(res.data.redirect);
                              } catch (error: any) {
                                toast.error(error.response?.data?.detail || "Error al aceptar");
                              }
                            }}
                          >
                            Confirmar
                          </Button>
                          {/* ✅ Botón para rechazar (solo creador lo ve) */}
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-red-500 hover:bg-red-600 text-white"
                            onClick={async () => {
                              if (!window.confirm("¿Rechazar esta propuesta?")) return;
                              try {
                                await api.delete(`/intercambios/${selectedIntercambioId}/propuestas/${prop.id}`);
                                toast.success("Propuesta rechazada");
                                // Recargar propuestas
                                const res = await api.get(`/intercambios/${selectedIntercambioId}/propuestas`);
                                setPropuestas(res.data);
                              } catch (error: any) {
                                toast.error(error.response?.data?.detail || "Error al rechazar");
                              }
                            }}
                          >
                            Rechazar
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Button
              className="mt-4 w-full"
              onClick={() => setShowPropuestasModal(false)}
            >
              Cerrar
            </Button>
          </div>
        </div>
      )}

      {/* Modal de Reseña */}
        {showResenaModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#1E1E1E] rounded-xl p-6 w-full max-w-md mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">Dejanos tu opinión sobre este trueque</h3>
                <Button variant="ghost" size="icon" onClick={() => {
                  setShowResenaModal(false)
                  setTruequeParaFinalizar(null)
                }}>
                  <X className="w-5 h-5 text-white" />
                </Button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault()
                const form = e.target as HTMLFormElement
                const calificacion = parseInt((form.elements.namedItem('calificacion') as HTMLInputElement)?.value || '0')
                const comentario = (form.elements.namedItem('comentario') as HTMLTextAreaElement)?.value || ''
                enviarResena(calificacion, comentario)
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Calificación</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        name="calificacion"
                        value={star}
                        onClick={(e) => {
                          const buttons = document.querySelectorAll('button[name="calificacion"]')
                          buttons.forEach((btn, i) => {
                            if (i < star) btn.classList.add('text-yellow-400')
                            else btn.classList.remove('text-yellow-400')
                          })
                        }}
                        className="text-2xl text-gray-400"
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Comentario</label>
                  <textarea
                    name="comentario"
                    placeholder="Cuéntanos brevemente tu experiencia..."
                    className="w-full px-3 py-2 bg-[#2E2E2E] text-white rounded-lg border border-[#404040] resize-none"
                    rows={4}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 text-blue-400 hover:bg-blue-900"
                    onClick={() => {
                      toast.custom("Función de reporte en desarrollo");
                    }}
                  >
                    Reportar Trueque
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    Enviar feedback
                  </Button>
                </div>
              </form>

              {/* ✅ Nuevo botón: Finalizar sin reseña */}
              <div className="mt-4 pt-4 border-t border-[#404040]">
                <Button
                  type="button"
                  className="w-full bg-gray-600 hover:bg-gray-700"
                  onClick={async () => {
                    if (!truequeParaFinalizar) return;
                    try {
                      await api.post(`/intercambios/${truequeParaFinalizar.id}/finalizar`);
                      toast.success("Intercambio finalizado sin reseña");
                      setShowResenaModal(false);
                      setTruequeParaFinalizar(null);
                      // Recargar intercambios
                      const [truequesData] = await Promise.all([obtenerIntercambios()]);
                      setTrueques(truequesData);
                    } catch (error: any) {
                      toast.error(error.response?.data?.detail || "Error al finalizar intercambio");
                    }
                  }}
                >
                  Finalizar sin reseña
                </Button>
              </div>
            </div>
          </div>
        )}
    </div>
  )
}

export default function SwapkPlatform() {
  return (
    <ProtectedRoute>
      <SwapkPlatformComponent />
    </ProtectedRoute>
  )
}