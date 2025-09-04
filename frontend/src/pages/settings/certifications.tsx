"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Award, ExternalLink, Download, Eye } from "lucide-react"
import { TipoEstadoEnum } from "@/lib/types"
import AddCertificationForm from "@/components/ui/add-certification-form"
import SettingsLayout from "@/components/settings_layout"

export default function Dashboard() {
  const [certifications, setCertifications] = useState([
    {
      id: 1,
      name: "Certificación React Developer",
      issuer: "Meta",
      date: "2023-08-15",
      status: TipoEstadoEnum.VERIFICADO,
      credentialId: "META-REACT-2023-001",
      tipo: "CERTIFICADO",
    },
    {
      id: 2,
      name: "AWS Cloud Practitioner",
      issuer: "Amazon Web Services",
      date: "2023-06-20",
      status: TipoEstadoEnum.VERIFICADO,
      credentialId: "AWS-CP-2023-456",
      tipo: "CERTIFICADO",
    },
    {
      id: 3,
      name: "JavaScript Advanced",
      issuer: "FreeCodeCamp",
      date: "2023-03-10",
      status: TipoEstadoEnum.PENDIENTE,
      credentialId: "FCC-JS-2023-789",
      tipo: "CERTIFICADO",
    },
    {
      id: 4,
      name: "Proyecto Final Bootcamp",
      issuer: "Coding Academy",
      date: "2023-09-01",
      status: TipoEstadoEnum.EN_PROCESO,
      credentialId: "CA-PROJ-2023-012",
      tipo: "PROYECTOS",
    },
  ])

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
    setCertifications([...certifications, newCertification])
  }

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
          <Card className="bg-[#0F3E0F] border-none rounded-xl" >
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-500">
                {certifications.filter((c) => c.status === TipoEstadoEnum.VERIFICADO).length}
              </div>
              <div className="text-sm text-muted-foreground">Verificados</div>
            </CardContent>
          </Card>
          <Card className="bg-[#4d4712] border-none rounded-xl" >
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-500">
                {certifications.filter((c) => c.status === TipoEstadoEnum.PENDIENTE).length}
              </div>
              <div className="text-sm text-muted-foreground">Pendientes</div>
            </CardContent>
          </Card>
          <Card className="bg-[#0C255E] border-none rounded-xl" >
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-500">
                {certifications.filter((c) => c.status === TipoEstadoEnum.EN_PROCESO).length}
              </div>
              <div className="text-sm text-muted-foreground">En Proceso</div>
            </CardContent>
          </Card>
          <Card className="bg-[#4D0000] border-none rounded-xl" >
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-500">
                {certifications.filter((c) => c.status === TipoEstadoEnum.RECHAZADO).length}
              </div>
              <div className="text-sm text-muted-foreground">Rechazados</div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-[#1E1E1E] border-[#2E2E2E] rounded-xl " >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 ">
              <Award className="w-5 h-5" />
              Mis Certificaciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 ">
            {certifications.map((cert) => (
              <div key={cert.id} className="p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{cert.name}</h3>
                    <p className="text-muted-foreground mb-2">Emitido por {cert.issuer}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Fecha: {new Date(cert.date).toLocaleDateString("es-ES")}</span>
                      <span>ID: {cert.credentialId}</span>
                      <span>Tipo: {cert.tipo}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(cert.status)}>{cert.status}</Badge>
                    <Button variant="ghost" size="sm" title="Ver certificado">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" title="Descargar">
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" title="Enlace externo">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {certifications.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No tienes certificaciones agregadas</p>
                <p className="text-sm">Agrega tus certificaciones para validar tus habilidades</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SettingsLayout>
  )
}
