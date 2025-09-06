"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import {
  Search,
  Plus,
  Sun,
  Moon,
  Paperclip,
  X,
  MessageSquare,
  Bell,
  User,
  Home,
  TrendingUp,
  RefreshCw,
  BookOpen,
  AlertCircle,
  Edit,
  Trash2,
  ArrowLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { type Curso, getCursos, createCurso, updateCurso, deleteCurso} from "@/services/cursosApi"
import { getCurrentUser } from "@/lib/auth"
import { Card, CardContent } from "@/components/ui/card"
import {uploadAttachments} from "@/services/attachments"
import CreatableSelect from "react-select/creatable"
import { MultiValue } from "react-select"
import { skillsAPI } from "@/services/api_Skills";
import { cursoHabilidadAPI } from '@/services/api_cursoHabilidad'
import { Notificaciones } from "@/components/ui/notificaciones/notifications"
import { useNotificaciones } from "@/context/notificacionesContext"




interface NewCourseData {
  title: string
  description: string
  objective: string
  skills: HabilidadOption[]
  attachments: File[]
  courseImage: File | null
}

type HabilidadOption = {
  id: number 
  value: string
  label: string
}


interface CourseDetailViewProps {
  course: Curso
  onBack: () => void
  onEdit: (course: Curso) => void
  onDelete: (courseId: number) => void
}

interface UserData {
  id: number
}

const CursosComunidad: React.FC = () => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<UserData | null>(null)
  
  const [habilidadesDisponibles, setHabilidadesDisponibles] = useState<HabilidadOption[]>([])
  const [cursos, setCursos] = useState<Curso[]>([])
  const [searchQuery, setSearchQuery] = useState<string>("")

  const [showCourseForm, setShowCourseForm] = useState<boolean>(false)
  const [selectedCourse, setSelectedCourse] = useState<Curso | null>(null)
  const [newCourse, setNewCourse] = useState<NewCourseData>({
    title: "",
    description: "",
    objective: "",
    skills: [],
    attachments: [],
    courseImage: null,
  })
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false)
  const [isDark, setIsDark] = useState<boolean>(false)
  const [editingCourse, setEditingCourse] = useState<Curso | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const { agregarNotificacion } = useNotificaciones();



  const loadCursos = async () => {
  try {
    setLoading(true);
    const cursosData = await getCursos();
    console.log("[v0] Raw API response:", cursosData); 
    setCursos(cursosData);
  } catch (error) {
    console.error("Error loading cursos:", error);
  } finally {
    setLoading(false);
  }
};

const fetchHabilidades = async () => {
  try {
    const data = await skillsAPI.getSkills();

    const opciones = data.map((habilidad: any) => ({
      id: habilidad.id,
      value: habilidad.id.toString(),
      label: habilidad.nombre,
    }));

    setHabilidadesDisponibles(opciones);
  } catch (error) {
    console.error('Error fetching habilidades:', error);
  }
};


useEffect(() => {
  const user = getCurrentUser();
  console.log("[v0] User loaded in main component:", user); // Asegúrate de que este usuario tiene un `id`
  setCurrentUser(user);
  loadCursos();
  fetchHabilidades();
}, []);

