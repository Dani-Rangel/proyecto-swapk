import { NextApiRequest, NextApiResponse } from 'next'

let skills = [
  { name: 'React', type: 'Frontend', level: 'Intermedio' },
  { name: 'Node.js', type: 'Backend', level: 'Avanzado' },
]

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    res.status(200).json(skills)
  } else if (req.method === 'POST') {
    const { name, type, level } = req.body

    if (!name || !type || !level) {
      return res.status(400).json({ error: 'Faltan campos requeridos' })
    }

    const newSkill = { name, type, level }
    skills.push(newSkill)
    res.status(201).json(newSkill)
  } else {
    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
