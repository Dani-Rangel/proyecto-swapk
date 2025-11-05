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
import ReporteDialog from "@/components/ui/reporte_dialog";
import axios from "axios"

const api = axios.create({
  baseURL: "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
})

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
        // No hacer nada si hay error, solo continuar sin token.
      }
    }
  }
  return config;
});

function SwapkPlatformComponent() {
  const router = useRouter()
  const { t } = useTranslation()
  const { agregarNotificacion } = useNotificaciones()

  const [isDark, setIsDark] = useState(true)
  const toggleTheme = () => setIsDark(prev => !prev)

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
  const [showReporteModal, setShowReporteModal] = useState(false);
  const [intercambioAReportar, setIntercambioAReportar] = useState<number | null>(null);

  const [propuestas, setPropuestas] = useState<any[]>([])
  const [showPropuestasModal, setShowPropuestasModal] = useState(false)
  const [selectedIntercambioId, setSelectedIntercambioId] = useState<number | null>(null)
  const [propuestasEnviadas, setPropuestasEnviadas] = useState<Set<number>>(new Set())

  const [showResenaModal, setShowResenaModal] = useState(false)
  const [truequeParaFinalizar, setTruequeParaFinalizar] = useState<IntercambioResponse | null>(null)
  const [calificacion, setCalificacion] = useState(0)
  const [comentario, setComentario] = useState("")

  const esParticipante = (trueque: IntercambioResponse): boolean => {
    if (!currentUser) return false;
    if (trueque.id_usuario1 === currentUser.id) return true;
    if (trueque.estado === EstadoIntercambio.Confirmado) {
      const propuestaAceptada = trueque.propuestas?.find((p: any) => p.aceptada);
      return propuestaAceptada?.id_usuario_interesado === currentUser.id;
    }
    return false;
  };

  useEffect(() => {
    const user = getCurrentUser()
    if (user) setCurrentUser(user)
    else router.push("/auth/login")
  }, [router])

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
      setCalificacion(0)
      setComentario("")
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

  return (
    <div className="flex h-screen bg-[#121212] text-[#F5F5F5]">
      <div className="absolute top-4 left-4 md:hidden z-50">
        <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-gray-300">
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
      </div>

      <MainSidebar
        isDark={isDark}
        toggleTheme={toggleTheme}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      <div className="flex-1 transition-all duration-300 ml-2 overflow-y-auto">
        <div className="flex-1 p-6">
          <div className="flex items-center justify-between mb-8 bg-[#1E1E1E] border-[#2E2E2E] p-4 rounded-lg border">
            <h2 className="text-2xl font-bold text-[#F5F5F5]">{t("exchanges_title")}</h2>
            <Button
              onClick={() => setIsCrearModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {t("create_exchange")}
            </Button>
          </div>

          <div className="mb-6 bg-[#1E1E1E] border-[#2E2E2E] p-4 rounded-lg border">
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row md:items-center md:gap-4">
              <div className="flex items-center bg-[#1E1E1E] px-3 py-2 rounded-lg flex-1 border border-[#2E2E2E]">
                <Search className="w-5 h-5 text-[#A0A0A0] mr-2" />
                <input
                  type="text"
                  placeholder={t("search_placeholder_exchange")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent outline-none w-full placeholder-[#A0A0A0] text-[#F5F5F5]"
                />
              </div>

              <select
                value={modalidad}
                onChange={(e) => setModalidad(e.target.value)}
                className="bg-[#1E1E1E] text-[#F5F5F5] placeholder-[#A0A0A0] border-[#2E2E2E] px-3 py-2 rounded-lg mt-2 md:mt-0"
              >
                <option value="">{t("all_modalities")}</option>
                {Object.values(ModoIntercambio).map((modo) => (
                  <option key={modo} value={modo} className="text-[#F5F5F5]">
                    {modo}
                  </option>
                ))}
              </select>

              <select
                value={nivel}
                onChange={(e) => setNivel(e.target.value)}
                className="bg-[#1E1E1E] text-[#F5F5F5] placeholder-[#A0A0A0] border-[#2E2E2E] px-3 py-2 rounded-lg mt-2 md:mt-0"
              >
                <option value="">{t("all_levels")}</option>
                {Object.values(NivelIntercambio).map((niv) => (
                  <option key={niv} value={niv} className="text-[#F5F5F5]">
                    {niv}
                  </option>
                ))}
              </select>

              <select
                value={idioma}
                onChange={(e) => setIdioma(e.target.value)}
                className="bg-[#1E1E1E] text-[#F5F5F5] placeholder-[#A0A0A0] border-[#2E2E2E] px-3 py-2 rounded-lg mt-2 md:mt-0"
              >
                <option value="">{t("all_languages")}</option>
                {Object.values(IdiomaIntercambio).map((idi) => (
                  <option key={idi} value={idi} className="text-[#F5F5F5]">
                    {idi}
                  </option>
                ))}
              </select>

              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 mt-2 md:mt-0">
                {t("search_button")}
              </Button>
            </form>
          </div>

          {filteredTrueques.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {filteredTrueques.map((trueque) => (
                <div
                  key={trueque.id}
                  className="bg-[#1E1E1E] rounded-xl p-6 flex flex-col hover:shadow-lg hover:shadow-blue-500/10 transition-shadow border border-[#2D2D2D] hover:border-blue-500/50"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <Image
                      src={trueque.perfil?.foto_perfil || "/img/user.png"}
                      alt={trueque.usuario1?.nombre || "Usuario"}
                      width={48}
                      height={48}
                      className="rounded-full object-cover border border-[#333]"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 justify-between">
                        {trueque.estado === EstadoIntercambio.Confirmado ? (
                          <div className="flex items-center gap-1">
                            <span className="font-semibold text-white">
                              {trueque.usuario1?.nombre}
                            </span>
                            <div className="flex items-center text-gray-400">
                              <Shuffle className="mx-0.5 text-gray-500 w-4 h-4" />
                            </div>
                            {trueque.propuestas?.find((p: any) => p.aceptada)?.usuario_interesado?.nombre || "Usuario"}
                          </div>
                        ) : (
                          <h3 className="text-lg font-semibold text-white">
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
                      <div className="flex mb-1">
                        {renderStars(trueque.valoracion || 0)}
                      </div>
                      <p className="text-xs text-gray-400">{trueque.nivel}</p>
                      <div className="space-y-2 mt-2">
                        <div>
                          <p className="text-xs text-blue-400 mb-1">{t("offer_label")}</p>
                          <div className="flex flex-wrap gap-1">
                            {trueque.habilidades_ofrece?.map((h, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-md text-xs font-medium bg-blue-600 text-white border border-blue-500"
                              >
                                {String(h.nombre)}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-red-400 mb-1">{t("seek_label")}</p>
                          <div className="flex flex-wrap gap-1">
                            {trueque.habilidades_busca?.map((h, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-md text-xs font-medium bg-red-600 text-white border border-red-500"
                              >
                                {h.nombre}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-300 mb-3 line-clamp-3" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {trueque.descripcion}
                  </p>
                  {trueque.disponibilidad && (
                    <div className="flex items-center gap-2 text-gray-500 text-xs mb-4">
                      <Calendar size={14} />
                      <span>{trueque.disponibilidad}</span>
                    </div>
                  )}
                  {currentUser?.id === trueque.id_usuario1 && (
                    <div className="mt-4 flex gap-2">
                      {trueque.estado === EstadoIntercambio.Pendiente && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-white border-gray-600 hover:bg-gray-700"
                          onClick={() => cargarPropuestas(trueque.id)}
                        >
                          Ver propuestas
                        </Button>
                      )}
                      {trueque.estado === EstadoIntercambio.Finalizado && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-white bg-orange-600 hover:bg-orange-700 border-orange-500"
                          onClick={async () => {
                            if (!window.confirm("¿Restablecer este intercambio a estado pendiente?")) return;
                            try {
                              await api.post(`/intercambios/${trueque.id}/restablecer`);
                              toast.success("Intercambio restablecido");
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
                        className="flex-1 text-white border-gray-600 hover:bg-gray-700 flex items-center justify-center gap-2"
                        onClick={() => handleEditTrueque(trueque)}
                      >
                        <Edit size={14} /> {t("edit_exchange")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-red-400 border-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center gap-2"
                        onClick={() => handleDeleteTrueque(trueque.id)}
                      >
                        <Trash2 size={14} /> {t("delete_exchange")}
                      </Button>
                    </div>
                  )}
                  {esParticipante(trueque) && trueque.estado === EstadoIntercambio.Confirmado && (
                    <div className="mt-4">
                      <Button
                        className="bg-blue-600 hover:bg-blue-700 w-full"
                        onClick={() => {
                          setTruequeParaFinalizar(trueque);
                          setShowResenaModal(true);
                        }}
                      >
                        Finalizar intercambio
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
                          className="bg-red-600 hover:bg-red-700 text-white w-full"
                          onClick={async () => {
                            try {
                              const res = await api.get("/intercambios/mis-propuestas");
                              const miPropuesta = res.data.find((p: any) => p.id_intercambio === trueque.id);
                              if (!miPropuesta) return;
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
                      ) : trueque.propuestas?.some(p => p.id_usuario_interesado === currentUser?.id) ? (
                        <Button
                          disabled
                          className="opacity-70 w-full bg-gray-700 text-gray-400 cursor-not-allowed"
                        >
                          Ya participaste en este intercambio
                        </Button>
                      ) : (
                        <Button
                          className="bg-blue-600 hover:bg-blue-700 w-full"
                          onClick={async () => {
                            if (!currentUser) return;
                            try {
                              await api.post(`/intercambios/${trueque.id}/propuesta`);
                              toast.success(`Propuesta enviada a ${trueque.usuario1?.nombre}`);
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
            <div className="text-center py-16 px-6 rounded-lg bg-[#1E1E1E] border-[#2E2E2E]">
              <p className="text-[#A0A0A0] mb-6">
                {t("no_exchanges_found")}
              </p>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => setIsCrearModalOpen(true)}
              >
                {t("create_exchange")}
              </Button>
            </div>
          )}
        </div>
      </div>

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

      {showPropuestasModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1E1E1E] rounded-xl p-6 w-full max-w-md mx-4 text-[#F5F5F5]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-[#F5F5F5]">Propuestas</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowPropuestasModal(false)}>
                <X className="w-5 h-5 text-[#A0A0A0]" />
              </Button>
            </div>
            {propuestas.length === 0 ? (
              <p className="text-[#A0A0A0]">No hay propuestas aún.</p>
            ) : (
              <div className="space-y-4">
                {propuestas.map((prop) => (
                  <div key={prop.id} className="bg-[#2E2E2E] p-4 rounded-lg border border-[#2E2E2E]">
                    <div className="flex justify-between items-center">
                      <span className="text-[#F5F5F5]">{prop.usuario_interesado.nombre}</span>
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
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-red-500 hover:bg-red-600 text-white"
                            onClick={async () => {
                              if (!window.confirm("¿Rechazar esta propuesta?")) return;
                              try {
                                await api.delete(`/intercambios/${selectedIntercambioId}/propuestas/${prop.id}`);
                                toast.success("Propuesta rechazada");
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
              className="mt-4 w-full bg-blue-600 hover:bg-blue-700"
              onClick={() => setShowPropuestasModal(false)}
            >
              Cerrar
            </Button>
          </div>
        </div>
      )}

      {showResenaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300">
          <div className="bg-[#2E2E2E] rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl transform transition-transform duration-300 ease-out">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Dejanos tu opinión sobre este trueque</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowResenaModal(false)
                  setTruequeParaFinalizar(null)
                  setCalificacion(0)
                  setComentario("")
                }}
                className="hover:bg-gray-700"
              >
                <X className="w-5 h-5 text-white" />
              </Button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                enviarResena(calificacion, comentario)
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Calificación</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setCalificacion(star)}
                      className={`text-2xl transition-colors ${
                        star <= calificacion ? 'text-yellow-400' : 'text-gray-400 hover:text-yellow-300'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Comentario</label>
                <textarea
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  placeholder="Cuéntanos brevemente tu experiencia..."
                  className="w-full px-3 py-2 bg-[#1E1E1E] text-white rounded-lg border border-[#404040] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 text-blue-400 hover:bg-blue-900 hover:text-blue-200 border-blue-500"
                  onClick={() => {
                    if (truequeParaFinalizar) {
                      setIntercambioAReportar(truequeParaFinalizar.id);
                      setShowResenaModal(false);
                      setShowReporteModal(true);
                    }
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

            <div className="mt-4 pt-4 border-t border-[#404040]">
              <Button
                type="button"
                className="w-full bg-gray-600 hover:bg-gray-700 text-white"
                onClick={async () => {
                  if (!truequeParaFinalizar) return;
                  try {
                    await api.post(`/intercambios/${truequeParaFinalizar.id}/finalizar`);
                    toast.success("Intercambio finalizado sin reseña");
                    setShowResenaModal(false);
                    setTruequeParaFinalizar(null);
                    setCalificacion(0);
                    setComentario("");
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

      {showReporteModal && intercambioAReportar && (
        <ReporteDialog
          isOpen={showReporteModal}
          onClose={() => {
            setShowReporteModal(false);
            setIntercambioAReportar(null);
          }}
          intercambioId={intercambioAReportar}
        />
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