import { useState } from "react"
import { X } from "lucide-react"

interface CreateSkillFormProps {
  onClose: () => void
  onSave: (skill: {
    name: string
    type: string
    level: string
    descripcion?: string
    categoria?: string
  }) => void
}

export function CreateSkillForm({ onClose, onSave }: CreateSkillFormProps) {
  const [name, setName] = useState("")
  const [type, setType] = useState("Oferta")
  const [level, setLevel] = useState("Principiante")
  const [descripcion, setDescripcion] = useState("")
  const [categoria, setCategoria] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ name, type, level, descripcion, categoria })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#1E1E1E] p-6 rounded-lg border border-[#2E2E2E] w-96 max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-white text-lg font-semibold">Crear Nueva Habilidad</h2>
          <button onClick={onClose}>
            <X className="text-white hover:text-red-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-gray-800 text-white p-2 rounded border border-gray-600"
            required
          />
          <textarea
            placeholder="Descripción"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="bg-gray-800 text-white p-2 rounded border border-gray-600 resize-none"
            rows={3}
          />
          <input
            type="text"
            placeholder="Categoría"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="bg-gray-800 text-white p-2 rounded border border-gray-600"
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="bg-gray-800 text-white p-2 rounded border border-gray-600"
          >
            <option value="Oferta">Oferta</option>
            <option value="Búsqueda">Búsqueda</option>
          </select>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="bg-gray-800 text-white p-2 rounded border border-gray-600"
          >
            <option value="Principiante">Principiante</option>
            <option value="Intermedio">Intermedio</option>
            <option value="Experto">Experto</option>
          </select>

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded shadow-lg"
          >
            Crear habilidad
          </button>
        </form>
      </div>
    </div>
  )
}
