// CreateSkillForm.tsx con integración completa
"use client"
import { useState } from "react"
import { X } from "lucide-react"
import { SkillAssociation, skillsAPI } from "@/services/api_Skills"

interface CreateSkillFormProps {
  onClose: () => void
  onSave: (skill: SkillAssociation) => void
  userPerfilId: number   // <- Añadimos esta prop para el id del perfil
}

export default function CreateSkillForm({ onClose, onSave, userPerfilId }: CreateSkillFormProps) {
  const [nombre, setNombre] = useState("")
  const [tipo, setTipo] = useState<"Ofrece" | "Busca">("Ofrece")
  const [nivel, setNivel] = useState<"Principiante" | "Intermedio" | "Experto">("Principiante")
  const [descripcion, setDescripcion] = useState("")
  const [categoria, setCategoria] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!nombre.trim()) {
      setError("El nombre de la habilidad es requerido")
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Crear habilidad en la tabla habilidad
      const newSkill = await skillsAPI.createSkill({
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        categoria: categoria.trim() || undefined,
      })

      // Asociar la habilidad creada al perfil (importante enviar userPerfilId)
      const association: SkillAssociation = {
        Perfil_id: userPerfilId,   // <---- Aquí pasamos el id del perfil
        habilidad_id: newSkill.id,
        tipo: tipo,
        nivel: nivel
      }

      // Guardar asociación en la tabla perfil_habilidad
      const associatedSkill = await skillsAPI.associateSkill(association)
      
      // Notificar al componente padre con la asociación completa
      onSave(associatedSkill)
      onClose()
    } catch (err) {
      console.error("Error al crear habilidad:", err)
      setError("Error al crear la habilidad. Intenta nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#1E1E1E] p-6 rounded-lg border border-[#2E2E2E] w-96 max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-white text-lg font-semibold">Crear Nueva Habilidad</h2>
          <button 
            onClick={onClose}
            className="text-white hover:text-red-400 transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded text-red-200 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-white text-sm mb-2 block">Nombre de la habilidad *</label>
            <input
              type="text"
              placeholder="Ej: React Native, Photoshop, Cocina Italiana"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="p-2 rounded bg-[#2E2E2E] text-white w-full border border-gray-600 focus:outline-none focus:border-blue-400"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="text-white text-sm mb-2 block">Descripción (opcional)</label>
            <textarea
              placeholder="Describe brevemente esta habilidad..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="p-2 rounded bg-[#2E2E2E] text-white w-full border border-gray-600 focus:outline-none focus:border-blue-400 resize-none"
              rows={3}
              disabled={loading}
            />
          </div>

          <div>
            <label className="text-white text-sm mb-2 block">
              Categoría (opcional)
            </label>
            <input
              type="text"
              placeholder="Ej: Programación, Diseño, Cocina, Música"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="p-2 rounded bg-[#2E2E2E] text-white w-full border border-gray-600 focus:outline-none focus:border-blue-400"
              disabled={loading}
            />
            <p className="text-gray-400 text-xs mt-1">
              Ej: Programación, Diseño, Arte, Deportes, etc.
            </p>
          </div>

          <div>
            <label className="text-white text-sm mb-2 block">Tipo</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as "Ofrece" | "Busca")}
              className="p-2 rounded bg-[#2E2E2E] text-white w-full border border-gray-600 focus:outline-none focus:border-blue-400"
              disabled={loading}
            >
              <option value="Ofrece">Ofrece</option>
              <option value="Busca">Busca</option>
            </select>
            <p className="text-gray-400 text-xs mt-1">
              {tipo === "Ofrece" 
                ? "Habilidad que puedes enseñar a otros" 
                : "Habilidad que quieres aprender"}
            </p>
          </div>

          <div>
            <label className="text-white text-sm mb-2 block">Nivel</label>
            <select
              value={nivel}
              onChange={(e) => setNivel(e.target.value as "Principiante" | "Intermedio" | "Experto")}
              className="p-2 rounded bg-[#2E2E2E] text-white w-full border border-gray-600 focus:outline-none focus:border-blue-400"
              disabled={loading}
            >
              <option value="Principiante">Principiante</option>
              <option value="Intermedio">Intermedio</option>
              <option value="Experto">Experto</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading || !nombre.trim()}
              className="bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded flex-1 transition-colors flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creando...
                </>
              ) : (
                "Crear Habilidad"
              )}
            </button>
            
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 text-white px-4 py-2 rounded flex-1 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>

        <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
          <h4 className="text-white text-sm font-medium mb-2">¿Cómo funciona?</h4>
          <ul className="text-gray-400 text-xs space-y-1">
            <li>• La habilidad se creará y asociará automáticamente a tu perfil</li>
            <li>• Otros usuarios podrán ver tus habilidades en sus búsquedas</li>
            <li>• Puedes editar o eliminar habilidades desde tu perfil</li>
          </ul>
        </div>
      </div>
    </div>
  )
}