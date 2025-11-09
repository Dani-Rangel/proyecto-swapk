"use client"
import type React from "react"
import toast, { Toaster } from 'react-hot-toast'
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
  Menu,
  PlusIcon,
  Settings,
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
  Share,
  Bookmark,
  Flag,
  Users,       // ✅ Agregado
  Clock,       // ✅ Agregado
  Star,        // ✅ Agregado
  Eye,         // ✅ Agregado
  Download,    // ✅ Agregado
  Sparkles,    // ✅ Agregado
  Target,      // ✅ Agregado
  GraduationCap // ✅ Agregado
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { type Curso, getCursos, createCurso, updateCurso, deleteCurso, getInscritosCount } from "@/services/cursosApi"
import { getCurrentUser, UserData } from "@/lib/auth"
import { Card, CardContent } from "@/components/ui/card"
import { uploadAttachments } from "@/services/attachments"
import CreatableSelect from "react-select/creatable"
import { MultiValue } from "react-select"
import { skillsAPI } from "@/services/api_Skills";
import { cursoHabilidadAPI } from '@/services/api_cursoHabilidad'
import { Notificaciones } from "@/components/ui/notificaciones/notifications"
import { useNotificaciones } from "../../context/notificacionesContext"
import { useTranslation } from "@/lib/useTranslations"
import { useRouter } from "next/navigation";
import Link from "next/link";
import ProtectedRoute from "@/components/protected_routes/protected_routes";
import { MainSidebar } from "@/components/MainSidebar"
import { inscripcionCursoAPI } from "@/services/inscripcionCursoApi"
import ManageEnrollmentsModal from "@/components/ui/ManageEnrollmentsModal"

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
  course: CursoConContador
  onBack: () => void
  onEdit: (course: CursoConContador) => void
  onDelete: (courseId: number) => void
}
interface CursoConContador extends Curso {
  inscritosCount?: number
}

