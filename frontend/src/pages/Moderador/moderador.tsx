"use client"

import { useEffect, useState, useRef } from "react"
import { 
  Eye, Download, FileText, ClipboardList, LogOut, 
  X, User, Building2 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { TipoEstadoEnum } from "@/services/expediente"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth" // 👈 importamos auth

type Archivo = {
  id: number
  nombre: string
  ruta: string
  fecha_subida: string
}

type Expediente = {
  id: number
  nombre: string
  institucion: string
  estado: string
  tipo: string
  usuario_nombre: string
  fecha_inicio: string
  archivos?: Archivo[]
}

export default function ModeradorDashboard() {
  const [expedientes, setExpedientes] = useState<Expediente[]>([])
  const [loading, setLoading] = useState(true)
  const [actualizando, setActualizando] = useState<number | null>(null)
  const [selectedExpedienteId, setSelectedExpedienteId] = useState<number | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const router = useRouter()
  const user = getCurrentUser() // 👈 obtenemos usuario logueado

  useEffect(() => {
    async function fetchExpedientes() {
      try {
        const res = await fetch("http://localhost:8000/moderador/expedientes")
        if (!res.ok) throw new Error("No se pudieron cargar expedientes")
        const data = await res.json()
        setExpedientes(data)
      } catch (error) {
        console.error("Error:", error)
        alert("Error al cargar expedientes. Revisa la consola.")
      } finally {
        setLoading(false)
      }
    }
    fetchExpedientes()
  }, [])

  const selectedExpediente = expedientes.find(exp => exp.id === selectedExpedienteId) || null

  const actualizarEstado = async (id: number, nuevoEstado: string) => {
    setActualizando(id)
    try {
      const res = await fetch(`http://localhost:8000/moderador/expediente/${id}/estado`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      })

      if (res.ok) {
        setExpedientes(prev =>
          prev.map(exp => (exp.id === id ? { ...exp, estado: nuevoEstado } : exp))
        )
      } else {
        throw new Error("Error en la API")
      }
    } catch (error) {
      console.error("Error actualizando estado:", error)
      alert("No se pudo actualizar el estado.")
    } finally {
      setActualizando(null)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("user")
    document.cookie = "token=; path=/; max-age=0"
    router.push("/auth/login")
  }

  const handleVolver = () => {
    if (!user) {
      router.push("/dashboard/index_dashboard")
      return
    }
    switch (user.rol) {
      case "MODERADOR":
        router.push("/moderador")
        break
      case "ADMIN":
        router.push("/admin")
        break
      default:
        router.push(user.perfilId ? `/perfil/${user.perfilId}` : "/")
        break
    }
  }

  const openExpedienteDetail = (id: number) => {
    setSelectedExpedienteId(id)
  }

  const closeExpedienteDetail = () => {
    setSelectedExpedienteId(null)
  }

  const getPreviewComponent = () => {
    if (!selectedExpediente || !selectedExpediente.archivos?.[0]) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500">
          <p className="text-center px-4">Sin archivo adjunto.</p>
        </div>
      )
    }

    const archivo = selectedExpediente.archivos[0]
    const filename = archivo.ruta.split('/').pop() || archivo.nombre
    const url = `http://localhost:8000/uploads/${filename}`
    const ext = archivo.nombre.split('.').pop()?.toLowerCase()

    const pdfUrl = ext === 'pdf' ? `${url}#toolbar=0&navpanes=0&scrollbar=1&zoom=80` : url

    if (ext === 'pdf') {
      return (
        <div className="w-full h-full bg-white rounded-lg shadow-xl overflow-hidden border border-gray-300">
          <iframe
            ref={iframeRef}
            src={pdfUrl}
            className="w-full h-full border-0"
            title="Vista previa del certificado"
            onError={() => {
              iframeRef.current!.src = ""
            }}
          />
        </div>
      )
    } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext!)) {
      return (
        <div className="w-full h-full bg-gray-50 rounded-lg shadow-xl overflow-hidden border border-gray-200 flex items-center justify-center p-2">
          <img
            src={url}
            alt="Certificado"
            className="max-w-full max-h-full object-contain rounded"
          />
        </div>
      )
    } else {
      return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-gray-900/20 rounded-lg">
          <FileText className="h-12 w-12 text-gray-500 mb-3" />
          <p className="text-gray-400 mb-4">
            Archivo no visualizable: <strong>{archivo.nombre}</strong>
          </p>
          <Button
            onClick={() => {
              const link = document.createElement("a")
              link.href = url
              link.download = archivo.nombre
              link.click()
            }}
            variant="default"
            className="bg-green-600 hover:bg-green-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Descargar
          </Button>
        </div>
      )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#141414] text-white">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mb-4"></div>
          <p className="text-lg">Cargando expedientes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen flex flex-col md:flex-row bg-[#141414] text-white">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-[#1e1e1e] border-r border-gray-800 flex flex-col p-4 shrink-0">
        <div className="flex items-center gap-3 mb-6">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
          </div>
          <div>
            <p className="font-semibold text-sm truncate">
              {user?.nombre || "Moderador"}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {user?.rol || "Rol no definido"}
            </p>
          </div>
        </div>

        <nav className="space-y-1 mb-4">
          <button
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg bg-green-600 text-white font-medium"
            disabled
          >
            <ClipboardList className="h-5 w-5" />
            Expedientes
          </button>
        </nav>

        {/* Botón Volver */}
        <button
          onClick={handleVolver}
          className="mt-auto flex items-center gap-2 w-full px-3 py-2.5 text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Volver
        </button>

        <div className="pt-2 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2.5 text-red-400 hover:bg-red-900/50 hover:text-white rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 p-4 md:p-6 overflow-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Expedientes pendientes</h1>
          <p className="text-gray-400 text-sm mt-1">
            Revisa y actualiza el estado de los certificados recibidos.
          </p>
        </div>

        {expedientes.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-60" />
            <p>No hay expedientes pendientes.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {expedientes.map((exp) => {
              const tieneArchivo = exp.archivos && exp.archivos.length > 0
              const archivo = exp.archivos?.[0]

              return (
                <div
                  key={exp.id}
                  className="bg-[#1a1a1a] border border-gray-700 rounded-xl overflow-hidden hover:border-green-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-green-900/20"
                >
                  <div className="p-4 border-b border-gray-800 bg-[#222222]">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-white truncate">{exp.nombre}</h3>
                        <div className="flex items-center text-xs text-gray-400 mt-1">
                          <Building2 className="w-3 h-3 mr-1" />
                          <span className="truncate">{exp.institucion}</span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        exp.estado === TipoEstadoEnum.VERIFICADO ? "bg-green-900/50 text-green-300" :
                        exp.estado === TipoEstadoEnum.RECHAZADO ? "bg-red-900/50 text-red-300" :
                        "bg-yellow-900/50 text-yellow-300"
                      }`}>
                        {exp.estado}
                      </span>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="text-sm text-gray-400 mb-2">
                      <span className="font-medium text-white">Usuario:</span> {exp.usuario_nombre}
                    </div>
                    <div className="text-xs text-gray-500 mb-3">
                      Fecha: {new Date(exp.fecha_inicio).toLocaleDateString('es-ES')}
                    </div>

                    <div 
                      className={`w-full h-32 rounded-lg border border-dashed flex items-center justify-center mb-4 cursor-pointer transition-colors ${
                        tieneArchivo 
                          ? "border-green-500/30 bg-green-900/10 hover:bg-green-900/20" 
                          : "border-gray-600 bg-gray-900/30"
                      }`}
                      onClick={() => tieneArchivo && openExpedienteDetail(exp.id)}
                    >
                      {tieneArchivo ? (
                        <div className="text-center">
                          <FileText className="h-8 w-8 mx-auto text-green-400 mb-1" />
                          <span className="text-xs text-green-300 font-medium">
                            {archivo?.nombre.split('.').slice(0, -1).join('.') || "Certificado"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-500 text-xs">Sin archivo</span>
                      )}
                    </div>

                    <div className="flex justify-between items-center">
                      <select
                        value={exp.estado}
                        onChange={(e) => actualizarEstado(exp.id, e.target.value)}
                        disabled={actualizando === exp.id}
                        className="bg-gray-800 text-white text-xs px-2 py-1 rounded border border-gray-700"
                      >
                        {Object.values(TipoEstadoEnum).map((estado) => (
                          <option key={estado} value={estado}>
                            {estado}
                          </option>
                        ))}
                      </select>

                      {tieneArchivo && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openExpedienteDetail(exp.id)}
                          className="border-green-600 text-green-400 hover:bg-green-900/30"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Ver
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Modal ampliado de detalle */}
      {selectedExpediente && (
        <div className="fixed inset-0 z-50 flex">
          <div 
            className="flex-1 bg-black/50 backdrop-blur-sm"
            onClick={closeExpedienteDetail}
          />
          <div 
            className="w-full max-w-6xl bg-[#1a1a1a] border-l border-gray-800 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-800 bg-[#222222] flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">
                  Expediente: <span className="text-green-400">{selectedExpediente.nombre}</span>
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  ID: #{selectedExpediente.id} • {selectedExpediente.tipo}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={closeExpedienteDetail}
                className="text-gray-400 hover:bg-gray-800"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Contenido ampliado: 70% documento / 30% info */}
            <div className="flex-1 overflow-hidden flex">
              {/* Vista previa GRANDE (70%) */}
              <div className="w-0 flex-1 bg-[#141414] flex flex-col min-w-0">
                <div className="px-6 py-3 border-b border-gray-800 bg-[#1e1e1e] text-sm font-medium flex justify-between items-center">
                  <span>Documento adjunto</span>
                  {selectedExpediente.archivos?.[0] && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const archivo = selectedExpediente.archivos![0]
                        const filename = archivo.ruta.split('/').pop() || archivo.nombre
                        const url = `http://localhost:8000/uploads/${filename}`
                        const link = document.createElement("a")
                        link.href = url
                        link.download = archivo.nombre
                        link.click()
                      }}
                      className="text-blue-400 hover:bg-blue-900/30 h-7"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Descargar
                    </Button>
                  )}
                </div>
                <div className="flex-1 overflow-auto p-6 bg-gray-900/20">
                  {getPreviewComponent()}
                </div>
              </div>

              {/* Datos y acciones (30%) */}
              <div className="w-96 bg-[#171717] border-l border-gray-800 flex flex-col shrink-0">
                <div className="px-4 py-3 border-b border-gray-800 bg-[#1e1e1e] text-sm font-medium">
                  Información
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <div className="bg-[#222222] p-3 rounded-lg">
                    <h3 className="text-xs text-gray-500 uppercase tracking-wide mb-1">Usuario</h3>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-medium">{selectedExpediente.usuario_nombre}</span>
                    </div>
                  </div>

                  <div className="bg-[#222222] p-3 rounded-lg">
                    <h3 className="text-xs text-gray-500 uppercase tracking-wide mb-1">Institución</h3>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span>{selectedExpediente.institucion}</span>
                    </div>
                  </div>

                  <div className="bg-[#222222] p-3 rounded-lg">
                    <h3 className="text-xs text-gray-500 uppercase tracking-wide mb-1">Fecha de envío</h3>
                    <span>{new Date(selectedExpediente.fecha_inicio).toLocaleString('es-ES')}</span>
                  </div>

                  <div className="bg-[#222222] p-3 rounded-lg">
                    <h3 className="text-xs text-gray-500 uppercase tracking-wide mb-2">Estado actual</h3>
                    <select
                      value={selectedExpediente.estado}
                      onChange={(e) => actualizarEstado(selectedExpediente.id, e.target.value)}
                      disabled={actualizando === selectedExpediente.id}
                      className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:ring-2 focus:ring-green-500"
                    >
                      {Object.values(TipoEstadoEnum).map((estado) => (
                        <option key={estado} value={estado}>
                          {estado}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    <Button
                      variant="outline"
                      onClick={closeExpedienteDetail}
                      className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
                    >
                      Cerrar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}