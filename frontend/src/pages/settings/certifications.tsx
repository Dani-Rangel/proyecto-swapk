"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Award, ExternalLink, Download, Eye } from "lucide-react"
import { TipoEstadoEnum, expedienteService, TipoExpedienteEnum } from "@/services/expediente"
import AddCertificationForm from "@/components/ui/add-certification-form"
import SettingsLayout from "@/components/settings_layout"
import { getCurrentUser } from "@/lib/auth"

export default function Dashboard() {
  const [certifications, setCertifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    async function fetchCertifications() {
      const user = getCurrentUser()
      if (!user) {
        setCertifications([])
        setLoading(false)
        return
      }
      try {
        const expedientes = await expedienteService.listarPorUsuario(user.id)
        const certificados = expedientes.filter(
          (exp) => exp.tipo === TipoExpedienteEnum.CERTIFICADO
        )

        const mappedCertificados = certificados.map((cert) => ({
          id: cert.id,
          name: cert.nombre,
          issuer: cert.institucion,
          date: cert.fecha_inicio || new Date().toISOString(),
          status: cert.estado,
          credentialId: "",
          tipo: cert.tipo,
          archivos: cert.archivos || [], // ✅ añadimos archivos
        }))

        setCertifications(mappedCertificados)
      } catch (error) {
        console.error("Error cargando certificaciones:", error)
        setCertifications([])
      } finally {
        setLoading(false)
      }
    }

    fetchCertifications()
  }, [])

  const getStatusColor = (status: TipoEstadoEnum) => {
    switch (status) {
      case TipoEstadoEnum.VERIFICADO:
        return "bg-green-600 hover:bg-green-700"
      case TipoEstadoEnum.PENDIENTE:
        return "bg-yellow-600 hover:bg-yellow-700"
      case TipoEstadoEnum.EN_PROCESO:
        return "bg-blue-600 hover:bg-blue-700"
      case TipoEstadoEnum.RECHAZADO:
        return "bg-red-600 hover:bg-red-700"
      default:
        return "bg-gray-600 hover:bg-gray-700"
    }
  }

  const handleAddCertification = (newCertification: any) => {
    const cert = {
      id: newCertification.id,
      name: newCertification.nombre || "Nombre no especificado",
      issuer: newCertification.institucion || "Institución no especificada",
      date: newCertification.fecha_inicio || new Date().toISOString(),
      status: newCertification.estado || TipoEstadoEnum.PENDIENTE,
      credentialId: newCertification.credentialId || "",
      tipo: newCertification.tipo || "",
      archivos: newCertification.archivos || [], // ✅ también aquí
    }

    setCertifications((prev) => [...prev, cert])
  }

  if (loading)
    return (
      <SettingsLayout>
        <div>Cargando certificaciones...</div>
      </SettingsLayout>
    )

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Certificaciones y Validaciones</h1>
            <p className="text-muted-foreground">
              Administra tus certificaciones y valida tus habilidades profesionales
            </p>
          </div>
          <AddCertificationForm onAddCertification={handleAddCertification} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-[#0F3E0F] border-none rounded-xl">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-500">
                {certifications.filter((c) => c.status === TipoEstadoEnum.VERIFICADO).length}
              </div>
              <div className="text-sm text-muted-foreground">Verificados</div>
            </CardContent>
          </Card>
          <Card className="bg-[#4d4712] border-none rounded-xl">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-500">
                {certifications.filter((c) => c.status === TipoEstadoEnum.PENDIENTE).length}
              </div>
              <div className="text-sm text-muted-foreground">Pendientes</div>
            </CardContent>
          </Card>
          <Card className="bg-[#0C255E] border-none rounded-xl">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-500">
                {certifications.filter((c) => c.status === TipoEstadoEnum.EN_PROCESO).length}
              </div>
              <div className="text-sm text-muted-foreground">En Proceso</div>
            </CardContent>
          </Card>
          <Card className="bg-[#4D0000] border-none rounded-xl">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-500">
                {certifications.filter((c) => c.status === TipoEstadoEnum.RECHAZADO).length}
              </div>
              <div className="text-sm text-muted-foreground">Rechazados</div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-[#1E1E1E] border-[#2E2E2E] rounded-xl ">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 ">
              <Award className="w-5 h-5" />
              Mis Certificaciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 ">
            {certifications.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No tienes certificaciones agregadas</p>
                <p className="text-sm">Agrega tus certificaciones para validar tus habilidades</p>
              </div>
            )}

            {certifications.map((cert) => (
              <div
                key={cert.id}
                className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{cert.name}</h3>
                    <p className="text-muted-foreground mb-2">Emitido por {cert.issuer}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Fecha: {new Date(cert.date).toLocaleDateString("es-ES")}</span>
                      <span>ID: {cert.credentialId || "N/A"}</span>
                      <span>Tipo: {cert.tipo}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(cert.status)}>{cert.status}</Badge>

                    {cert.archivos && cert.archivos.length > 0 && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Ver certificado"
                          onClick={() => {
                            const url = `http://localhost:8000/uploads/${cert.archivos[0].ruta}`;
                            window.open(url, "_blank")
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                        variant="ghost"
                        size="sm"
                        title="Descargar"
                        onClick={() => {
                          const url = `http://localhost:8000/${cert.archivos[0].ruta}`
                          const link = document.createElement("a")
                          link.href = url
                          link.download = cert.archivos[0].nombre || "certificado"
                          document.body.appendChild(link)
                          link.click()
                          document.body.removeChild(link)
                        }}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      </>
                    )}

                    <Button variant="ghost" size="sm" title="Enlace externo">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </SettingsLayout>
  )
}
