"use client"

import { useEffect, useState } from "react"
import { Eye, Download, FileText, ClipboardList, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TipoEstadoEnum } from "@/services/expediente"
import { useRouter } from "next/router"

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
  const [activeTab, setActiveTab] = useState("expedientes") // pestaña activa en la sidebar
  const router = useRouter()

  useEffect(() => {
    async function fetchExpedientes() {
      try {
        const res = await fetch("http://localhost:8000/moderador/expedientes")
        const data = await res.json()
        setExpedientes(data)
      } catch (error) {
        console.error("Error cargando expedientes:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchExpedientes()
  }, [])

  const actualizarEstado = async (id: number, nuevoEstado: string) => {
    setActualizando(id)
    try {
      const res = await fetch(`http://localhost:8000/moderador/expediente/${id}/estado`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      })

      if (res.ok) {
        setExpedientes((prev) =>
          prev.map((exp) =>
            exp.id === id ? { ...exp, estado: nuevoEstado } : exp
          )
        )
      } else {
        console.error("Error actualizando estado")
      }
    } catch (error) {
      console.error("Error actualizando estado:", error)
    } finally {
      setActualizando(null)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/auth/login")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#141414] text-white">
        <p className="text-lg animate-pulse">Cargando expedientes...</p>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen flex bg-[#141414] text-white">
      {/* ====================== */}
      {/* Sidebar */}
      {/* ====================== */}
      <aside className="w-64 bg-[#1e1e1e] border-r border-gray-800 flex flex-col p-4">
        <div className="flex items-center gap-2 mb-8">
          <FileText className="h-6 w-6 text-green-400" />
          <span className="text-lg font-bold">Moderador</span>
        </div>

        <nav className="space-y-2">
          <button
            onClick={() => setActiveTab("expedientes")}
            className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg transition-colors ${
              activeTab === "expedientes" ? "bg-green-600 text-white" : "hover:bg-gray-700"
            }`}
          >
            <ClipboardList className="h-5 w-5" />
            Expedientes
          </button>
        </nav>

        <div className="mt-auto pt-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-red-400 hover:bg-red-900 hover:text-white rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ====================== */}
      {/* Contenido principal */}
      {/* ====================== */}
      <main className="flex-1 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Gestión de Expedientes</h1>
          <p className="text-gray-400 text-sm mt-2 md:mt-0">
            Revisa y actualiza el estado de los expedientes asignados.
          </p>
        </div>

        {/* Contenedor scrollable para tablas en móvil */}
        <div className="overflow-x-auto rounded-lg border border-gray-700">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-[#2a2a2a]">
              <tr>
                <th className="border border-gray-700 p-2">ID</th>
                <th className="border border-gray-700 p-2">Nombre</th>
                <th className="border border-gray-700 p-2">Institución</th>
                <th className="border border-gray-700 p-2">Usuario</th>
                <th className="border border-gray-700 p-2">Estado</th>
                <th className="border border-gray-700 p-2">Archivo</th>
                <th className="border border-gray-700 p-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {expedientes.map((exp) => (
                <tr key={exp.id} className="hover:bg-gray-800 transition-colors">
                  <td className="border border-gray-700 p-2 text-center">{exp.id}</td>
                  <td className="border border-gray-700 p-2">{exp.nombre}</td>
                  <td className="border border-gray-700 p-2">{exp.institucion}</td>
                  <td className="border border-gray-700 p-2">{exp.usuario_nombre}</td>
                  <td className="border border-gray-700 p-2 text-center">{exp.estado}</td>

                  <td className="border border-gray-700 p-2 text-center">
                    {exp.archivos && exp.archivos.length > 0 ? (
                      <div className="flex gap-2 justify-center">
                        {/* Ver archivo */}
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Ver archivo"
                          onClick={() => {
                            const url = `http://localhost:8000/${exp.archivos![0].ruta}`
                            window.open(url, "_blank")
                          }}
                          className="hover:bg-green-700"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>

                        {/* Descargar archivo */}
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Descargar archivo"
                          onClick={() => {
                            const url = `http://localhost:8000/${exp.archivos![0].ruta}`
                            const link = document.createElement("a")
                            link.href = url
                            link.download = exp.archivos![0].nombre
                            document.body.appendChild(link)
                            link.click()
                            document.body.removeChild(link)
                          }}
                          className="hover:bg-blue-700"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-gray-500">Sin archivo</span>
                    )}
                  </td>

                  <td className="border border-gray-700 p-2 text-center">
                    <select
                      value={exp.estado}
                      onChange={(e) => actualizarEstado(exp.id, e.target.value)}
                      disabled={actualizando === exp.id}
                      className="bg-gray-900 text-white p-1 rounded text-sm"
                    >
                      {Object.values(TipoEstadoEnum).map((estado) => (
                        <option key={estado} value={estado}>
                          {estado}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
