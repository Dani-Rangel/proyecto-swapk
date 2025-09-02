export enum RolUsuario {
  Administrador = "Administrador",
  Moderador = "Moderador",
  Usuario = "Usuario",
}

export interface Usuario {
  id: number
  nombre: string
  correo: string
  rol: RolUsuario
  fecha_creacion: string
}

export interface CreateUsuarioData {
  nombre: string
  correo: string
  contrasena: string
  rol: RolUsuario
}

export interface UpdateUsuarioData {
  nombre?: string
  correo?: string
  rol?: RolUsuario
}
