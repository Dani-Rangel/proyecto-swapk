import axios from "axios"

const attachmentsApi = axios.create({
  baseURL: "https://backend-production-fc5e.up.railway.app/attachments",
  timeout: 60000,
})

export const uploadAttachments = async (cursoId: number, files: File[]): Promise<any> => {
  try {
    const formData = new FormData()
    
    files.forEach((file) => {
      formData.append("files", file)
    })

    const response = await attachmentsApi.post(`/upload/${cursoId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })

    console.log("Archivos subidos correctamente:", response.data)
    return response.data
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error("Error al subir archivos:", error.response?.data || error.message)
    } else {
      console.error("Error inesperado:", error)
    }
    throw error
  }
}
