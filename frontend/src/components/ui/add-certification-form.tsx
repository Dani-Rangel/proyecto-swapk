"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Upload, FileText } from "lucide-react"
import {
  expedienteService,
  TipoEstadoEnum,
  TipoExpedienteEnum,
} from "@/services/expediente"
import { getCurrentUser } from "@/lib/auth"

interface AddCertificationFormProps {
  onAddCertification: (certification: any) => void
}

export default function AddCertificationForm({
  onAddCertification,
}: AddCertificationFormProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    nombre: "",
    institucion: "",
    descripcion: "",
    tipo: "",
    estado: "",
  })
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])

  // Agregamos casteo para incluir 'role' en user
  const user = getCurrentUser() as (typeof getCurrentUser extends () => infer U ? U : never) & {
    role?: "user" | "moderator" 
  }

  const handleChange =
    (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({ ...formData, [field]: e.target.value })
    }

  const handleSelectChange = (field: keyof typeof formData) => (value: string) => {
    setFormData({ ...formData, [field]: value })
  }

  const handleFileUpload = (files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files).filter(
        (file) => file.size <= 50 * 1024 * 1024
      )
      setUploadedFiles((prev) => [...prev, ...newFiles])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    handleFileUpload(e.dataTransfer.files)
  }

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user?.id) {
      alert("No se pudo obtener el usuario autenticado.")
      return
    }

    try {
      const newExpediente = {
        usuario_id: user.id,
        nombre: formData.nombre,
        institucion: formData.institucion,
        descripcion: formData.descripcion,
        tipo: formData.tipo as TipoExpedienteEnum,
        estado: formData.estado as TipoEstadoEnum,
      }

      const creado = await expedienteService.crear(newExpediente)

      if (uploadedFiles.length > 0) {
        for (const file of uploadedFiles) {
          await expedienteService.subirArchivo(creado.id, file)
        }
      }

      onAddCertification(creado)

      setFormData({ nombre: "", institucion: "", descripcion: "", tipo: "", estado: "" })
      setUploadedFiles([])
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Error creando expediente o subiendo archivos:", error)
    }
  }

  // Opciones de estado para usuarios normales: solo EN_PROCESO
  // Para moderadores: todas las opciones
  const estadosDisponibles =
    user?.role === "moderator"
      ? Object.values(TipoEstadoEnum)
      : [TipoEstadoEnum.EN_PROCESO]

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#0000ff] border-none text-white hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Agregar certificación
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-9xl p-10 max-h-[100vh] overflow-y-auto bg-[#2E2E2E] border-[#2E2E2E] rounded-xl text-white">
        <DialogHeader>
          <DialogTitle>Subir Nuevo Certificado</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="nombre" className="text-foreground">
              Nombre del Certificado:
            </Label>
            <Input
              id="nombre"
              type="text"
              placeholder="Ejemplo: Certificado de React Developer"
              value={formData.nombre}
              onChange={handleChange("nombre")}
              className="mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="institucion" className="text-foreground">
              Institución:
            </Label>
            <Input
              id="institucion"
              type="text"
              placeholder="Ejemplo: Meta, AWS, Google"
              value={formData.institucion}
              onChange={handleChange("institucion")}
              className="mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="descripcion" className="text-foreground">
              Descripción:
            </Label>
            <Input
              id="descripcion"
              type="text"
              placeholder="Breve descripción del certificado"
              value={formData.descripcion}
              onChange={handleChange("descripcion")}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="tipo" className="text-foreground">
              Tipo de Documento:
            </Label>
            <Select value={formData.tipo} onValueChange={handleSelectChange("tipo")}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Selecciona un tipo" />
              </SelectTrigger>
              <SelectContent className="bg-[#2E2E2E] border-white text-white hover:bg-primary/90">
                {Object.values(TipoExpedienteEnum).map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>
                    {tipo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="estado" className="text-foreground">
              Estado:
            </Label>
            <Select value={formData.estado} onValueChange={handleSelectChange("estado")}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Selecciona un estado" />
              </SelectTrigger>
              <SelectContent className="bg-[#2E2E2E] border-white text-white hover:bg-primary/90">
                {estadosDisponibles.map((estado) => (
                  <SelectItem key={estado} value={estado}>
                    {estado}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="file" className="text-foreground">
              Archivos del Certificado:
            </Label>
            <div
              className={`mt-2 border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                isDragOver
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">
                Arrastra y suelta tus archivos aquí o haz clic para seleccionar
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Formatos permitidos: PDF, JPG, PNG, DOCX (máx. 50MB por archivo)
              </p>
            </div>

            <input
              id="file-input"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.docx,.doc"
              multiple
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
            />

            {uploadedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <Label className="text-sm font-medium">Archivos seleccionados:</Label>
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-muted rounded-md"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span className="text-sm">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="h-6 w-6 p-0"
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              className="bg-[#0000ff] border-none text-white hover:bg-primary/90"
              type="submit"
            >
              Subir Certificado
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}