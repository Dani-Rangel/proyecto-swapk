// src/lib/api.ts

export interface Skill {
  name: string
  type: string
  level: string
}

export async function fetchSkills(): Promise<Skill[]> {
  const res = await fetch("/api/skills")
  if (!res.ok) {
    throw new Error("Error al obtener habilidades")
  }
  return res.json()
}

export async function addSkill(skill: Skill): Promise<Skill> {
  const res = await fetch("/api/skills", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(skill),
  })

  if (!res.ok) {
    throw new Error("Error al agregar habilidad")
  }

  return res.json()
}
