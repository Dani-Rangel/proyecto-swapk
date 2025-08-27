// services/api_Skills.ts

export interface SkillAssociation {
  habilidad_id?: number;
  nueva_habilidad_nombre?: string;
  nueva_habilidad_descripcion?: string;
  nueva_habilidad_id_categoria?: number;
  tipo: "Ofrece" | "Busca";
  nivel: "Principiante" | "Intermedio" | "Experto";
}

export interface PerfilData {
  id?: number;
  id_usuario: number;
  nombre?: string;
  correo?: string;
  descripcion?: string;
  ubicacion?: string;
  Tel?: number;
  foto_perfil?: string;
  habilidades: SkillAssociation[];
}

// Obtener perfil completo - CORREGIDO
export const getMyProfile = async (): Promise<PerfilData> => {
  try {
    const response = await fetch('/perfiles/1'); // Cambia por tu endpoint real
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
    
  } catch (error) {
    console.error('Error en getMyProfile:', error);
    // Retornar un perfil vacío en caso de error
    return {
      id_usuario: 1,
      nombre: "Usuario",
      habilidades: []
    };
  }
};

// Crear o actualizar perfil completo - CORREGIDO
export const createOrUpdatePerfil = async (perfilData: PerfilData): Promise<PerfilData> => {
  try {
    const response = await fetch('/perfiles/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(perfilData),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Error ${response.status}`);
    }
    
    const data = await response.json();
    return data;
    
  } catch (error) {
    console.error('Error en createOrUpdatePerfil:', error);
    throw error; // Relanzar el error para manejarlo en el componente
  }
};

// Obtener todas las habilidades disponibles
export const getAllHabilidades = async (): Promise<{ id: number; nombre: string }[]> => {
  try {
    const response = await fetch('/habilidades/');
    if (response.ok) {
      return await response.json();
    }
    return [];
  } catch (error) {
    console.error('Error en getAllHabilidades:', error);
    return [];
  }
};