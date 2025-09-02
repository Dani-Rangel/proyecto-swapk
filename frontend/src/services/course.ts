export interface Curso {
  id: number
  titulo: string
  descripcion: string
  objetivo: string
  User_Id: number
  img_Cursos?: string
  fecha_creacion: string
}

export interface CreateCursoData {
  titulo: string
  descripcion: string
  objetivo: string
  User_Id: number
  img_Cursos?: string
}

export interface UpdateCursoData {
  titulo?: string
  descripcion?: string
  objetivo?: string
  User_Id?: number
  img_Cursos?: string
}
