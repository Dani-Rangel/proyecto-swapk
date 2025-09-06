"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Eye, Download } from "lucide-react"
import { TipoEstadoEnum } from "@/services/expediente"
import SettingsLayout from "@/components/settings_layout"

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

  if (loading) {
    return (
      <SettingsLayout>
        <div>Cargando expedientes...</div>
      </SettingsLayout>
    )
  }

  return (
    <SettingsLayout>
      <div>
        <h1 className="text-3xl font-bold mb-4">Moderador - Gestión de Expedientes</h1>
        <table className="w-full border-collapse border border-gray-700 text-sm">
          <thead>
            <tr>
              <th className="border border-gray-600 p-2">ID</th>
              <th className="border border-gray-600 p-2">Nombre</th>
              <th className="border border-gray-600 p-2">Institución</th>
              <th className="border border-gray-600 p-2">Usuario</th>
              <th className="border border-gray-600 p-2">Estado</th>
              <th className="border border-gray-600 p-2">Archivo</th>
              <th className="border border-gray-600 p-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {expedientes.map((exp) => (
              <tr key={exp.id} className="hover:bg-gray-800">
                <td className="border border-gray-600 p-2 text-center">{exp.id}</td>
                <td className="border border-gray-600 p-2">{exp.nombre}</td>
                <td className="border border-gray-600 p-2">{exp.institucion}</td>
                <td className="border border-gray-600 p-2">{exp.usuario_nombre}</td>
                <td className="border border-gray-600 p-2 text-center">{exp.estado}</td>

               <td className="border border-gray-600 p-2 text-center">
                {exp.archivos && exp.archivos.length > 0 ? (
                    <div className="flex gap-2 justify-center">
                    <Button
                        variant="ghost"
                        size="icon"
                        title="Ver archivo"
                        onClick={() => {
                        const url = `http://localhost:8000/${exp.archivos![0].ruta}`
                        window.open(url, "_blank")
                        }}
                    >
                        <Eye className="w-4 h-4" />
                    </Button>
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
                    >
                        <Download className="w-4 h-4" />
                    </Button>
                    </div>
                ) : (
                    <span className="text-muted-foreground">Sin archivo</span>
                )}
                </td>

                <td className="border border-gray-600 p-2 text-center">
                  <select
                    value={exp.estado}
                    onChange={(e) => actualizarEstado(exp.id, e.target.value)}
                    disabled={actualizando === exp.id}
                    className="bg-gray-900 text-white p-1 rounded"
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
    </SettingsLayout>
  )
}
