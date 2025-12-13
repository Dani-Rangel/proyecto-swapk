"use client"
import { useState, useEffect } from "react"
import { AddSkillForm } from "./AddSkillForm"
import { skillsAPI, Skill, SkillAssociation, SkillAssociationResponse } from "@/services/api_Skills"

// Definir interfaz para el usuario
interface User {
  id: number;
  perfil_id: number;
  token: string;
  [key: string]: unknown; // Corrección aquí: unknown en lugar de any
}

export default function SkillsSection() {
  const [skills, setSkills] = useState<SkillAssociationResponse[]>([])
  const [habilidadesDisponibles, setHabilidadesDisponibles] = useState<Skill[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
      } catch (error) {
        console.error("Error parsing user ", error)
      }
    }
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.perfil_id) return
      
      try {
        setLoading(true)
        setError(null)
        
        // Obtener habilidades del usuario
        const userSkills = await skillsAPI.getPerfilSkills(user.perfil_id)
        setSkills(userSkills)
        
        // Obtener habilidades disponibles
        const availableSkills = await skillsAPI.getSkills()
        setHabilidadesDisponibles(availableSkills)
      } catch (err) {
        console.error("Error fetching ", err)
        setError("Error al cargar las habilidades")
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [user])

  // Manejar guardar cuando el usuario añade una habilidad
  const handleAddSkill = async (skillData: Omit<SkillAssociation, "Perfil_id">) => {
    if (!user?.perfil_id) {
      console.error("User profile ID not found")
      return
    }

    try {
      const association: SkillAssociation = {
        Perfil_id: user.perfil_id,
        habilidad_id: skillData.habilidad_id,
        tipo: skillData.tipo,
        nivel: skillData.nivel
      }

      const saved = await skillsAPI.associateSkill(association)
      setSkills(prev => [...prev, saved])
      setShowAddForm(false)
    } catch (error) {
      console.error("Error al añadir skill:", error)
      setError("Error al guardar la habilidad")
    }
  }

  if (loading) {
    return (
      <div className="p-6 bg-[#1a1a1a] rounded-lg border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4">Mis Habilidades</h2>
        <p className="text-gray-400">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="p-6 bg-[#1a1a1a] rounded-lg border border-gray-700">
      <h2 className="text-xl font-bold text-white mb-4">Mis Habilidades</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-900 text-red-300 rounded">
          {error}
        </div>
      )}

      {/* Listado de habilidades del usuario */}
      {skills.length > 0 ? (
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-md font-semibold text-blue-400 mb-2">Habilidades que ofrezco</h3>
              <ul className="space-y-2">
                {skills
                  .filter(skill => skill.tipo === "Ofrece")
                  .map((skill) => (
                    <li 
                      key={skill.id}
                      className="bg-[#2a2a2a] p-3 rounded-lg border border-gray-600 flex justify-between items-center"
                    >
                      <span className="text-gray-300">{skill.habilidad_nombre}</span>
                      <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-1 rounded">
                        {skill.nivel}
                      </span>
                    </li>
                  ))}
                {skills.filter(skill => skill.tipo === "Ofrece").length === 0 && (
                  <p className="text-gray-500 text-sm">No has agregado habilidades que ofreces</p>
                )}
              </ul>
            </div>
            
            <div>
              <h3 className="text-md font-semibold text-green-400 mb-2">Habilidades que busco</h3>
              <ul className="space-y-2">
                {skills
                  .filter(skill => skill.tipo === "Busca")
                  .map((skill) => (
                    <li 
                      key={skill.id}
                      className="bg-[#2a2a2a] p-3 rounded-lg border border-gray-600 flex justify-between items-center"
                    >
                      <span className="text-gray-300">{skill.habilidad_nombre}</span>
                      <span className="text-xs bg-green-900/50 text-green-300 px-2 py-1 rounded">
                        {skill.nivel}
                      </span>
                    </li>
                  ))}
                {skills.filter(skill => skill.tipo === "Busca").length === 0 && (
                  <p className="text-gray-500 text-sm">No has agregado habilidades que buscas</p>
                )}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-gray-500 mb-6">No tienes habilidades agregadas aún.</p>
      )}

      <button
        onClick={() => setShowAddForm(true)}
        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
      >
        Añadir Habilidad
      </button>

      {/* Modal de Añadir Habilidad */}
      {showAddForm && (
        <AddSkillForm
          perfilId={user?.perfil_id || 0}
          habilidades={habilidadesDisponibles}
          onClose={() => setShowAddForm(false)}
          onSave={handleAddSkill}
        />
      )}
    </div>
  )
}