useEffect(() => {
  async function loadCursoHabilidades() {
    if (!selectedCourse) return;
    try {
      const habilidades = await cursoHabilidadAPI.getCursoHabilidades(selectedCourse.id);
      console.log("Habilidades asociadas:", habilidades);
    } catch (err) {
      console.error("Error cargando habilidades del curso", err);
    }
  }

  loadCursoHabilidades();
}, [selectedCourse]);

  // 🔹 Crear curso
 const handleSubmitCourse = async (e: React.FormEvent) => {
  e.preventDefault();
  setFormSubmitting(true);

  const currentUserId = getCurrentUser()?.id;
  if (!currentUserId) {
    alert("Debes iniciar sesión para crear o editar un curso.");
    setFormSubmitting(false);
    return;
  }

  try {
    // 1. Preparo los datos comunes
    const cursoPayload = {
      titulo: newCourse.title,
      descripcion: newCourse.description,
      objetivo: newCourse.objective,
      img_Cursos: newCourse.courseImage
        ? await convertImageToBase64(newCourse.courseImage)
        : editingCourse?.img_Cursos || "",
      user_id: currentUserId,
      habilidades_ids: newCourse.skills.map((h) => h.id),
    };

    let cursoId: number;

    // 2. Crear o editar
    if (editingCourse) {
      // 🟢 EDITAR
      const updatedCurso = await updateCurso(editingCourse.id, cursoPayload);
      cursoId = updatedCurso.id;

      // 🧹 Eliminar habilidades anteriores
      await cursoHabilidadAPI.deleteAllForCurso(cursoId);

      // Actualizar lista
      setCursos((prev) =>
        prev.map((c) => (c.id === cursoId ? updatedCurso : c))
      );
    } else {
      // 🟢 CREAR
      const createdCurso = await createCurso(cursoPayload);
      cursoId = createdCurso.id;

      // Agregar a la lista
      setCursos((prev) => [createdCurso, ...prev]);

       agregarNotificacion({
        tipo: "curso_creado",
        contenido: `El usuario ${currentUserId} ha creado el curso "${newCourse.title}".`,
      });
    }

    // 3. Asociar habilidades seleccionadas
    for (const habilidad of newCourse.skills) {
      await cursoHabilidadAPI.associateHabilidad({
        curso_id: cursoId,
        habilidad_id: habilidad.id,
      });
    }

    // 4. Subir archivos si hay
    if (newCourse.attachments.length > 0) {
      await uploadAttachments(cursoId, newCourse.attachments);
    }

    // 5. Resetear formulario
    handleCloseForm();
  } catch (error) {
    console.error("❌ Error al procesar el curso:", error);
    alert("Ocurrió un error. Por favor, intenta nuevamente.");
  } finally {
    setFormSubmitting(false);
  }
};



  // 🔹 Convertir imagen a base64 para enviar a la API
 const convertImageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};



  // 🔹 Actualizar curso
 const handleUpdateCourse = async (e: React.FormEvent) => {
  e.preventDefault()
  if (!editingCourse) return
  setFormSubmitting(true)

  try {
    const currentUserId = getCurrentUser()?.id
    if (!currentUserId) throw new Error("Usuario no autenticado")

    const updatedData = {
      titulo: newCourse.title,
      descripcion: newCourse.description,
      objetivo: newCourse.objective,
      img_Cursos: newCourse.courseImage
        ? await convertImageToBase64(newCourse.courseImage)
        : editingCourse.img_Cursos,
      User_Id: currentUserId,
      habilidades_ids: newCourse.skills.map((h) => h.id),
    }

    // 🟢 Actualizar curso principal
    const updatedCurso = await updateCurso(editingCourse.id, updatedData)

    // 🟡 Eliminar habilidades anteriores y asociar nuevas
    await cursoHabilidadAPI.deleteAllForCurso(editingCourse.id)
    for (const habilidad of newCourse.skills) {
      await cursoHabilidadAPI.associateHabilidad({
        curso_id: editingCourse.id,
        habilidad_id: habilidad.id,
      })
    }

    // 🔵 Subir archivos si hay
    if (newCourse.attachments.length > 0) {
      await uploadAttachments(editingCourse.id, newCourse.attachments)
    }

    // 🧹 Actualizar en estado
    setCursos(cursos.map((course) => (course.id === editingCourse.id ? updatedCurso : course)))
    setShowCourseForm(false)
    setEditingCourse(null)
  } catch (error) {
    console.error("Error al actualizar curso:", error)
    alert("Error al actualizar el curso. Por favor, intenta nuevamente.")
  } finally {
    setFormSubmitting(false)
  }
}


  // 🔹 Eliminar curso
  const handleDeleteCourse = async (courseId: number) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este curso?")) return
    setIsDeleting(true)
    try {
      await deleteCurso(courseId)
      setCursos(cursos.filter((course) => course.id !== courseId))
      setSelectedCourse(null)
      setEditingCourse(null)
      setShowCourseForm(false)
    } catch (error) {
      console.error("Error al eliminar curso:", error)
      alert("Error al eliminar el curso. Por favor, intenta nuevamente.")
    } finally {
      setIsDeleting(false)
    }
  }

  // 🔹 Cerrar formulario
  const handleCloseForm = () => {
    setShowCourseForm(false)
    setEditingCourse(null)
    setNewCourse({
      title: "",
      description: "",
      objective: "",
      skills: [],
      attachments: [],
      courseImage: null,
    })
  }

  // 🔹 Cambiar tema
  const toggleTheme = () => {
    setIsDark(!isDark)
  }

  // 🔹 Ver más
  const handleViewMore = (course: Curso) => {
    console.log("Curso seleccionado para ver más:", course)
    setSelectedCourse(course)
    setShowCourseForm(false)
    setEditingCourse(null)
  }

  // 🔹 Crear curso (abrir form)
  const handleCreateCourse = () => {
    setEditingCourse(null)
    setSelectedCourse(null)
    setShowCourseForm(true)
  }

  // 🔹 Editar curso
  const handleEdit = (course: Curso) => {
    console.log("Curso seleccionado para editar:", course)
    setEditingCourse(course)
    setSelectedCourse(null)
    // Convertir array de habilidades a string separado por comas
    const skillsString = course.habilidades ? course.habilidades.map((h) => h.habilidad_nombre).join(", ") : ""

    setNewCourse({
      title: course.titulo,
      description: course.descripcion || "",
      objective: course.objetivo || "",
       skills: course.habilidades
    ? course.habilidades.map((h) => ({
        id: h.id,
        value: h.habilidad_nombre,
        label: h.habilidad_nombre,
      }))
    : [],
      attachments: [],
      courseImage: null,
    })
    setShowCourseForm(true)
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNewCourse((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)
      setNewCourse((prev) => ({
        ...prev,
        attachments: [...prev.attachments, ...newFiles],
      }))
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewCourse((prev) => ({
        ...prev,
        courseImage: e.target.files![0],
      }))
    }
  }

  const handleRemoveFile = (index: number) => {
    const updatedFiles = [...newCourse.attachments]
    updatedFiles.splice(index, 1)
    setNewCourse((prev) => ({
      ...prev,
      attachments: updatedFiles,
    }))
  }

  const handleRemoveImage = () => {
    setNewCourse((prev) => ({
      ...prev,
      courseImage: null,
    }))
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Searching:", searchQuery)
  }

  // Componente para mostrar detalles del curso
  const CourseDetailView = ({ course, onBack, onEdit, onDelete }: CourseDetailViewProps) => {
    const [isCreator, setIsCreator] = useState<boolean>(false)

    useEffect(() => {
      const user = getCurrentUser()
      console.log("[v0] Current user loaded:", user)
      console.log("[v0] Course User_Id:", course.user_id)
      console.log("[v0] Course object:", course)

      if (user && course.user_id !== undefined && course.user_id !== null) {
        const userIdNum = Number(user.id)
        const courseUserIdNum = Number(course.user_id)
        const creatorCheck = userIdNum === courseUserIdNum

        console.log("[v0] Creator verification:", {
          userId: userIdNum,
          courseUserId: courseUserIdNum,
          isCreator: creatorCheck,
        })

        setIsCreator(creatorCheck)
      } else {
        console.log("[v0] Cannot verify creator - missing data:", {
          hasUser: !!user,
          courseUserId: course. user_id,
          userType: typeof course.user_id,
        })
        setIsCreator(false)
      }
    }, [course]) // Updated dependency array to include the entire course object


    return (
      <div className="max-w-4xl mx-auto p-6">
        <Button onClick={onBack} variant="outline" className="mb-6 flex items-center gap-2 bg-transparent">
          <ArrowLeft className="w-4 h-4" />
          Volver a cursos
        </Button>

        <div className="bg-card rounded-lg shadow-lg overflow-hidden">
        {/* Mostrar la imagen del curso si existe */}
        {course.img_Cursos && (
          <div className="w-full h-64 bg-muted flex items-center justify-center">
            <img
              className="w-full h-full object-cover"
              src={course.img_Cursos}  // Mostrar la imagen Base64 directamente
              alt={course.titulo}
            />
          </div>
        )}

          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">{course.titulo}</h1>
                <p className="text-muted-foreground">Por: {course.usuario?.nombre || "Usuario desconocido"}</p>
              </div>
            </div>

            {course.descripcion && (
              <section>
                <h2 className="text-xl font-semibold mb-2 w-full">Descripción</h2>
                <p className="text-sm mb-1 w-full break-words line-clamp-2">{course.descripcion}</p>
              </section>
            )}

            {course.objetivo && (
              <section>
                <h2 className="text-xl font-semibold mb-2">Objetivo</h2>
                <p className="text-sm mb-1">{course.objetivo}</p>
              </section>
            )}

            {course.habilidades && course.habilidades.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-2">Habilidades requeridas</h2>
                <div className="flex flex-wrap gap-1 mb-4">
                  {course.habilidades.slice(0, 3).map((h, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {h.habilidad_nombre}
                    </span>
                  ))}
                  {course.habilidades.length > 3 && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-600">
                      +{course.habilidades.length - 3}
                    </span>
                  )}
                </div>
              </section>
            )}

           <section>
  <h2 className="text-xl font-semibold mb-4">Archivos adjuntos</h2>
  <div className="space-y-3">
    {course.attachments && course.attachments.length > 0 ? (
      course.attachments.map((file, index) => (
        <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border">
          <div className="flex items-center">
            <Paperclip size={18} className="mr-3 text-gray-500" />
            <div>
              <span className="text-sm font-medium text-gray-700">{file.file_name}</span>
              <p className="text-xs text-gray-500">
                {Math.round(file.file_size / 1024)} KB • {new Date(file.fecha_subida).toLocaleDateString()}
              </p>
            </div>
          </div>
          <a
            href={file.url}  // Asegúrate de que el enlace esté correcto
            download
            className="text-sm px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Descargar
          </a>
        </div>
      ))
    ) : (
      <p className="text-sm text-gray-500">No hay archivos adjuntos.</p>
    )}
  </div>
