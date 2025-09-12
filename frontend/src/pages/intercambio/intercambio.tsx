"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
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
  Settings,
  LogOut,
  Calendar,
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


import { getCurrentUser } from "@/lib/auth"

export default function SwapkPlatform() {
  const router = useRouter()
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

  // Validar usuario logueado
  useEffect(() => {
    const user = getCurrentUser()
    if (user) setCurrentUser(user)
    else router.push("/login")
  }, [router])

  // Cargar intercambios
  useEffect(() => {
    const fetchIntercambios = async () => {
      const data = await obtenerIntercambios()
      setTrueques(data)
    }
    fetchIntercambios()
  }, [])

  // Cargar habilidades
 useEffect(() => {
  const fetchData = async () => {
    try {
      const [truequesData, habilidadesData] = await Promise.all([
        obtenerIntercambios(),
        obtenerTodasHabilidades(),
      ]);

      setHabilidades(habilidadesData);   // Se usa para el formulario
      setTrueques(truequesData);         // Ya viene con nombres de habilidades
    } catch (error) {
      console.error("Error cargando trueques o habilidades:", error);
    }
  };

  fetchData();
}, []);



  const handleLogout = () => {
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    router.push("/login")
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
      alert("Debes iniciar sesión para crear un intercambio")
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
        id_perfil: currentUser.id, // Esto deberías ajustar si los perfiles son distintos
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
        if (saved) setTrueques((prev) => [...prev, saved])
      } catch (error) {
        console.error("❌ Error al crear intercambio:", error)
      }
    }

    setTruequeEditando(null)
    setIsCrearModalOpen(false)
  }

  const handleDeleteTrueque = async (id: number) => {
    if (!confirm("¿Seguro que quieres eliminar este intercambio?")) return
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

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <nav
        className={`fixed md:relative h-screen bg-[rgb(30,30,30)] border-[#2E2E2E] backdrop-blur-md border-r flex flex-col transition-all duration-300
        ${isSidebarOpen ? "w-60 fixed" : "w-14 fixed"}`}
      >
        {/* Botón abrir/cerrar */}
        <div className="flex justify-end p-2">
          <button
            className="text-white hover:text-blue-400"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Logo */}
        {isSidebarOpen && (
          <div className="flex items-center mb-8 px-4">
            <img src="/img/logoswapk.png" alt="Swapk Logo" className="w-7 h-auto" />
            <span className="text-white font-bold text-lg">Swapk</span>
          </div>
        )}

        {/* Menú lateral */}
        {isSidebarOpen && (
          <div className="flex gap-12 justify-center mb-12">
            <User className="w-6 h-6 hover:text-blue-400 cursor-pointer" />
            <Bell className="w-6 h-6 hover:text-blue-400 cursor-pointer" />
            <MessageSquare className="w-6 h-6 hover:text-blue-400 cursor-pointer" />
          </div>
        )}

        {/* Links */}
        <div className="flex flex-col gap-4 mb-8 px-5">
          <button className="flex items-center gap-3 hover:text-blue-400">
            <HomeIcon className="w-5 h-5" />
            {isSidebarOpen && "INICIO"}
          </button>
          <button className="flex items-center gap-3 hover:text-blue-400">
            <Search className="w-5 h-5" />
            {isSidebarOpen && "EXPLORAR"}
          </button>
          <button className="flex items-center gap-3 hover:text-blue-400">
            <Star className="w-5 h-5" />
            {isSidebarOpen && "MIS TRUEQUES"}
          </button>
          <button className="flex items-center gap-3 hover:text-blue-400">
            <Camera className="w-5 h-5" />
            {isSidebarOpen && "MIS CURSOS"}
          </button>
          <button className="flex items-center gap-3 hover:text-blue-400">
            <Plus className="w-5 h-5" />
            {isSidebarOpen && "COMUNIDAD"}
          </button>
          <button className="flex items-center gap-3 hover:text-blue-400">
            <Settings className="w-5 h-5" />
            {isSidebarOpen && "AJUSTES"}
          </button>
        </div>

        {/* Logout */}
        <div className="mt-auto px-2 mb-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-500 hover:text-red-400"
          >
            <LogOut className="w-5 h-5" />
            {isSidebarOpen && <span>Cerrar sesión</span>}
          </button>
        </div>
      </nav>

      {/* Main */}
      <div className="flex-1 transition-all duration-300 ml-2">
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Encabezado */}
          <div className="flex items-center justify-between mb-8 bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h2 className="text-2xl font-bold">Intercambios</h2>
            <Button
              onClick={() => setIsCrearModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Crear trueque
            </Button>
          </div>

          {/* Filtros */}
          <div className="mb-6 bg-gray-800 p-4 rounded-lg border border-gray-700">
            <form
              onSubmit={handleSearch}
              className="flex flex-col md:flex-row md:items-center md:gap-4"
            >
              {/* Buscador */}
              <div className="flex items-center bg-gray-700 px-3 py-2 rounded-lg flex-1">
                <Search className="w-5 h-5 text-gray-400 mr-2" />
                <input
                  type="text"
                  placeholder="Buscar por descripción, nivel o modalidad..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent outline-none w-full text-white placeholder-gray-400"
                />
              </div>

              {/* Filtros */}
              <select
                value={modalidad}
                onChange={(e) => setModalidad(e.target.value)}
                className="mt-2 md:mt-0 bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600"
              >
                <option value="">Todas las modalidades</option>
                {Object.values(ModoIntercambio).map((modo) => (
                  <option key={modo} value={modo}>
                    {modo}
                  </option>
                ))}
              </select>

              <select
                value={nivel}
                onChange={(e) => setNivel(e.target.value)}
                className="mt-2 md:mt-0 bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600"
              >
                <option value="">Todos los niveles</option>
                {Object.values(NivelIntercambio).map((niv) => (
                  <option key={niv} value={niv}>
                    {niv}
                  </option>
                ))}
              </select>

              <select
                value={idioma}
                onChange={(e) => setIdioma(e.target.value)}
                className="mt-2 md:mt-0 bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600"
              >
                <option value="">Todos los idiomas</option>
                {Object.values(IdiomaIntercambio).map((idi) => (
                  <option key={idi} value={idi}>
                    {idi}
                  </option>
                ))}
              </select>

              <Button
                type="submit"
                className="mt-2 md:mt-0 bg-blue-600 hover:bg-blue-700"
              >
                Buscar
              </Button>
            </form>
          </div>

          {/* Listado de trueques */}
          {filteredTrueques.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {filteredTrueques.map((trueque) => (
                <div
                  key={trueque.id}
                  className="bg-[#1E1E1E] border border-[#2E2E2E] rounded-xl p-6 flex flex-col"
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
                        <h3 className="text-xl font-semibold">
                          {trueque.usuario1?.nombre}
                        </h3>
                        {renderEstadoCircle(trueque.estado)}
                      </div>
                      <div className="flex">{renderStars(trueque.valoracion || 0)}</div>
                      <p className="text-gray-400">{trueque.nivel}</p>

                      <div className="mt-2">
                        <p className="text-xs text-blue-400">Ofrece:</p>
                        <div className="flex flex-wrap gap-1">
                          {trueque.habilidades_ofrece?.map((h, idx) => {
                                console.log("🧠 habilidad ofrecida:", h)
                                return (
                                  <span
                                    key={idx}
                                    className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                  >
                                    {String(h.nombre)}
                                  </span>
                                )
                              })}
                        </div>
                        <p className="text-xs text-red-400 mt-2">Busca:</p>
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

                  <p className="text-gray-300 break-words whitespace-pre-wrap">
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
                        <Edit size={16} /> Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 flex items-center justify-center gap-2 text-red-500 border-red-500 hover:bg-red-500 hover:text-white"
                        onClick={() => handleDeleteTrueque(trueque.id)}
                      >
                        <Trash2 size={16} /> Eliminar
                      </Button>
                    </div>
                  )}
                  {currentUser?.id !== trueque.id_usuario1 && (
                      <div className="mt-4">
                        <Button
                          className="w-full bg-blue-600 hover:bg-blue-700"
                          onClick={() => {
                            // Aquí puedes abrir un modal, redirigir a otra página, o iniciar una conversación
                            alert(`Propuesta enviada a ${trueque.usuario1?.nombre}`)
                          }}
                        >
                          Proponer trueque
                        </Button>
                      </div>
                    )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center mt-6">
              No se encontraron trueques que coincidan.
            </p>
          )}
        </div>
      </div>

     {/* Modal Crear/Editar Trueque */}
      {isCrearModalOpen && (
        <CrearTruequeModal
          isOpen={isCrearModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveTrueque} // cambiar onSave -> onCreateTrueque
          habilidades={habilidades}
          initialData={truequeEditando ? mapIntercambioToFormData(truequeEditando) : undefined}
          isEditing={!!truequeEditando}
        />
      )}
    </div>
  )
}