function CursosComunidadComponent() {
  const { t } = useTranslation()
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<UserData | null>(null)
  const [habilidadesDisponibles, setHabilidadesDisponibles] = useState<HabilidadOption[]>([])
  const [cursos, setCursos] = useState<CursoConContador[]>([])
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [showCourseForm, setShowCourseForm] = useState<boolean>(false)
  const [selectedCourse, setSelectedCourse] = useState<CursoConContador | null>(null)
  const [newCourse, setNewCourse] = useState<NewCourseData>({
    title: "",
    description: "",
    objective: "",
    skills: [],
    attachments: [],
    courseImage: null,
  })
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false)
  const [isDark, setIsDark] = useState<boolean>(true)
  const [editingCourse, setEditingCourse] = useState<Curso | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const { agregarNotificacion } = useNotificaciones();
  const router = useRouter()
  const [perfil, setPerfil] = useState<any>(null)
  const [inscrito, setInscrito] = useState<boolean>(false)
  const [estadoInscripcion, setEstadoInscripcion] = useState<string | null>(null)
  const [inscripcionId, setInscripcionId] = useState<number | null>(null);
  const [showManageModal, setShowManageModal] = useState(false)

  const loadCursos = async () => {
    try {
      setLoading(true);
      const cursosData = await getCursos();
      // Cargar contador para cada curso
      const cursosConContador = await Promise.all(
        cursosData.map(async (curso) => {
          const count = await getInscritosCount(curso.id);
          return { ...curso, inscritosCount: count };
        })
      );
      setCursos(cursosConContador);
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
    console.log("[v0] User loaded in main component:", user);
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

  useEffect(() => {
  const user = getCurrentUser();
  setCurrentUser(user);     // ← clave
  loadCursos();
  fetchHabilidades();
  }, []);

  // 🔹 Crear curso
  const handleSubmitCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    const currentUserId = getCurrentUser()?.id;
    if (!currentUserId) {
      alert(t("must_login_to_create_course"));
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

        // 🚨 Obtener el nombre directamente de localStorage (no del estado)
        const userFromStorage = getCurrentUser();
        const nombreUsuario = userFromStorage?.nombre || "Un usuario";

        // ✅ Notificación con el nombre correcto
        agregarNotificacion({
          tipo: "Curso",
          contenido: `El usuario ${nombreUsuario} ha creado el curso "${newCourse.title}".`,
          id_usuario: currentUserId,
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
      alert(t("error_occurred_try_again"));
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
      alert(t("error_occurred_try_again"));
    } finally {
      setFormSubmitting(false)
    }
  }

  // 🔹 Eliminar curso
  const handleDeleteCourse = async (courseId: number) => {
    if (!window.confirm(t("delete_confirm_alert"))) return
    setIsDeleting(true)
    try {
      await deleteCurso(courseId)
      setCursos(cursos.filter((course) => course.id !== courseId))
      setSelectedCourse(null)
      setEditingCourse(null)
      setShowCourseForm(false)
    } catch (error) {
      console.error("Error al eliminar curso:", error)
      alert(t("error_occurred_try_again"));
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
  const handleViewMore = (course: CursoConContador) => {
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
  const handleEdit = (course: CursoConContador) => {
    setEditingCourse(course)
    setSelectedCourse(null)
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

  // ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
  // ✅ NUEVO: CourseDetailView con estilos mejorados (del archivo grande), sin exceso de efectos
  // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
  const CourseDetailView = ({ course, onBack, onEdit, onDelete }: CourseDetailViewProps) => {
    const [isCreator, setIsCreator] = useState<boolean>(false)
    const [inscrito, setInscrito] = useState<boolean>(false)
    const [estadoInscripcion, setEstadoInscripcion] = useState<string | null>(null)

    useEffect(() => {
      const user = getCurrentUser()
      if (user && course.user_id !== undefined && course.user_id !== null) {
        const userIdNum = Number(user.id)
        const courseUserIdNum = Number(course.user_id)
        setIsCreator(userIdNum === courseUserIdNum)
      } else {
        setIsCreator(false)
      }

      // Verificar si el usuario está inscrito
      const verificarInscripcion = async () => {
        const user = getCurrentUser()
        if (!user) return
        try {
          const inscripciones = await inscripcionCursoAPI.getByUser(user.id)
          const inscripcion = inscripciones.find(i => i.curso_id === course.id)
          if (inscripcion) {
            setInscrito(true)
            setEstadoInscripcion(inscripcion.estado)
            setInscripcionId(inscripcion.id)
          } else {
            setInscrito(false)
            setEstadoInscripcion(null)
            setInscripcionId(null)
          }
        } catch (error) {
          console.error("Error al verificar inscripción:", error)
        }
      }
      verificarInscripcion()
    }, [course])

    return (
      <div className="max-w-6xl mx-auto p-6">
        <Button 
          onClick={onBack} 
          variant="outline" 
          className={`mb-6 flex items-center gap-2 rounded-lg px-4 py-2 font-medium ${
            isDark 
              ? "bg-[#3E3E3E] text-[#F5F5F5] border-[#4E4E4E] hover:bg-[#4A4A4A]" 
              : "bg-white text-gray-900 border-gray-300 hover:bg-gray-50"
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          {t("volver")}
        </Button>

        <div className={`rounded-xl shadow-lg overflow-hidden ${
          isDark ? "bg-[#2E2E2E] border-[#3E3E3E]" : "bg-white border-gray-200"
        } border`}>
          {/* Imagen del curso */}
          {course.img_Cursos && (
            <div className="w-full h-60 bg-muted relative overflow-hidden">
              <img
                className="w-full h-full object-cover"
                src={`http://localhost:8000${course.img_Cursos}`}
                alt={course.titulo}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/img/image.png";
                }}
              />
            </div>
          )}

          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className={`text-3xl font-bold mb-2 ${isDark ? "text-[#F5F5F5]" : "text-gray-900"}`}>
                  {course.titulo}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-sm mb-2">
                  <p className={`flex items-center gap-1 ${isDark ? "text-[#A0A0A0]" : "text-gray-600"}`}>
                    <User className="w-3.5 h-3.5" />
                    {t("by_author")}{" "}
                    {course.usuario?.nombre ? (
                      <Link
                        href={`/profile/${course.user_id}`}
                        className={`font-medium hover:underline ${
                          isDark ? "text-blue-400" : "text-blue-600"
                        }`}
                        onClick={(e) => {
                          const user = getCurrentUser();
                          if (user?.id === course.user_id) {
                            e.preventDefault();
                          }
                        }}
                      >
                        {course.usuario.nombre}
                      </Link>
                    ) : (
                      "Usuario desconocido"
                    )}
                  </p>
                  <p className={`flex items-center gap-1 ${isDark ? "text-[#A0A0A0]" : "text-gray-600"}`}>
                    <Users className="w-3.5 h-3.5" />
                     {course.inscritosCount || 0} inscritos
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {course.descripcion && (
                <section>
                  <h2 className={`text-xl font-semibold mb-3 flex items-center gap-1.5 ${
                    isDark ? "text-[#F5F5F5]" : "text-gray-900"
                  }`}>
                    <BookOpen className="w-4 h-4" />
                    {t("description")}
                  </h2>
                  <p className={`text-sm p-4 rounded-lg border whitespace-pre-line ${
                    isDark ? "text-[#D1D1D1] bg-[#363636] border-[#404040]" : "text-gray-700 bg-gray-50 border-gray-200"
                  } max-h-60 overflow-hidden break-words hyphens-auto`}>
                    {course.descripcion}
                  </p>
                </section>
              )}

              {course.objetivo && (
                <section>
                  <h2 className={`text-xl font-semibold mb-3 flex items-center gap-1.5 ${
                    isDark ? "text-[#F5F5F5]" : "text-gray-900"
                  }`}>
                    <Target className="w-4 h-4" />
                    {t("objective")}
                  </h2>
                  <p className={`text-sm p-4 rounded-lg border whitespace-pre-line ${
                    isDark ? "text-[#D1D1D1] bg-[#363636] border-[#404040]" : "text-gray-700 bg-gray-50 border-gray-200"
                  } max-h-48 overflow-hidden break-words hyphens-auto`}>
                    {course.objetivo}
                  </p>
                </section>
              )}
            </div>

            {course.habilidades && course.habilidades.length > 0 && (
              <section className="mb-6">
                <h2 className={`text-xl font-semibold mb-3 flex items-center gap-1.5 ${
                  isDark ? "text-[#F5F5F5]" : "text-gray-900"
                }`}>
                  <Star className="w-4 h-4" />
                  {t("required_skills")}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {course.habilidades.map((h, index) => (
                    <span
                      key={index}
                      className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${
                        isDark 
                          ? "bg-[#3E3E3E] text-[#F5F5F5] border-[#4E4E4E]" 
                          : "bg-blue-100 text-blue-800"
                      } border`}
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      {h.habilidad_nombre}
                    </span>
                  ))}
                </div>
              </section>
            )}

            <section className="mb-6">
              <h2 className={`text-xl font-semibold mb-3 flex items-center gap-1.5 ${
                isDark ? "text-[#F5F5F5]" : "text-gray-900"
              }`}>
                <Download className="w-4 h-4" />
                {t("attachments")}
              </h2>
              <div className="space-y-3">
                {course.attachments && course.attachments.length > 0 ? (
                  course.attachments.map((file, index) => (
                    <div key={index} className={`flex items-center justify-between p-3 rounded-lg border ${
                      isDark ? "bg-[#363636] border-[#404040]" : "bg-gray-50 border-gray-200"
                    }`}>
                      <div className="flex items-center">
                        <Paperclip size={16} className={`mr-2 ${isDark ? "text-[#A0A0A0]" : "text-gray-500"}`} />
                        <div>
                          <span className={`text-sm font-medium ${isDark ? "text-[#F5F5F5]" : "text-gray-700"}`}>
                            {file.file_name}
                          </span>
                          <p className={`text-xs ${isDark ? "text-[#A0A0A0]" : "text-gray-500"}`}>
                            {Math.round(file.file_size / 1024)} KB • {new Date(file.fecha_subida).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <a
                        href={file.url}
                        download
                        className={`text-sm px-3 py-1.5 rounded-md font-medium ${
                          isDark ? "bg-blue-700 hover:bg-blue-600" : "bg-blue-600 hover:bg-blue-700"
                        } text-white`}
                      >
                        {t("download")}
                      </a>
                    </div>
                  ))
                ) : (
                  <p className={`text-sm py-3 text-center rounded-lg border ${
                    isDark ? "text-[#A0A0A0] bg-[#363636] border-[#404040]" : "text-gray-500 bg-gray-50 border-gray-200"
                  }`}>
                    {t("no_attachments")}
                  </p>
                )}
              </div>
            </section>

            <section className="mb-6">
              {isCreator || (inscrito && estadoInscripcion === "Confirmado") ? (
                <div className={`p-4 rounded-lg ${
                  isDark ? "bg-green-900/20 border-green-500/30" : "bg-green-50 border-green-200"
                } border`}>
                  <h3 className={`text-lg font-semibold mb-3 ${isDark ? "text-[#F5F5F5]" : "text-gray-900"}`}>
                    Contenido del curso
                  </h3>
                  <Link
                    href={`/Cursos/${course.id}`}
                    className={`inline-flex items-center px-4 py-2 font-medium rounded-md ${
                      isDark ? "bg-blue-700 hover:bg-blue-600" : "bg-blue-600 hover:bg-blue-700"
                    } text-white`}
                  >
                    <Eye className="w-4 h-4 mr-1.5" />
                    Ver curso en modo completo
                  </Link>
                </div>
              ) : (
                <div className={`h-24 w-full p-4 border flex items-center justify-center rounded-lg ${
                  isDark ? "bg-red-900/20 border-red-500/30" : "bg-red-50 border-red-200"
                }`}>
                  <span className="text-red-500 font-medium text-center">
                    {inscrito && estadoInscripcion === "Pendiente"
                      ? "⏳ Esperando aprobación del creador"
                      : inscrito && estadoInscripcion === "Finalizado"
                        ? "✅ Acceso finalizado por el creador"
                        : "🔒 Acceso restringido"}
                  </span>
                </div>
              )}
            </section>

            <section>
              <h2 className={`text-xl font-semibold mb-3 flex items-center gap-1.5 ${
                isDark ? "text-[#F5F5F5]" : "text-gray-900"
              }`}>
                <Settings className="w-4 h-4" />
                {t("actions")}
              </h2>
              <div className="flex flex-wrap gap-3">
                {!isCreator && (
                  <div className="flex gap-3">
                    <Button
                      className={`px-4 py-2 rounded-md font-medium ${
                        inscrito 
                          ? (isDark ? "bg-red-700 hover:bg-red-600" : "bg-red-600 hover:bg-red-700")
                          : (isDark ? "bg-blue-700 hover:bg-blue-600" : "bg-blue-600 hover:bg-blue-700")
                      } text-white`}
                      onClick={async () => {
                        const user = getCurrentUser()
                        if (!user) {
                          toast.error(t("mustLogin"))
                          return
                        }
                        try {
                          if (inscrito) {
                            const inscripciones = await inscripcionCursoAPI.getByUser(user.id)
                            const inscripcion = inscripciones.find(i => i.curso_id === course.id)
                            if (inscripcion) {
                              await inscripcionCursoAPI.eliminar(inscripcion.id)
                              setInscrito(false)
                              setEstadoInscripcion(null)
                              toast.success(t("cancel_enrollment_success"))
                            }
                          } else {
                            const inscritoCheck = await inscripcionCursoAPI.checkInscripcion(course.id, user.id)
                            if (inscritoCheck) {
                              const inscripciones = await inscripcionCursoAPI.getByUser(user.id)
                              const inscripcion = inscripciones.find(i => i.curso_id === course.id)
                              toast.success(`Ya estás inscrito. Estado: ${inscripcion?.estado}`)
                              setEstadoInscripcion(inscripcion?.estado || null)
                              return
                            }
                            await inscripcionCursoAPI.create({
                              curso_id: course.id,
                              usuario_id: user.id
                            })
                            setInscrito(true)
                            setEstadoInscripcion("Pendiente")
                            toast.success(t("enroll_success"))
                          }
                        } catch (error) {
                          console.error("Error al inscribirse:", error)
                          toast.error("Error al inscribirse en el curso")
                        }
                      }}
                    >
                      {inscrito ? t("cancel_enrollment") : t("enroll")}
                    </Button>
                    <Button className={`px-4 py-2 rounded-md font-medium ${
                      isDark ? "bg-[#3E3E3E] text-[#F5F5F5] border-[#4E4E4E] hover:bg-[#4A4A4A]" : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50"
                    }`}>
                      <MessageSquare className="w-4 h-4 mr-1.5" />
                      {t("send_message")}
                    </Button>
                  </div>
                )}

                {isCreator && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => onEdit(course)}
                      variant="outline"
                      size="sm"
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium ${
                        isDark ? "border-[#4E4E4E] text-[#F5F5F5] hover:bg-[#3E3E3E]" : "border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <Edit className="w-3.5 h-3.5" />
                      {t("edit_course")}
                    </Button>
                    <Button
                      onClick={() => onDelete(course.id)}
                      variant="destructive"
                      size="sm"
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium ${
                        isDark ? "border-[#4E4E4E] text-[#F5F5F5] hover:bg-[#3E3E3E]" : "border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {t("delete")}
                    </Button>
                    <Button
                      onClick={() => setShowManageModal(true)}
                      variant="outline"
                      size="sm"
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium ${
                        isDark ? "border-[#4E4E4E] text-[#F5F5F5] hover:bg-[#3E3E3E]" : "border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      Solicitudes Inscripciones
                    </Button>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>

        <ManageEnrollmentsModal
          isOpen={showManageModal}
          onClose={() => setShowManageModal(false)}
          cursoId={course.id}
          onEstadoActualizado={() => {
            const user = getCurrentUser()
            if (user) {
              inscripcionCursoAPI.getByUser(user.id).then(inscripciones => {
                const inscripcion = inscripciones.find(i => i.curso_id === course.id)
                if (inscripcion) {
                  setInscrito(true)
                  setEstadoInscripcion(inscripcion.estado)
                  setInscripcionId(inscripcion.id)
                } else {
                  setInscrito(false)
                  setEstadoInscripcion(null)
                  setInscripcionId(null)
                }
              })
            }
          }}
        />
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-background flex ${isDark ? "bg-[#1A1A1A]" : "bg-gray-50"}`}>
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className={`mt-4 ${isDark ? "text-[#F5F5F5]" : "text-gray-900"}`}>{t("loading_courses")}</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center">
          <div className={`max-w-md p-6 rounded-lg shadow-md text-center ${isDark ? "bg-[#2E2E2E]" : "bg-white"}`}>
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className={`text-xl font-bold mb-2 ${isDark ? "text-[#F5F5F5]" : "text-gray-900"}`}>
              {t("connectionError")}
            </h2>
            <p className={isDark ? "text-[#D1D1D1]" : "text-gray-600"}>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className={`mt-4 px-4 py-2 rounded-md ${isDark ? "bg-blue-700 text-white hover:bg-blue-600" : "bg-blue-600 text-white hover:bg-blue-700"}`}
            >
              {t("retry")}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Botón Hamburguesa */}
          <div className="absolute top-4 left-4 md:hidden z-50">
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-gray-600 dark:text-gray-300">
              {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>

          {/* Sidebar Izquierdo */}
          <MainSidebar
            isDark={isDark}
            toggleTheme={toggleTheme}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            user={currentUser}
          />

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
              // ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
              // ✅ NUEVO: Formulario de creación/editar con estilos mejorados (grid, iconos, padding)
              // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
              <div className="p-6">
                <div className={`max-w-4xl mx-auto p-6 rounded-xl shadow-lg ${
                  isDark ? "bg-[#2E2E2E]" : "bg-white"
                }`}>
                  <div className="relative mb-6 flex items-center justify-between">
                    <div>
                      <h2 className={`text-2xl font-bold ${isDark ? "text-[#F5F5F5]" : "text-gray-900"}`}>
                        {editingCourse ? t("edit_course") : t("great_lets_do_it")}
                      </h2>
                      <h3 className={`text-gray-500 ${isDark ? "text-[#A0A0A0]" : ""}`}>
                        {editingCourse ? t("modify_course_details") : t("tell_us_about_your_course")}
                      </h3>
                    </div>
                    <button
                      className={`text-gray-500 hover:text-gray-700 dark:text-[#A0A0A0] dark:hover:text-[#F5F5F5] disabled:opacity-50`}
                      onClick={handleCloseForm}
                      disabled={formSubmitting}
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <form onSubmit={editingCourse ? handleUpdateCourse : handleSubmitCourse} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Columna izquierda: imagen, título y objetivo */}
                      <div className="space-y-5">
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${isDark ? "text-[#D1D1D1]" : "text-gray-700"}`}>
                            {t("course_image")}
                          </label>
                          <div className="space-y-3">
                            <button
                              type="button"
                              onClick={() => imageInputRef.current?.click()}
                              className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border ${
                                isDark 
                                  ? "border-[#4E4E4E] text-[#F5F5F5] hover:bg-[#3E3E3E]" 
                                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              <Paperclip size={16} />
                              {newCourse.courseImage ? t("change_image") : t("select_image")}
                            </button>
                            <input
                              type="file"
                              ref={imageInputRef}
                              onChange={handleImageChange}
                              className="hidden"
                              accept="image/*"
                            />
                            {newCourse.courseImage && (
                              <div className="mt-3">
                                <div className="flex justify-between items-center mb-2">
                                  <p className={`text-sm ${isDark ? "text-[#D1D1D1]" : "text-gray-700"}`}>{t("preview")}</p>
                                  <button
                                    type="button"
                                    onClick={handleRemoveImage}
                                    className={`text-sm ${isDark ? "text-red-400 hover:text-red-300" : "text-red-600 hover:text-red-500"}`}
                                  >
                                    {t("delete")}
                                  </button>
                                </div>
                                <div className="relative h-36 rounded-md overflow-hidden border">
                                  <img
                                    src={URL.createObjectURL(newCourse.courseImage) || "/img/image.png"}
                                    alt="Vista previa"
                                    className="absolute inset-0 w-full h-full object-cover"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <label htmlFor="title" className={`block text-sm font-medium mb-2 ${isDark ? "text-[#D1D1D1]" : "text-gray-700"}`}>
                            {t("course_title")}
                          </label>
                          <input
                            type="text"
                            id="title"
                            name="title"
                            value={newCourse.title}
                            onChange={handleFormChange}
                            className={`w-full px-3 py-2.5 border rounded-lg ${
                              isDark ? "bg-[#3E3E3E] border-[#4E4E4E] text-[#F5F5F5]" : "bg-white border-gray-300 text-gray-900"
                            }`}
                            required
                            placeholder="Ej. Introducción a React"
                          />
                        </div>

                        <div>
                          <label htmlFor="objective" className={`block text-sm font-medium mb-2 ${isDark ? "text-[#D1D1D1]" : "text-gray-700"}`}>
                            {t("main_objective")}
                          </label>
                          <input
                            type="text"
                            id="objective"
                            name="objective"
                            value={newCourse.objective}
                            onChange={handleFormChange}
                            className={`w-full px-3 py-2.5 border rounded-lg ${
                              isDark ? "bg-[#3E3E3E] border-[#4E4E4E] text-[#F5F5F5]" : "bg-white border-gray-300 text-gray-900"
                            }`}
                            required
                            placeholder="Ej. Aprender los fundamentos de..."
                          />
                        </div>
                      </div>

                      {/* Columna derecha: descripción y habilidades */}
                      <div className="space-y-5">
                        <div>
                          <label htmlFor="description" className={`block text-sm font-medium mb-2 ${isDark ? "text-[#D1D1D1]" : "text-gray-700"}`}>
                            {t("description")}
                          </label>
                          <textarea
                            id="description"
                            name="description"
                            value={newCourse.description}
                            onChange={handleFormChange}
                            className={`w-full px-3 py-2.5 border rounded-lg ${
                              isDark ? "bg-[#3E3E3E] border-[#4E4E4E] text-[#F5F5F5]" : "bg-white border-gray-300 text-gray-900"
                            }`}
                            required
                            rows={6}
                            placeholder="Describe el curso para atraer a los estudiantes..."
                          />
                        </div>

                        <div>
                          <label htmlFor="skills" className={`block text-sm font-medium mb-2 ${isDark ? "text-[#D1D1D1]" : "text-gray-700"}`}>
                            {t("skills_select_or_type")}
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
                            placeholder={t("select_skills")}
                            className="react-select-container"
                            classNamePrefix="react-select"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Archivos adjuntos (fuera del grid) */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? "text-[#D1D1D1]" : "text-gray-700"}`}>
                        {t("attachments")}
                      </label>
                      <div className="space-y-3">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border ${
                            isDark 
                              ? "border-[#4E4E4E] text-[#F5F5F5] hover:bg-[#3E3E3E]" 
                              : "border-gray-300 text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <Paperclip size={16} />
                          {t("attach_files")}
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple />
                        {newCourse.attachments.length > 0 && (
                          <div className="space-y-2">
                            {newCourse.attachments.map((file, index) => (
                              <div
                                key={index}
                                className={`flex items-center justify-between p-2.5 rounded-lg ${
                                  isDark ? "bg-[#3E3E3E]" : "bg-gray-50"
                                }`}
                              >
                                <span className={`text-sm ${isDark ? "text-[#D1D1D1]" : "text-gray-700"}`}>
                                  {file.name} ({Math.round(file.size / 1024)} KB)
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFile(index)}
                                  className={isDark ? "text-[#A0A0A0] hover:text-[#F5F5F5]" : "text-gray-500 hover:text-red-500"}
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex justify-end gap-3 pt-4">
                      {editingCourse && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(t("delete_confirm_alert"))) {
                              handleDeleteCourse(editingCourse.id)
                            }
                          }}
                          disabled={formSubmitting || isDeleting}
                          className={`px-4 py-2.5 rounded-md font-medium text-white ${
                            isDark ? "bg-red-700 hover:bg-red-600" : "bg-red-600 hover:bg-red-700"
                          } disabled:opacity-50`}
                        >
                          {isDeleting ? t("deleting") : t("delete_course")}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleCloseForm}
                        disabled={formSubmitting || isDeleting}
                        className={`px-4 py-2.5 rounded-md font-medium ${
                          isDark 
                            ? "border-[#4E4E4E] text-[#F5F5F5] hover:bg-[#3E3E3E]" 
                            : "border-gray-300 text-gray-700 hover:bg-gray-50"
                        } disabled:opacity-50`}
                      >
                        {t("cancel")}
                      </button>
                      <button
                        type="submit"
                        disabled={formSubmitting || isDeleting}
                        className={`px-5 py-2.5 rounded-md font-medium text-white ${
                          isDark ? "bg-blue-700 hover:bg-blue-600" : "bg-blue-600 hover:bg-blue-700"
                        } disabled:opacity-50`}
                      >
                        {formSubmitting
                          ? editingCourse
                            ? t("updating")
                            : t("publishing")
                          : editingCourse
                            ? t("update_course")
                            : t("publish_course")}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : (
              <div className="p-6">
                <div className="flex justify-between items-center mb-8">
                  <h1 className={`text-2xl font-bold ${isDark ? "text-[#F5F5F5]" : "text-gray-900"}`}>
                    {t("community_courses")}
                  </h1>
                  <button
                    className={`inline-flex items-center gap-1.5 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                      isDark ? "bg-blue-700 hover:bg-blue-600" : "bg-blue-600 hover:bg-blue-700"
                    }`}
                    onClick={handleCreateCourse}
                  >
                    <Plus size={16} />
                    {t("create_course")}
                  </button>
                </div>

                {/* ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼ */}
                {/* ✅ NUEVO: Grid de tarjetas con estilos mejorados (iconos, gradientes suaves, sombras) */}
                {/* ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲ */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {cursos && cursos.length > 0 ? (
                    cursos.map((curso) => {
                      const isCreator =
                        currentUser &&
                        curso.user_id !== undefined &&
                        curso.user_id !== null &&
                        Number(currentUser.id) === Number(curso.user_id)

                      return (
                        <Card 
                          key={curso.id} 
                          className={`overflow-hidden rounded-xl shadow-md hover:shadow-lg transition-shadow ${
                            isDark ? "bg-[#2E2E2E] border-[#3E3E3E]" : "bg-white border-gray-200"
                          }`}
                          onClick={() => handleViewMore(curso)}
                        >
                          <div className="relative pb-40 overflow-hidden rounded-t-lg">
                            <img
                              className="absolute inset-0 h-full w-full object-cover"
                              src={`http://localhost:8000${curso.img_Cursos}` || "/img/image.png"}
                              alt={curso.titulo}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "/img/image.png";
                              }}
                            />
                            <div className="absolute top-3 left-3">
                              <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                                isDark ? "bg-black/40 text-white" : "bg-white/80 text-gray-800"
                              }`}>
                                👥 {curso.inscritosCount || 0}
                              </span>
                            </div>
                            <div className="absolute bottom-3 left-3 flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-white border-2 overflow-hidden">
                                <img
                                  src="/img/user.png"
                                  alt={curso.usuario?.nombre || "Usuario"}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <span className={`text-sm font-medium ${
                                isDark ? "text-white drop-shadow" : "text-gray-800"
                              }`}>
                                {curso.usuario?.nombre || "Desconocido"}
                              </span>
                            </div>
                            {isCreator && (
                              <div className="absolute top-3 right-3 flex gap-1">
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleEdit(curso)
                                  }}
                                  variant="ghost"
                                  size="sm"
                                  className={`w-8 h-8 p-0 rounded ${
                                    isDark ? "bg-white/20 hover:bg-white/30 text-white" : "bg-black/20 hover:bg-black/30 text-white"
                                  }`}
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (window.confirm(t("delete_confirm_alert"))) {
                                      handleDeleteCourse(curso.id)
                                    }
                                  }}
                                  variant="ghost"
                                  size="sm"
                                  className={`w-8 h-8 p-0 rounded ${
                                    isDark ? "bg-red-500/30 hover:bg-red-500/40 text-white" : "bg-red-500/30 hover:bg-red-500/40 text-white"
                                  }`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            )}
                          </div>

                          <CardContent className="p-4">
                            <h3 className={`text-lg font-semibold mb-1 line-clamp-2 ${
                              isDark ? "text-[#F5F5F5]" : "text-gray-900"
                            }`}>
                              {curso.titulo}
                            </h3>

                            {curso.objetivo && (
                              <p className={`text-sm mb-1 flex items-start gap-1.5 text-gray-600 dark:text-[#A0A0A0] line-clamp-2`}>
                                <Target className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                🎯 {curso.objetivo}
                              </p>
                            )}

                            {curso.descripcion && (
                              <p className={`text-sm mb-3 line-clamp-3 ${
                                isDark ? "text-[#A0A0A0]" : "text-gray-500"
                              }`}>
                                {curso.descripcion}
                              </p>
                            )}

                            <div className="flex flex-wrap gap-1.5 mb-4">
                              {curso.habilidades && curso.habilidades.length > 0 ? (
                                curso.habilidades.slice(0, 3).map((h, index) => (
                                  <span
                                    key={index}
                                    className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                                      isDark ? "bg-[#3E3E3E] text-[#F5F5F5]" : "bg-blue-100 text-blue-800"
                                    }`}
                                  >
                                    <Sparkles className="w-2.5 h-2.5" />
                                    {h.habilidad_nombre}
                                  </span>
                                ))
                              ) : (
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                    isDark ? "bg-[#3E3E3E] text-[#A0A0A0]" : "bg-gray-200 text-gray-600"
                                  }`}
                                >
                                  {t("no_skills")}
                                </span>
                              )}
                              {curso.habilidades && curso.habilidades.length > 3 && (
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                    isDark ? "bg-[#3E3E3E] text-[#A0A0A0]" : "bg-gray-200 text-gray-600"
                                  }`}
                                >
                                  +{curso.habilidades.length - 3}
                                </span>
                              )}
                            </div>

                            <button
                              onClick={() => handleViewMore(curso)}
                              className={`w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-md font-medium ${
                                isDark 
                                  ? "bg-[#3E3E3E] text-[#F5F5F5] border-[#4E4E4E] hover:bg-[#4A4A4A]" 
                                  : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50"
                              } border`}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              {t("view_more")}
                            </button>
                          </CardContent>
                        </Card>
                      )
                    })
                  ) : (
                    <div
                      className={`text-center py-12 px-6 shadow rounded-lg col-span-full ${
                        isDark ? "bg-[#2E2E2E]" : "bg-white"
                      }`}
                    >
                      <p className={isDark ? "text-[#D1D1D1] mb-6" : "text-gray-600 mb-6"}>
                        {t("no_courses_available")}
                      </p>
                      <button
                        className={`inline-flex items-center gap-1.5 px-5 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                          isDark ? "bg-blue-700 hover:bg-blue-600" : "bg-blue-600 hover:bg-blue-700"
                        }`}
                        onClick={handleCreateCourse}
                      >
                        <Plus size={16} />
                        {t("be_first_to_create_course")}
                      </button>
                    </div>
                  )}
                </div>

                {/* Call to Action Section */}
                {cursos.length > 0 && (
                  <div className={`mt-10 shadow rounded-xl overflow-hidden ${
                    isDark ? "bg-[#2E2E2E]" : "bg-white"
                  }`}>
                    <div className="px-6 py-8 sm:px-8 flex flex-col sm:flex-row justify-between items-center">
                      <div className="mb-4 sm:mb-0">
                        <h2 className={`text-xl font-bold mb-1 ${isDark ? "text-[#F5F5F5]" : "text-gray-900"}`}>
                          {t("interesting_right")}
                        </h2>
                        <p className={isDark ? "text-[#D1D1D1]" : "text-gray-600"}>
                          {t("want_to_share_courses")}
                        </p>
                      </div>
                      <button
                        className={`inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium rounded-md shadow-sm text-white ${
                          isDark ? "bg-blue-700 hover:bg-blue-600" : "bg-blue-600 hover:bg-blue-700"
                        }`}
                        onClick={handleCreateCourse}
                      >
                        <Plus size={16} />
                        {t("create_course")}
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

export default function CursosComunidad() {
  return (
    <ProtectedRoute>
      <CursosComunidadComponent />
    </ProtectedRoute>
  )
}