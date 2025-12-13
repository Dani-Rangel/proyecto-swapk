"use client"
import { useState, useEffect } from "react"
import { AddSkillForm } from "./AddSkillForm"
import { addUserSkill } from "@/services/api_Skills"

export default function SkillsSection() {
  const [skills, setSkills] = useState<any[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)

  // Manejar guardar cuando el usuario añade o crea
  const handleAddSkill = async (skill: { id_habilidad: number; type: string; level: string }) => {
    try {
      const saved = await addUserSkill(skill) // API call
      setSkills((prev) => [...prev, saved])   // lo agregamos al estado local
    } catch (error) {
      console.error("Error al añadir skill:", error)
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-white mb-4">Mis Habilidades</h2>

      {/* Listado de habilidades del usuario */}
      <ul className="mb-4">
        {skills.map((s, idx) => (
          <li key={idx} className="text-gray-300">
            {s.nombre} - {s.type} - {s.level}
          </li>
        ))}
      </ul>

      <button
        onClick={() => setShowAddForm(true)}
        className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded"
      >
        Añadir Habilidad
      </button>

      {/* Modal de Añadir Habilidad */}
      {showAddForm && (
        <AddSkillForm
          onClose={() => setShowAddForm(false)}
          onSave={handleAddSkill}
          onCreateNew={() => {
            setShowAddForm(false)
            setShowCreateForm(true)
          }}
        />
      )}

      {/* Modal de Crear Habilidad */}
      {showCreateForm && (
        <CreateSkillForm
          onClose={() => setShowCreateForm(false)}
          onSave={handleAddSkill}
        />
      )}
    </div>
  )
}
