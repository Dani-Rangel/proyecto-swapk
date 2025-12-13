"use client";

import { useState, useEffect } from "react";
import { AddSkillForm } from "./AddSkillForm";
import {
  skillsAPI,
  Skill,
  SkillAssociation,
  SkillAssociationResponse,
} from "@/services/api_Skills";

export default function SkillsSection() {
  const [skills, setSkills] = useState<SkillAssociationResponse[]>([]);
  const [habilidades, setHabilidades] = useState<Skill[]>([]);
  const [perfilId] = useState<number>(1); // ⚠️ Reemplaza con el ID real del usuario logueado
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    // Cargar habilidades disponibles
    skillsAPI.getSkills().then(setHabilidades).catch(console.error);
    // Cargar habilidades asociadas al perfil
    skillsAPI.getPerfilSkills(perfilId).then(setSkills).catch(console.error);
  }, [perfilId]);

  // ✅ CORRECCIÓN CLAVE: handleAddSkill recibe directamente SkillAssociation
  const handleAddSkill = async (assoc: SkillAssociation): Promise<void> => {
    try {
      const saved = await skillsAPI.associateSkill(assoc);
      setSkills((prev) => [...prev, saved]); // saved es SkillAssociationResponse → tiene habilidad_nombre
      setShowAddForm(false);
    } catch (err) {
      console.error("Error al asociar habilidad:", err);
      // Opcional: toast.error(...)
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-white mb-4">Mis Habilidades</h2>
      <ul className="mb-4">
        {skills.map((s, idx) => (
          <li key={idx} className="text-gray-300">
            {s.habilidad_nombre} - {s.tipo} - {s.nivel} {/* ✅ habilidad_nombre existe */}
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
          onSave={handleAddSkill} // ✅ ahora coincide el tipo: (assoc: SkillAssociation) => Promise<void>
          onCreateNew={() => {
            setShowAddForm(false);
            setShowCreateForm(true);
          }}
        />
      )}

      {/* Mostrar CreateSkillForm si se necesita */}
      {showCreateForm && <div>— Formulario de crear habilidad (pendiente)</div>}
    </div>
  );
}
