"use client"

import { useState, useEffect } from "react"
import { Dialog } from "@headlessui/react"
import { Button } from "@/components/ui/button"
import { X, BookOpen, Users, Globe, MessageSquare, Calendar } from "lucide-react"
import Select, { MultiValue } from "react-select"
import {
  ModoIntercambio,
  NivelIntercambio,
  IdiomaIntercambio,
  Habilidad,
  obtenerTodasHabilidades,
} from "@/services/intercambio"

// -------------------------------
// Tipos
// -------------------------------
export interface TruequeFormData {
  modalidad: ModoIntercambio | ""
  nivel: NivelIntercambio | ""
  idioma: IdiomaIntercambio | ""
  descripcion: string
  disponibilidad: string
  habilidades_ofrecidas_ids: number[]
  habilidades_buscadas_ids: number[]
}

export interface HabilidadOption {
  value: number
  label: string
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onSave: (formData: TruequeFormData) => void
  habilidades?: Habilidad[]
  initialData?: TruequeFormData
  isEditing?: boolean
}

// -------------------------------
// Componente
// -------------------------------
export default function CrearTruequeModal({
  isOpen,
  onClose,
  onSave,
  habilidades,
  initialData,
  isEditing,
}: Props) {
  const [modalidad, setModalidad] = useState<ModoIntercambio | "">("")
  const [nivel, setNivel] = useState<NivelIntercambio | "">("")
  const [idioma, setIdioma] = useState<IdiomaIntercambio | "">("")
  const [descripcion, setDescripcion] = useState("")
  const [disponibilidad, setDisponibilidad] = useState("")

  const [ofreces, setOfreces] = useState<HabilidadOption[]>([])
  const [buscas, setBuscas] = useState<HabilidadOption[]>([])
  const [habilidadesOpciones, setHabilidadesOpciones] = useState<HabilidadOption[]>([])
  const [formInicializado, setFormInicializado] = useState(false)

  // ✅ Cargar habilidades
  useEffect(() => {
    const fetchHabilidades = async () => {
      const data: Habilidad[] = habilidades || (await obtenerTodasHabilidades())
      setHabilidadesOpciones(data.map((h) => ({ value: h.id, label: h.nombre })))
    }
    fetchHabilidades()
  }, [habilidades])

  // ✅ Aplicar initialData solo una vez cuando habilidades ya estén listas
  useEffect(() => {
    if (!initialData || habilidadesOpciones.length === 0 || formInicializado) return

    setModalidad(initialData.modalidad || "")
    setNivel(initialData.nivel || "")
    setIdioma(initialData.idioma || "")
    setDescripcion(initialData.descripcion || "")
    setDisponibilidad(initialData.disponibilidad || "")

    const ofreceMapped = (initialData.habilidades_ofrecidas_ids || [])
      .map((id) => habilidadesOpciones.find((h) => h.value === id))
      .filter((h): h is HabilidadOption => !!h)

    const buscaMapped = (initialData.habilidades_buscadas_ids || [])
      .map((id) => habilidadesOpciones.find((h) => h.value === id))
      .filter((h): h is HabilidadOption => !!h)

    setOfreces(ofreceMapped)
    setBuscas(buscaMapped)
    setFormInicializado(true)
  }, [initialData, habilidadesOpciones, formInicializado])

  // ✅ Resetear formulario al cerrar el modal
  useEffect(() => {
    if (!isOpen) {
      setModalidad("")
      setNivel("")
      setIdioma("")
      setDescripcion("")
      setDisponibilidad("")
      setOfreces([])
      setBuscas([])
      setFormInicializado(false)
    }
  }, [isOpen])

  // -------------------------------
  // Enviar formulario
  // -------------------------------
  const handleSubmit = async () => {
    if (!modalidad || !nivel || !idioma || !descripcion || !disponibilidad || [...ofreces, ...buscas].length === 0) {
      alert("Completa todos los campos y agrega al menos una habilidad.")
      return
    }

    const data: TruequeFormData = {
      modalidad,
      nivel,
      idioma,
      descripcion,
      disponibilidad,
      habilidades_ofrecidas_ids: ofreces.map((h) => h.value),
      habilidades_buscadas_ids: buscas.map((h) => h.value),
    }

    await onSave(data)
    onClose()
  }

  // -------------------------------
  // Render
  // -------------------------------
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md bg-gray-900 border border-gray-700 rounded-xl overflow-hidden shadow-xl">
          <div className="flex items-center justify-between p-5 border-b border-gray-700">
            <Dialog.Title className="text-xl font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-400" />
              {isEditing ? "Editar trueque" : "Crear nuevo trueque"}
            </Dialog.Title>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* Habilidades que ofreces */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Habilidades que ofreces</label>
              <Select
                key={`ofreces-${habilidadesOpciones.length}`}
                isMulti
                options={habilidadesOpciones}
                value={ofreces}
                onChange={(selected: MultiValue<HabilidadOption>) => setOfreces(selected as HabilidadOption[])}
                placeholder="Selecciona habilidades..."
                className="text-black"
              />
            </div>

            {/* Habilidades que buscas */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Habilidades que buscas</label>
              <Select
                key={`buscas-${habilidadesOpciones.length}`}
                isMulti
                options={habilidadesOpciones}
                value={buscas}
                onChange={(selected: MultiValue<HabilidadOption>) => setBuscas(selected as HabilidadOption[])}
                placeholder="Selecciona habilidades..."
                className="text-black"
              />
            </div>

            {/* Modalidad */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" />
                Modalidad
              </label>
              <select
                value={modalidad}
                onChange={(e) => setModalidad(e.target.value as ModoIntercambio)}
                className="w-full bg-gray-800 px-4 py-3 rounded-lg border border-gray-600 text-white"
              >
                <option value="">Seleccionar</option>
                {Object.values(ModoIntercambio).map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Nivel */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-yellow-400" />
                Nivel
              </label>
              <select
                value={nivel}
                onChange={(e) => setNivel(e.target.value as NivelIntercambio)}
                className="w-full bg-gray-800 px-4 py-3 rounded-lg border border-gray-600 text-white"
              >
                <option value="">Seleccionar</option>
                {Object.values(NivelIntercambio).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            {/* Idioma */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                Idioma
              </label>
              <select
                value={idioma}
                onChange={(e) => setIdioma(e.target.value as IdiomaIntercambio)}
                className="w-full bg-gray-800 px-4 py-3 rounded-lg border border-gray-600 text-white"
              >
                <option value="">Seleccionar idioma</option>
                {Object.values(IdiomaIntercambio).map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </div>

            {/* Disponibilidad */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-orange-400" />
                Disponibilidad
              </label>
              <input
                type="text"
                placeholder="Ej: Lunes a viernes 18:00-20:00"
                value={disponibilidad}
                onChange={(e) => setDisponibilidad(e.target.value)}
                className="w-full bg-gray-800 px-4 py-3 rounded-lg border border-gray-600 text-white placeholder-gray-500"
              />
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Descripción</label>
              <textarea
                placeholder="Describe los términos del intercambio"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="w-full h-28 bg-gray-800 px-4 py-3 rounded-lg border border-gray-600 text-white placeholder-gray-500 resize-none"
              />
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-between p-5 border-t border-gray-700 bg-gray-800/50">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-blue-600 hover:bg-blue-700 px-6"
              disabled={[
                !modalidad,
                !nivel,
                !idioma,
                !descripcion,
                !disponibilidad,
                [...ofreces, ...buscas].length === 0,
              ].some((cond) => cond)}
            >
              {isEditing ? "Actualizar trueque" : "Publicar trueque"}
            </Button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}