</section>

            <section>
              <h2 className="text-xl font-semibold mb-2">Acciones</h2>
              <div className="flex flex-wrap gap-4">
                <Button className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Inscribirse</Button>
                <Button className="px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300">
                  Enviar mensaje
                </Button>
                {isCreator && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => onEdit(course)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </Button>
                  <Button
                    onClick={() => onDelete(course.id)}
                    variant="destructive"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </Button>
                </div>
              )}
              </div>
            </section>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-background flex ${isDark ? "bg-[#1A1A1A]" : "bg-gray-50"}`}>
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className={`mt-4 ${isDark ? "text-[#F5F5F5]" : "text-gray-900"}`}>Cargando cursos...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center">
          <div className={`max-w-md p-6 rounded-lg shadow-md text-center ${isDark ? "bg-[#2E2E2E]" : "bg-white"}`}>
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className={`text-xl font-bold mb-2 ${isDark ? "text-[#F5F5F5]" : "text-gray-900"}`}>
              Error de conexión
            </h2>
            <p className={isDark ? "text-[#D1D1D1]" : "text-gray-600"}>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className={`mt-4 px-4 py-2 rounded-md ${isDark ? "bg-blue-700 text-white hover:bg-blue-600" : "bg-blue-600 text-white hover:bg-blue-700"}`}
            >
              Reintentar
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Left Sidebar Navigation */}
          <div
            className={`w-66 flex flex-col border-r transition-colors duration-300 ${isDark ? "bg-[#1E1E1E] border-[#2E2E2E]" : "bg-white border-gray-200"}`}
          >
            {/* Top Navigation Items */}
            <div
              className={`p-3 border-b transition-colors duration-300 ${isDark ? "border-[#2E2E2E]" : "border-gray-200"}`}
            >
              <div className="flex items-center gap-2 mb-3">
                <img src="/img/logoswapk.png" alt="Swapk Logo" className="w-7 h-auto" />
                <span
                  className={`text-sm transition-colors duration-300 ${isDark ? "text-[#F5F5F5]" : "text-gray-700"}`}
                >
                  SWAPK
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleTheme}
                  className={`ml-auto h-6 w-6 p-0 transition-colors duration-300 ${isDark ? "text-[#A0A0A0] hover:bg-[#2E2E2E] hover:text-[#F5F5F5]" : "text-gray-600 hover:text-gray-900"}`}
                >
                  {isDark ? <Sun className="w-4 h-4 cursor-pointer" /> : <Moon className="cursor-pointer w-4 h-4" />}
                </Button>
              </div>

              {/* Search Bar */}
              <form onSubmit={handleSearch} className="relative mb-3">
                <Search
                  className={`cursor-pointer absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${isDark ? "text-[#A0A0A0]" : "text-gray-500"}`}
                />
                <Input
                  placeholder="Buscar en Swapk"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`pl-10 w-full h-8 transition-colors duration-300 
                        border-none shadow-none focus-visible:ring-0 ${
                          isDark
                            ? "bg-[#1E1E1E] text-[#F5F5F5] placeholder-[#A0A0A0]"
                            : "bg-gray-100 text-gray-900 placeholder-gray-500"
                        }`}
                />
              </form>

              {/* User Actions */}
              <div className="flex gap-1 mb-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`cursor-pointer flex-1 h-8 transition-colors duration-300 ${isDark ? "text-[#A0A0A0] hover:bg-[#2E2E2E] hover:text-[#F5F5F5]" : "text-gray-600 hover:text-gray-900"}`}
                >
                  <MessageSquare className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`cursor-pointer flex-1 h-8 transition-colors duration-300 ${isDark ? "text-[#A0A0A0] hover:bg-[#2E2E2E] hover:text-[#F5F5F5]" : "text-gray-600 hover:text-gray-900"}`}
                >
                  <Notificaciones />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`cursor-pointer flex-1 h-8 transition-colors duration-300 ${isDark ? "text-[#A0A0A0] hover:bg-[#2E2E2E] hover:text-[#F5F5F5]" : "text-gray-600 hover:text-gray-900"}`}
                >
                  <User className="w-4 h-4" />
                </Button>
              </div>

              {/* Main Navigation */}
              <nav className="space-y-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="cursor-pointer w-full justify-start bg-blue-600 text-white hover:bg-blue-700 h-8 transition-colors duration-300"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Inicio
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`cursor-pointer w-full justify-start h-8 transition-colors duration-300 ${isDark ? "text-[#F5F5F5] hover:bg-[#2E2E2E]" : "text-gray-700 hover:bg-gray-100"}`}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Popular
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`cursor-pointer w-full justify-start h-8 transition-colors duration-300 ${isDark ? "text-[#F5F5F5] hover:bg-[#2E2E2E]" : "text-gray-700 hover:bg-gray-100"}`}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Intercambios
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`cursor-pointer w-full justify-start h-8 transition-colors duration-300 ${isDark ? "text-[#F5F5F5] hover:bg-[#2E2E2E]" : "text-gray-700 hover:bg-gray-100"}`}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Mis Cursos
                </Button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-auto">
            {selectedCourse ? (
              <div className="p-6">
                <CourseDetailView
                  course={selectedCourse}
                  onBack={() => setSelectedCourse(null)}
                  onEdit={handleEdit}
                  onDelete={handleDeleteCourse}
                />
              </div>
            ) : showCourseForm ? (
              <div className="p-6">
                <div className={`max-w-2xl mx-auto p-6 rounded-lg shadow-md ${isDark ? "bg-[#2E2E2E]" : "bg-white"}`}>
                  <div className="relative mb-6">
                    <h2 className={`text-2xl font-bold ${isDark ? "text-[#F5F5F5]" : "text-gray-900"}`}>
                      {editingCourse ? "Editar curso" : "Genial, hagámoslo"}
                    </h2>
                    <h3 className={isDark ? "text-[#D1D1D1]" : "text-gray-600"}>
                      {editingCourse ? "Modifica los detalles de tu curso" : "Cuéntanos, ¿De qué trata tu curso?"}
                    </h3>
                    <button
                      className={`absolute top-0 right-0 ${isDark ? "text-[#A0A0A0] hover:text-[#F5F5F5]" : "text-gray-500 hover:text-gray-700"} disabled:opacity-50`}
                      onClick={handleCloseForm}
                      disabled={formSubmitting}
                    >
                      ×
                    </button>
                  </div>

                  <form onSubmit={editingCourse ? handleUpdateCourse : handleSubmitCourse} className="space-y-6">
                    {/* Campo para la imagen del curso */}
                    <div>
                      <label
                        className={`block text-sm font-medium mb-1 ${isDark ? "text-[#D1D1D1]" : "text-gray-700"}`}
                      >
                        Imagen del curso
                      </label>
                      <div className="space-y-3">
                        <button
                          type="button"
                          onClick={() => imageInputRef.current?.click()}
                          className={`flex items-center px-4 py-2 rounded-md ${isDark ? "bg-[#3E3E3E] text-[#F5F5F5] hover:bg-[#4E4E4E]" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                        >
                          <Paperclip size={16} className="mr-2" />
                          {newCourse.courseImage ? "Cambiar imagen" : "Seleccionar imagen"}
                        </button>
                        <input
                          type="file"
                          ref={imageInputRef}
                          onChange={handleImageChange}
                          className="hidden"
                          accept="image/*"
                        />

                        {newCourse.courseImage && (
                          <div className="mt-2">
                            <div className="flex justify-between items-center mb-2">
                              <p className={`text-sm ${isDark ? "text-[#D1D1D1]" : "text-gray-700"}`}>Vista previa:</p>
                              <button
                                type="button"
                                onClick={handleRemoveImage}
                                className={`text-sm ${isDark ? "text-red-400 hover:text-red-300" : "text-red-600 hover:text-red-500"}`}
                              >
                                Eliminar
                              </button>
                            </div>
                            <div className="relative h-40 rounded-md overflow-hidden border">
                              <img
                                src={URL.createObjectURL(newCourse.courseImage) || "/placeholder.svg"}
                                alt="Vista previa del curso"
                                className="absolute inset-0 w-full h-full object-cover"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label
                        htmlFor="title"
                        className={`block text-sm font-medium mb-1 ${isDark ? "text-[#D1D1D1]" : "text-gray-700"}`}
                      >
                        Título del curso
                      </label>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        value={newCourse.title}
                        onChange={handleFormChange}
                        className={`w-full px-3 py-2 border rounded-md ${isDark ? "bg-[#3E3E3E] border-[#4E4E4E] text-[#F5F5F5]" : "bg-white border-gray-300 text-gray-900"}`}
                        required
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="description"
                        className={`block text-sm font-medium mb-1 ${isDark ? "text-[#D1D1D1]" : "text-gray-700"}`}
                      >
                        Descripción
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        value={newCourse.description}
                        onChange={handleFormChange}
                        className={`w-full px-3 py-2 border rounded-md ${isDark ? "bg-[#3E3E3E] border-[#4E4E4E] text-[#F5F5F5]" : "bg-white border-gray-300 text-gray-900"}`}
                        required
                        rows={4}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="objective"
                        className={`block text-sm font-medium mb-1 ${isDark ? "text-[#D1D1D1]" : "text-gray-700"}`}
                      >
                        Objetivo principal
                      </label>
                      <input
                        type="text"
                        id="objective"
                        name="objective"
                        value={newCourse.objective}
                        onChange={handleFormChange}
                        className={`w-full px-3 py-2 border rounded-md ${isDark ? "bg-[#3E3E3E] border-[#4E4E4E] text-[#F5F5F5]" : "bg-white border-gray-300 text-gray-900"}`}
                        required
                      />
                    </div>

                    <div>
                    <label
                      htmlFor="skills"
                      className={`block text-sm font-medium mb-1 ${isDark ? "text-[#D1D1D1]" : "text-gray-700"}`}
                    >
                      Habilidades (selecciona o escribe y presiona Enter)
                    </label>
                    <CreatableSelect
                      isMulti
                      options={habilidadesDisponibles}
                      value={newCourse.skills}
                      onChange={(selected: MultiValue<HabilidadOption>) => {
                        setNewCourse((prev) => ({
                          ...prev,
                          skills: selected as HabilidadOption[],
                        }));
                      }}
                      placeholder="Selecciona habilidades..."
                    />

                  </div>

                    <div>
                      <label
                        className={`block text-sm font-medium mb-1 ${isDark ? "text-[#D1D1D1]" : "text-gray-700"}`}
                      >
                        Archivos adjuntos
                      </label>
                      <div className="space-y-3">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className={`flex items-center px-4 py-2 rounded-md ${isDark ? "bg-[#3E3E3E] text-[#F5F5F5] hover:bg-[#4E4E4E]" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                        >
                          <Paperclip size={16} className="mr-2" />
                          Adjuntar archivos
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple />

                        {newCourse.attachments.length > 0 && (
                          <div className="space-y-2">
                            {newCourse.attachments.map((file, index) => (
                              <div
                                key={index}
                                className={`flex items-center justify-between p-2 rounded ${isDark ? "bg-[#3E3E3E]" : "bg-gray-50"}`}
                              >
                                <span className={`text-sm ${isDark ? "text-[#D1D1D1]" : "text-gray-700"}`}>
                                  {file.name} ({Math.round(file.size / 1024)} KB)
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFile(index)}
                                  className={
                                    isDark ? "text-[#A0A0A0] hover:text-[#F5F5F5]" : "text-gray-500 hover:text-red-500"
                                  }
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                      {editingCourse && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm("¿Estás seguro de que deseas eliminar este curso?")) {
                              handleDeleteCourse(editingCourse.id)
                            }
                          }}
                          disabled={formSubmitting || isDeleting}
                          className={`px-4 py-2 rounded-md text-white ${isDark ? "bg-red-700 hover:bg-red-600" : "bg-red-600 hover:bg-red-700"} disabled:opacity-50`}
                        >
                          {isDeleting ? "Eliminando..." : "Eliminar curso"}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleCloseForm}
                        disabled={formSubmitting || isDeleting}
                        className={`px-4 py-2 border rounded-md ${isDark ? "border-[#4E4E4E] text-[#F5F5F5] hover:bg-[#3E3E3E]" : "border-gray-300 text-gray-700 hover:bg-gray-50"} disabled:opacity-50`}
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={formSubmitting || isDeleting}
                        className={`px-4 py-2 rounded-md text-white ${isDark ? "bg-blue-700 hover:bg-blue-600" : "bg-blue-600 hover:bg-blue-700"} disabled:opacity-50`}
                      >
                        {formSubmitting
                          ? editingCourse
                            ? "Actualizando..."
                            : "Publicando..."
                          : editingCourse
                            ? "Actualizar curso"
                            : "Publicar curso"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : (
              <div className="p-6">
                <div className="flex justify-between items-center mb-8">
                  <h1 className={`text-2xl font-bold ${isDark ? "text-[#F5F5F5]" : "text-gray-900"}`}>
                    Cursos de la comunidad
                  </h1>
                  <button
                    className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${isDark ? "bg-blue-700 hover:bg-blue-600" : "bg-blue-600 hover:bg-blue-700"} focus:outline-none focus:ring-2 focus:ring-offset-2 ${isDark ? "focus:ring-blue-500" : "focus:ring-blue-500"}`}
                    onClick={handleCreateCourse}
                  >
                    <Plus size={16} className="mr-2" />
                    Crear curso
                  </button>
                </div>

                {/* Courses Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {cursos && cursos.length > 0 ? (
                    cursos.map((curso) => {
                      console.log("[v0] Processing curso:", {
                        id: curso.id,
                        titulo: curso.titulo,
                        User_Id: curso.user_id,
                        User_Id_type: typeof curso.user_id,
                      })

                      const isCreator =
                        currentUser &&
                        curso.user_id !== undefined &&
                        curso.user_id !== null &&
                        Number(currentUser.id) === Number(curso.user_id)

                      console.log("[v0] Grid item creator check:", {
                        cursoId: curso.id,
                        currentUserId: currentUser?.id,
                        cursoUserId: curso.user_id,
                        isCreator,
                      })

                      return (
                        <Card key={curso.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                          <div className="relative pb-48 overflow-hidden rounded-t-lg">
                            <img
                              className="absolute inset-0 h-full w-full object-cover"
                              src={curso.img_Cursos || "/default-course.png"}
                              alt={curso.titulo}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                // target.src = "/default-course.png";
                              }}
                            />
                            <div className="absolute bottom-4 left-4">
                              <div className="relative">
                                <img
                                  className="h-10 w-10 rounded-full border-2 border-white"
                                  src="/default-avatar.png"
                                  alt={curso.usuario?.nombre || "Usuario"}
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    // target.src = "/default-avatar.png";
                                  }}
                                />
                              </div>
                            </div>
                          </div>

                          <CardContent className="p-4">
                            <div className="flex items-center mb-2">
                              <span className={`text-sm ${isDark ? "text-[#D1D1D1]" : "text-gray-600"}`}>
                                {curso.usuario?.nombre || "Desconocido"}
                              </span>
                              {isCreator && (
                                <div className="ml-auto flex space-x-1">
                                  <Button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleEdit(curso)
                                    }}
                                    variant="ghost"
                                    size="sm"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (window.confirm("¿Estás seguro de que deseas eliminar este curso?")) {
                                        handleDeleteCourse(curso.id)
                                      }
                                    }}
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              )}
                            </div>

                            <h3 className={`text-lg font-medium mb-1 ${isDark ? "text-[#F5F5F5]" : "text-gray-900"}`}>
                              {curso.titulo}
                            </h3>

                            {curso.objetivo && (
                              <p
                                className={`text-sm mb-1 ${
                                  isDark
                                    ? "text-[#A0A0A0] w-full break-words line-clamp-2"
                                    : "text-gray-500 w-full break-words line-clamp-2"
                                }`}
                              >
                                🎯 {curso.objetivo}
                              </p>
                            )}

                            {curso.descripcion && (
                              <p
                                className={`text-sm mb-1 ${
                                  isDark
                                    ? "text-[#A0A0A0] w-full break-words line-clamp-2"
                                    : "text-gray-500 w-full break-words line-clamp-2"
                                }`}
                              >
                                {curso.descripcion}
                              </p>
                            )}

                            <div className="flex flex-wrap gap-1 mb-4">
                              {curso.habilidades && curso.habilidades.length > 0 ? (
                                curso.habilidades.slice(0, 3).map((h, index) => (
                                  <span
                                    key={index}
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      isDark ? "bg-[#3E3E3E] text-[#F5F5F5]" : "bg-blue-100 text-blue-800"
                                    }`}
                                  >
                                    {h.habilidad_nombre}
                                  </span>
                                ))
                              ) : (
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    isDark ? "bg-[#3E3E3E] text-[#F5F5F5]" : "bg-gray-200 text-gray-600"
                                  }`}
                                >
                                  Sin habilidades
                                </span>
                              )}
                              {curso.habilidades && curso.habilidades.length > 3 && (
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    isDark ? "bg-[#3E3E3E] text-[#F5F5F5]" : "bg-gray-200 text-gray-600"
                                  }`}
                                >
                                  +{curso.habilidades.length - 3}
                                </span>
                              )}
                            </div>

                            <button
                              onClick={() => handleViewMore(curso)}
                              className={`w-full inline-flex justify-center items-center px-4 py-2 border shadow-sm text-sm font-medium rounded-md ${
                                isDark
                                  ? "border-[#4E4E4E] text-[#F5F5F5] bg-[#3E3E3E] hover:bg-[#4E4E4E]"
                                  : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                              } focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                isDark ? "focus:ring-blue-500" : "focus:ring-blue-500"
                              }`}
                            >
                              Ver más
                            </button>
                          </CardContent>
                        </Card>
                      )
                    })
                  ) : (
                    <div
                      className={`text-center py-16 px-6 shadow rounded-lg col-span-full ${
                        isDark ? "bg-[#2E2E2E]" : "bg-white"
                      }`}
                    >
                      <p className={isDark ? "text-[#D1D1D1] mb-6" : "text-gray-600 mb-6"}>
                        No hay cursos disponibles todavía.
                      </p>
                      <button
                        className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white ${
                          isDark ? "bg-blue-700 hover:bg-blue-600" : "bg-blue-600 hover:bg-blue-700"
                        } focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                          isDark ? "focus:ring-blue-500" : "focus:ring-blue-500"
                        }`}
                        onClick={handleCreateCourse}
                      >
                        <Plus size={16} className="mr-2" />
                        Sé el primero en crear un curso
                      </button>
                    </div>
                  )}
                </div>

                {/* Call to Action Section */}
                {cursos.length > 0 && (
                  <div className={`mt-12 shadow rounded-lg overflow-hidden ${isDark ? "bg-[#2E2E2E]" : "bg-white"}`}>
                    <div className="px-6 py-12 sm:px-12 flex flex-col sm:flex-row justify-between items-center">
                      <div className="mb-6 sm:mb-0">
                        <h2 className={`text-2xl font-bold mb-2 ${isDark ? "text-[#F5F5F5]" : "text-gray-900"}`}>
                          ¿Muy interesante no?
                        </h2>
                        <p className={isDark ? "text-[#D1D1D1]" : "text-gray-600"}>
                          ¿Acaso quieres compartir cursos con los demás?
                        </p>
                      </div>
                      <button
                        className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white ${
                          isDark ? "bg-blue-700 hover:bg-blue-600" : "bg-blue-600 hover:bg-blue-700"
                        } focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                          isDark ? "focus:ring-blue-500" : "focus:ring-blue-500"
                        }`}
                        onClick={handleCreateCourse}
                      >
                        <Plus size={16} className="mr-2" />
                        Crear curso
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default CursosComunidad
