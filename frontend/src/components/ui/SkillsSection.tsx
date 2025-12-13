"use client"
import { useState, useEffect } from "react"
import { AddSkillForm } from "./AddSkillForm"
import { skillsAPI, SkillAssociation } from "@/services/api_Skills" // ✅ IMPORTA skillsAPI y el tipo

export default function SkillsSection() {
  const [skills, setSkills] = useState<any[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)

  const handleAddSkill = async (skill: { id_habilidad: number; type: string; level: string }) => {
    try {
      // ✅ Usa skillsAPI.associateSkill en lugar de addUserSkill
      const association: SkillAssociation = {
        Perfil_id: 1, // ⚠️ ¡Reemplaza con el perfil real!
        habilidad_id: skill.id_habilidad,
        tipo: skill.type as any,
        nivel: skill.level as any,
      };

      const saved = await skillsAPI.associateSkill(association);
      setSkills((prev) => [...prev, { ...saved, type: skill.type, level: skill.level }]);
      setShowAddForm(false);
    } catch (error) {
      console.error("Error al asociar habilidad:", error);
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-white mb-4">Mis Habilidades</h2>
      <ul className="mb-4">
        {skills.map((s, idx) => (
          <li key={idx} className="text-gray-300">
            {s.habilidad_nombre || s.nombre} - {s.type} - {s.level}
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
          onClose={() => setShowAddForm(false)}
          onSave={handleAddSkill}
          onCreateNew={() => {
            setShowAddForm(false);
            setShowCreateForm(true);
          }}
        />
      )}

      {/* Nota: CreateSkillForm no estaba definido — asegúrate de tenerlo */}

    </div>
  );
}
