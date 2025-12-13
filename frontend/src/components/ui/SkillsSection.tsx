"use client"
import { useState, useEffect } from "react"
import { AddSkillForm } from "./AddSkillForm"
import { skillsAPI, Skill, SkillAssociation, SkillAssociationResponse } from "@/services/api_Skills"

export default function SkillsSection() {
  const [skills, setSkills] = useState<SkillAssociationResponse[]>([])
  const [habilidades, setHabilidades] = useState<Skill[]>([])
  const [perfilId] = useState<number>(1) // ⚠️ Usa perfil real después
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    skillsAPI.getSkills().then(setHabilidades).catch(console.error)
    skillsAPI.getPerfilSkills(perfilId).then(setSkills).catch(console.error)
  }, [perfilId])

  const handleAddSkill = async (
    data: { id_habilidad: number; type: string; level: string }
  ): Promise<void> => {
    try {
      const tipo = ["Ofrece", "Busca"].includes(data.type)
        ? (data.type as "Ofrece" | "Busca")
        : "Ofrece"

      const nivel = ["Principiante", "Intermedio", "Experto"].includes(data.level)
        ? (data.level as "Principiante" | "Intermedio" | "Experto")
        : "Principiante"

      const association: SkillAssociation = {
        Perfil_id: perfilId,
        habilidad_id: data.id_habilidad,
        tipo,
        nivel,
      }

      const saved = await skillsAPI.associateSkill(association)
      setSkills(prev => [...prev, saved]) // ✅ saved es SkillAssociationResponse → tiene habilidad_nombre
      setShowAddForm(false)
    } catch (err) {
      console.error("Error al asociar habilidad:", err)
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-white mb-4">Mis Habilidades</h2>
      <ul className="mb-4">
        {skills.map((s, idx) => (
          <li key={idx} className="text-gray-300">
            {s.habilidad_nombre} - {s.tipo} - {s.nivel} {/* ✅ ahora sí existe */}
          </li>
        ))}
      </ul>
      <button
        onClick={() => setShowAddForm(true)}
        className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded"
      >
        Añadir Habilidad
      </button>

      {showAddForm && (
        <AddSkillForm
          perfilId={perfilId}
          habilidades={habilidades}
          onClose={() => setShowAddForm(false)}
          onSave={handleAddSkill}
          onCreateNew={() => {}}
        />
      )}
    </div>
  )
}
