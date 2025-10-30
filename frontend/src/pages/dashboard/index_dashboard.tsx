"use client"
import { useTranslation } from "../../lib/useTranslations"
import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import toast, { Toaster } from 'react-hot-toast'
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Badge } from "../../components/ui/badge"
import { Card, CardContent } from "../../components/ui/card"
import {
  Search,
  MessageSquare,
  Bell,
  User,
  Settings,
  Home,
  TrendingUp,
  RefreshCw,
  BookOpen,
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
  Share,
  Bookmark,
  Flag,
  Sun,
  Moon,
  Menu,
  X,
  PlusIcon,
  Edit,
  Trash2,
  Users,
} from "lucide-react"
import Link from "next/link"
import ProtectedRoute from "@/components/protected_routes/protected_routes"
import { Heart } from "lucide-react"
import { MainSidebar } from "@/components/MainSidebar"
import { useNotificaciones } from "../../context/notificacionesContext"
import { getCurrentUser } from "@/lib/auth"
import { getCursos } from "@/services/cursosApi"

//Tipos basados en tus modelos SQLAlchemy
interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  rol: "Administrador" | "Moderador" | "Usuario";
  fecha_creacion?: string;
}
interface Perfil {
  id: number;
  id_usuario: number;
  descripcion?: string;
  ubicacion?: string;
  Tel?: number;
  foto_perfil?: string;
}

function ForumLayoutComponent() {
  const router = useRouter()
  const { t } = useTranslation()
  const { agregarNotificacion } = useNotificaciones()
  // activeTab usa valores fijos (no traducciones)
  const [activeTab, setActiveTab] = useState("Intercambio")
  const tabLabels: Record<string, string> = {
    Intercambio: t("postTypeExchanges"),
    Curso: t("postTypeCourses"),
    Pregunta: t("postTypeQuestions"),
    Logro: t("postTypeAchievements"),
    Todo: t("todo"),
  }
  const [isDark, setIsDark] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [user, setUser] = useState<Usuario | null>(null)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  // Paginacion
  const [todosLosPerfiles, setTodosLosPerfiles] = useState<Perfil[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const perfilesPerPage = 12;
  // Estados para publicaciones y comentarios
  const [publicaciones, setPublicaciones] = useState<any[]>([])
  const [perfiles, setPerfiles] = useState<any[]>([]);
  const [likes, setLikes] = useState<Record<number, number>>({})
  const [userLikes, setUserLikes] = useState<Record<number, boolean>>({})
  const [comentarios, setComentarios] = useState<Record<number, any[]>>({})
  const [comentariosAbiertos, setComentariosAbiertos] = useState<number | null>(null)
  const [cursos, setCursos] = useState<any[]>([]) 
  const [nuevoComentario, setNuevoComentario] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"posts" | "profiles">("posts");
  const [editingPost, setEditingPost] = useState<any | null>(null) // <-- Nuevo estado para edición
  const [newPost, setNewPost] = useState({
    titulo: "",
    contenido: "",
    tipo: "Intercambio",
    imagen: ""
  })
  const [showShareMenu, setShowShareMenu] = useState<number | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [isEditCommentModalOpen, setIsEditCommentModalOpen] = useState(false);
 const [editingComment, setEditingComment] = useState<any | null>(null);
 const [editedCommentText, setEditedCommentText] = useState("");
 // Nuevo estado para el modal de likes de Instagram
 const [isInstagramLikesModalOpen, setIsInstagramLikesModalOpen] = useState(false);
 const [instagramLikesData, setInstagramLikesData] = useState<any[]>([]); // Para almacenar los datos de los likes
 const [currentPostId, setCurrentPostId] = useState<number | null>(null); // Para saber qué publicación estamos viendo

  // Referencia para evitar memory leaks
  const isMountedRef = useRef(true)
  const tabToApiSlug: Record<string, string> = {
    Intercambio: "intercambios",
    Curso: "cursos",
    Pregunta: "preguntas",
    Logro: "logros",
    Todo: "all",
  }
  const getApiTipo = (tab: string) => {
    return tab === "Todo" ? "all" : tabToApiSlug[tab] || "all"
  }
  //  Cargar usuario desde localStorage (memoizado para evitar renders innecesarios)
  useEffect(() => {
    isMountedRef.current = true;
    const savedUser = localStorage.getItem("user");
    if (savedUser && isMountedRef.current) {
      try {
        const parsed = JSON.parse(savedUser);
        // Asegurar que el rol siempre exista y tenga un valor válido
        const usuario: Usuario = parsed.usuario || { 
          id: parsed.id, 
          nombre: parsed.nombre, 
          correo: parsed.correo, 
          rol: parsed.rol || "Usuario" // <- Por defecto "Usuario" si no viene
        };
        const perfilData: Perfil | null = parsed.perfil || null;
        // Evitar actualizaciones innecesarias en el estado del usuario
        setUser((prev: Usuario | null) => {
          if (prev?.id === usuario.id && prev?.rol === usuario.rol) return prev;
          return usuario;
        });
        // Evitar actualizaciones innecesarias en el estado del perfil
        setPerfil((prev: Perfil | null) => {
          if (JSON.stringify(prev) === JSON.stringify(perfilData)) return prev;
          return perfilData;
        });
      } catch (error) {
        console.error("Error al parsear usuario desde localStorage:", error);
        // Limpieza en caso de datos corruptos
        localStorage.removeItem("user");
        setUser(null);
        setPerfil(null);
      }
    }
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  // Cleanup para el menú de compartir
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showShareMenu !== null) {
        setShowShareMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showShareMenu]);
  // Obtener configuración de tipo (color, slug, display)
  const getTipoConfig = useCallback((tipo: string) => {
    switch (tipo) {
      case "Intercambio":
        return { color: "bg-green-600", slug: "intercambios", display: t("postTypeExchanges") }
      case "Curso":
        return { color: "bg-blue-600", slug: "cursos", display: t("postTypeCourses") }
      case "Pregunta":
        return { color: "bg-yellow-600", slug: "preguntas", display: t("postTypeQuestions") }
      case "Logro":
        return { color: "bg-purple-600", slug: "logros", display: t("postTypeAchievements") }
      default:
        return { color: "bg-gray-600", slug: "all", display: tipo }
    }
  }, [t])
  // Formatear fecha
  const formatFecha = useCallback((fechaStr: string) => {
    const fecha = new Date(fechaStr)
    if (isNaN(fecha.getTime())) {
      console.warn("Fecha inválida:", fechaStr)
      return "Fecha inválida"
    }
    const ahora = new Date()
    const diffMs = ahora.getTime() - fecha.getTime()
    const diffMin = Math.floor(diffMs / (1000 * 60))
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60))
    if (diffMin < 1) return t("justNow")
    if (diffMin < 60) return `${diffMin} ${t("minutesAgo")}`
    if (diffHrs < 24) return `${diffHrs} ${t("hoursAgo")}`
    return fecha.toLocaleDateString()
  }, [t])
  useEffect(() => {
  const fetchCursos = async () => {
    try {
      const data = await getCursos();
      setCursos(data);
    } catch (error) {
      console.error("Error al cargar cursos:", error);
    }
  };
    fetchCursos();
  }, []);
  useEffect(() => {
    if (!user?.id) return;
    const controller = new AbortController();
    const cargarPublicaciones = async () => {
      try {
        const tipo = "all";
        const res = await fetch(`http://localhost:8000/api/publicaciones/${tipo}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Error al cargar publicaciones");
        const data = await res.json();
        const posts = Array.isArray(data) ? data : [];
        setPublicaciones(posts);
        const likesMap: Record<number, number> = {};
        const userLikesMap: Record<number, boolean> = {};
        posts.forEach((post: any) => {
          likesMap[post.id] = post.likes?.length || 0;
          userLikesMap[post.id] =
            post.likes?.some((like: any) => like.id_usuario === user?.id) || false;
        });
        setLikes(likesMap);
        setUserLikes(userLikesMap);
      } catch (error: any) {
        if (error.name !== "AbortError") {
          console.error("Error al cargar publicaciones:", error);
          toast.error("Error al cargar publicaciones");
        }
      }
    };
    cargarPublicaciones();
    return () => controller.abort();
  }, [activeTab, user?.id, refreshTrigger]);
  const toggleTheme = () => setIsDark(!isDark)
  // Manejar like
const handleLike = async (postId: number) => {
  if (!user) {
    toast.error(t("mustLogin"))
    return
  }
  const savedUser = localStorage.getItem("user");
  if (!savedUser) {
    toast.error(t("mustLogin"));
    return;
  }
  const token = JSON.parse(savedUser)?.token;
  if (!token) {
    toast.error(t("mustLogin"));
    return;
  }
  try {
    const res = await fetch(`http://localhost:8000/api/publicaciones/${postId}/like`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    })
    const data = await res.json()
    setLikes((prev) => ({ ...prev, [postId]: data.total_likes }))
    setUserLikes((prev) => ({ ...prev, [postId]: data.liked }))
    // Solo si el usuario dio like (no si lo quitó), enviar notificación
    if (data.liked) {
      const currentUser = getCurrentUser()
      const nombreUsuario = currentUser?.nombre || "Un usuario"
      // buscar la publicación para obtener el autor
      const post = publicaciones.find(p => p.id === postId)
      if (post && post.id_usuario !== currentUser?.id) { // No notificar si es el mismo usuario
        agregarNotificacion({
          tipo: "Publicacion", // Aca tenemos que asegurarnos que coincida con el enum en el backend
          contenido: `El usuario ${nombreUsuario} ha dado like a tu publicación: "${post.titulo}".`,
          id_usuario: post.id_usuario, // Notificar al autor de la publicación
        })
      }
    }
  } catch (error) {
    toast.error(t("likeError"))
  }
}
  // manejar comentarios
  const toggleComentarios = async (postId: number) => {
    if (comentariosAbiertos === postId) {
      setComentariosAbiertos(null)
    } else {
      setComentariosAbiertos(postId)
      try {
        const res = await fetch(`http://localhost:8000/api/publicaciones/${postId}/comentarios`)
        const data = await res.json()
        setComentarios((prev) => ({
          ...prev,
          [postId]: Array.isArray(data) ? data : []
        }))
      } catch (error) {
        console.error("Error al cargar comentarios:", error)
        setComentarios((prev) => ({ ...prev, [postId]: [] }))
      }
    }
  }
  // comentar
 const handleComentar = async (postId: number, post: any) => {
  if (!nuevoComentario.trim()) return
  const savedUser = localStorage.getItem("user");
  if (!savedUser) {
    toast.error(t("mustLogin"));
    return;
  }
  const token = JSON.parse(savedUser)?.token;
  if (!token) {
    toast.error(t("mustLogin"));
    return;
  }
  try {
    const res = await fetch(`http://localhost:8000/api/publicaciones/comentarios`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        contenido: nuevoComentario,
        id_publicacion: postId,
      }),
    })
    if (res.ok) {
      const updatedRes = await fetch(`http://localhost:8000/api/publicaciones/${postId}/comentarios`)
      const updatedComments = await updatedRes.json()
      setComentarios((prev) => ({
        ...prev,
        [postId]: Array.isArray(updatedComments) ? updatedComments : []
      }))
      setNuevoComentario("")
      // Notificar al autor de la publicación
      const user = getCurrentUser()
      const nombreUsuario = user?.nombre || "Un usuario"
      if (post.id_usuario && post.id_usuario !== user?.id) {
        agregarNotificacion({
          tipo: "comentario",
          contenido: `El usuario ${nombreUsuario} ha comentado en tu publicación: "${post.titulo}".`,
          id_usuario: post.id_usuario,
        })
      }
      toast.success(t("commentPosted"))
    } else {
      const error = await res.json()
      toast.error(error.detail || t("errorPosting"))
    }
  } catch (error) {
    toast.error(t("connectionError"))
  }
}
  const handleShare = (postId: number) => {
    setShowShareMenu(showShareMenu === postId ? null : postId)
  }
  const copyLink = (postId: number) => {
    const postUrl = `${window.location.origin}/post/${postId}`
    navigator.clipboard.writeText(postUrl)
    toast.success(t("linkCopied"))
    setShowShareMenu(null)
  }
  // ➕ Crear nueva publicación
  const handleCreatePost = async () => {
    if (!newPost.titulo.trim() || !newPost.contenido.trim()) {
      toast.error("Completa título y contenido")
      return
    }
    const savedUser = localStorage.getItem("user");
    if (!savedUser) {
      toast.error(t("mustLogin"));
      return;
    }
    const parsedUser = JSON.parse(savedUser);
    const token = parsedUser.token;
    try {
      const url = editingPost 
        ? `http://localhost:8000/api/publicaciones/${editingPost.id}` 
        : "http://localhost:8000/api/publicaciones";
      const method = editingPost ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newPost,
          id_usuario: parsedUser.id,
          id_perfil: parsedUser.perfil?.id || null
        }),
      })
      if (res.ok) {
        toast.success(editingPost ? t("postUpdated") : t("postCreated"))
        // Solo si es una NUEVA publicación (no edición), crear notificación
        if (!editingPost) {
          const user = getCurrentUser()
          const nombreUsuario = user?.nombre || "Un usuario"
          agregarNotificacion({
            tipo: "Publicacion", 
            contenido: `El usuario ${nombreUsuario} ha creado una nueva publicación: "${newPost.titulo}".`,
            id_usuario: user?.id || 0,
          })
        }
        setIsModalOpen(false)
        setNewPost({ titulo: "", contenido: "", tipo: "Intercambio", imagen: "" })
        setEditingPost(null)
        setRefreshTrigger(prev => prev + 1)
      } else {
        const error = await res.json()
        toast.error(error.detail || (editingPost ? t("errorUpdating") : t("errorCreating")))
      }
    } catch (error) {
      toast.error(t("connectionError"))
    }
  }
  // Editar publicación — abre el mismo modal con los datos cargados
  const handleEditPost = (post: any) => {
    setEditingPost(post)
    setNewPost({
      titulo: post.titulo,
      contenido: post.contenido,
      tipo: post.tipo,
      imagen: post.imagen || ""
    })
    setIsModalOpen(true)
  }
  // eliminar publicación
  const handleDeletePost = async (postId: number) => {
    if (!confirm(t("confirmDeletePost"))) return
    const savedUser = localStorage.getItem("user");
    if (!savedUser) {
      toast.error(t("mustLogin"));
      return;
    }
    const token = JSON.parse(savedUser)?.token;
    if (!token) {
      toast.error(t("mustLogin"));
      return;
    }
    try {
      const res = await fetch(`http://localhost:8000/api/publicaciones/${postId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
      if (res.ok) {
        toast.success(t("postDeleted"))
        setPublicaciones(prev => prev.filter(p => p.id !== postId))
        if (comentariosAbiertos === postId) setComentariosAbiertos(null)
      } else {
        const error = await res.json()
        toast.error(error.detail || t("errorDeleting"))
      }
    } catch (error) {
      toast.error(t("connectionError"))
    }
  }
  // Editar comentario 
 const handleSaveEditedComment = async () => {
  if (!editedCommentText.trim() || !editingComment) return;
  const savedUser = localStorage.getItem("user");
  if (!savedUser) {
    toast.error(t("mustLogin"));
    return;
  }
  const token = JSON.parse(savedUser)?.token;
  if (!token) {
    toast.error(t("mustLogin"));
    return;
  }
  try {
    const res = await fetch(
      `http://localhost:8000/api/publicaciones/comentarios/${editingComment.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          contenido: editedCommentText
        })
      }
    );
    if (res.ok) {
      const updated = await res.json();
      setComentarios(prev => ({
        ...prev,
        [editingComment.id_publicacion]: (prev[editingComment.id_publicacion] || []).map(c =>
          c.id === editingComment.id ? { ...c, contenido: updated.contenido } : c
        )
      }));
      toast.success(t("commentUpdated") || "Comentario editado");
      setIsEditCommentModalOpen(false);
      setEditingComment(null);
      setEditedCommentText("");
    } else {
      const error = await res.json();
      toast.error(error.detail || t("errorUpdating"));
    }
  } catch (error) {
    toast.error(t("connectionError"));
  }
};
  // eliminar comentario
  const handleDeleteComment = async (commentId: number, postId: number) => {
    if (!confirm(t("confirmDeleteComment"))) return
    const savedUser = localStorage.getItem("user");
    if (!savedUser) {
      toast.error(t("mustLogin"));
      return;
    }
    const token = JSON.parse(savedUser)?.token;
    if (!token) {
      toast.error(t("mustLogin"));
      return;
    }
    try {
      const res = await fetch(`http://localhost:8000/api/publicaciones/comentarios/${commentId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
      if (res.ok) {
        toast.success(t("commentDeleted"))
        setComentarios(prev => ({
          ...prev,
          [postId]: (prev[postId] || []).filter(c => c.id !== commentId)
        }))
      } else {
        const error = await res.json()
        toast.error(error.detail || t("errorDeleting"))
      }
    } catch (error) {
      toast.error(t("connectionError"))
    }
  }
const handleEditComment = (comment: any) => {
  setEditingComment(comment);
  setEditedCommentText(comment.contenido);
  setIsEditCommentModalOpen(true);
};
  const cargarPerfiles = async (page: number = 1) => {
    try {
      const res = await fetch(`http://localhost:8000/public/perfiles?page=${page}&limit=${perfilesPerPage}`);
      if (!res.ok) throw new Error("Error al cargar perfiles");
      const data = await res.json();
      // Asume que tu backend ahora devuelve { items: [...], total, page, pages }
      // Si NO lo hace, y solo devuelve un array, quita esta condición:
      if (data.items !== undefined) {
        setPerfiles(data.items);
      } else {
        // Fallback si tu backend sigue devolviendo un array plano
        setPerfiles(Array.isArray(data) ? data.slice(0, perfilesPerPage) : []);
      }
    } catch (error) {
      console.error("Error al cargar perfiles:", error);
      toast.error("No se pudieron cargar los perfiles");
    }
  };
// Función para cargar y mostrar quién dio like a una publicación
// Esta función ahora abre el modal de Instagram
const handleVerLikes = async (postId: number) => {
  if (!user) {
    toast.error(t("mustLogin"));
    return;
  }
  const savedUser = localStorage.getItem("user");
  if (!savedUser) {
    toast.error(t("mustLogin"));
    return;
  }
  const token = JSON.parse(savedUser)?.token;
  if (!token) {
    toast.error(t("mustLogin"));
    return;
  }
  try {
    const res = await fetch(`http://localhost:8000/api/publicaciones/${postId}/likes`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    if (res.ok) {
      const likesData = await res.json();
      // Guardamos los datos en el estado
      setInstagramLikesData(likesData);
      setCurrentPostId(postId); // Guardamos el ID de la publicación actual
      setIsInstagramLikesModalOpen(true); // Abrimos el modal de Instagram
    } else {
      const error = await res.json();
      toast.error(error.detail || t("errorLoadingLikes"));
    }
  } catch (error) {
    console.error("Error al cargar likes:", error);
    toast.error(t("connectionError"));
  }
};

  // Handlers optimizados con useCallback
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);
  const handleRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);
  // Memoizar publicaciones renderizadas
  const renderedPosts = useMemo(() => {
    return publicaciones.map((post) => {
      const config = getTipoConfig(post.tipo);
      return (
        <Card key={post.id} className={`transition-colors ${isDark ? "bg-[#1E1E1E] border-[#2E2E2E]" : "bg-white border-gray-200"}`}>
          <CardContent className="p-6">
            <div className="flex gap-4">
              {/* Likes */}
                    {/* Si no es el autor, muestra el botón de like y el contador*/}
                    <div className="flex flex-col items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleLike(post.id)}
                        className={`transition-colors ${
                          userLikes[post.id] 
                            ? "text-blue-500 hover:text-blue-600" 
                            : isDark ? "text-[#A0A0A0] hover:text-white" : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        <Heart className="w-5 h-5" />
                      </Button>
                      <span className={`text-sm ${isDark ? "text-[#A0A0A0]" : "text-gray-600"} font-medium`}>
                        {likes[post.id] ?? 0}
                      </span>
                    </div>
              {/* Contenido */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-6 h-6 rounded-full ${config.color}`}></div>
                  <span className={`text-sm ${isDark ? "text-[#A0A0A0]" : "text-gray-600"}`}>r/{config.slug}</span>
                  <span className={`text-sm ${isDark ? "text-[#707070]" : "text-gray-500"}`}>
                    •{" "}
                    <Link
                      href={`/profile/${post.id_usuario}`}
                      className="text-gray-400 hover:underline hover:text-blue-300 transition-colors"
                      onClick={(e) => {
                        if (post.id_usuario === user?.id) {
                          e.preventDefault(); // No redirigir si es tu propio perfil (opcional)
                        }
                      }}
                    >
                      {post.usuario.nombre}
                    </Link>
                    {" • "}
                    {formatFecha(post.fecha_creacion)}
                  </span>
                </div>
                <h2 className={`text-xl font-semibold mb-3 ${isDark ? "text-[#F5F5F5]" : "text-gray-900"}`}>{post.titulo}</h2>
                <p className={`mb-4 ${isDark ? "text-[#D0D0D0]" : "text-gray-700"}`}>{post.contenido}</p>
                {post.imagen && (
                  <img src={post.imagen} alt="Publicación" className="w-full h-auto rounded-lg mb-4" />
                )}
                <div className={`flex gap-2 mb-4 ${isDark ? "text-[#A0A0A0]" : "text-gray-600"}`}>
                  <Badge className={`${config.color} text-white`}>#{config.slug}</Badge>
                </div>
                <div className={`flex items-center gap-4 text-sm ${isDark ? "text-[#A0A0A0]" : "text-gray-600"}`}>
                  <Button variant="ghost" size="sm" onClick={() => toggleComentarios(post.id)} className="transition-colors">
                    <MessageSquare className="w-4 h-4 mr-1" /> {comentarios[post.id]?.length || 0} {t("comments")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="transition-colors"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleShare(post.id)
                    }}
                  >
                    <Share className="w-4 h-4 mr-1" /> {t("share")}
                  </Button>
                  <Button variant="ghost" size="sm" className="transition-colors">
                    <Flag className="w-4 h-4 mr-1" /> {t("report")}
                  </Button>
                    {/* BOTONES DE EDITAR Y ELIMINAR (solo si es el autor) */}
                    {user && user.id === post.id_usuario && (
                      <div className="flex gap-1 ml-auto">
                        {/* Botón Ver Likes (ahora abre el modal de Instagram) */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="cursor-pointer text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 transition-colors rounded-md flex items-center gap-1"
                                onClick={(e) => {
                            e.stopPropagation();
                            handleVerLikes(post.id);
                          }}
                        >
                          <Users className="w-4 h-4" /> {t("viewLikes")}
                        </Button>
                        {/* Botón Editar */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="cursor-pointer text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 transition-colors rounded-md flex items-center gap-1"
                          onClick={() => handleEditPost(post)}
                        >
                          <Edit className="w-4 h-4 mr-1" /> {t("edit")}
                        </Button>
                        {/* Botón Eliminar */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors rounded-md"
                          onClick={() => handleDeletePost(post.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" /> {t("delete")}
                        </Button>
                      </div>
                    )}
                  {/* Menú de compartir */}
                  {showShareMenu === post.id && (
                    <div
                      className="fixed inset-0 z-50 flex items-center justify-center p-4"
                      onClick={() => setShowShareMenu(null)}
                    >
                      <div
                        className={`relative w-full max-w-md mx-auto rounded-xl shadow-lg border transform transition-all duration-200 ease-out scale-95 opacity-0 ${isDark ? "bg-[#1E1E1E] border-[#2E2E2E]" : "bg-white border-gray-200"}`}
                        style={{ animation: "fadeInUp 0.2s ease-out forwards" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className={`px-6 py-4 border-b ${isDark ? "border-[#2E2E2E]" : "border-gray-200"}`}>
                          <h3 className={`text-lg font-semibold ${isDark ? "text-[#F5F5F5]" : "text-gray-900"}`}>
                            {t("share")}
                          </h3>
                          <p className={`text-sm ${isDark ? "text-[#A0A0A0]" : "text-gray-600"} mt-1`}>
                            {t("choosePlatform")}
                          </p>
                        </div>
                        <div className="py-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              const text = encodeURIComponent(`Mira esta publicación: ${post.titulo}
${window.location.origin}/post/${post.id}`)
                              window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer')
                              setShowShareMenu(null)
                            }}
                            className={`flex items-center gap-3 w-full px-6 py-4 text-left transition-colors ${isDark ? "hover:bg-[#2E2E2E] hover:text-white" : "hover:bg-gray-50 hover:text-gray-900"} ${isDark ? "text-[#F5F5F5]" : "text-gray-900"}`}
                          >
                            <img src="/img/whatsapp.png" alt="WhatsApp" className="w-6 h-6" />
                            <span>WhatsApp</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              const url = encodeURIComponent(`${window.location.origin}/post/${post.id}`)
                              window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'noopener,noreferrer')
                              setShowShareMenu(null)
                            }}
                            className={`flex items-center gap-3 w-full px-6 py-4 text-left transition-colors ${isDark ? "hover:bg-[#2E2E2E] hover:text-white" : "hover:bg-gray-50 hover:text-gray-900"} ${isDark ? "text-[#F5F5F5]" : "text-gray-900"}`}
                          >
                            <img src="/img/facebook.png" alt="Facebook" className="w-6 h-6" />
                            <span>Facebook</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              const text = encodeURIComponent(post.titulo)
                              const url = encodeURIComponent(`${window.location.origin}/post/${post.id}`)
                              window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'noopener,noreferrer')
                              setShowShareMenu(null)
                            }}
                            className={`flex items-center gap-3 w-full px-6 py-4 text-left transition-colors ${isDark ? "hover:bg-[#2E2E2E] hover:text-white" : "hover:bg-gray-50 hover:text-gray-900"} ${isDark ? "text-[#F5F5F5]" : "text-gray-900"}`}
                          >
                            <img src="/img/twitter.png" alt="X" className="w-6 h-6" />
                            <span>X (Twitter)</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              const subject = encodeURIComponent(post.titulo)
                              const body = encodeURIComponent(`Te recomiendo esta publicación: ${window.location.origin}/post/${post.id}`)
                              window.open(`mailto:?subject=${subject}&body=${body}`, '_blank', 'noopener,noreferrer')
                              setShowShareMenu(null)
                            }}
                            className={`flex items-center gap-3 w-full px-6 py-4 text-left transition-colors ${isDark ? "hover:bg-[#2E2E2E] hover:text-white" : "hover:bg-gray-50 hover:text-gray-900"} ${isDark ? "text-[#F5F5F5]" : "text-gray-900"}`}
                          >
                            <img src="/img/email.png" alt="Email" className="w-6 h-6" />
                            <span>{t("shareByEmail")}</span>
                          </button>
                          <hr className={`my-2 border-t ${isDark ? "border-[#2E2E2E]" : "border-gray-200"}`} />
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`)
                              toast.success(t("linkCopied"))
                              setShowShareMenu(null)
                            }}
                            className={`flex items-center gap-3 w-full px-6 py-4 text-left font-medium transition-colors ${isDark ? "hover:bg-[#2E2E2E] hover:text-white" : "hover:bg-gray-50 hover:text-gray-900"} ${isDark ? "text-blue-400" : "text-blue-600"}`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <span>{t("copyLink")}</span>
                          </button>
                        </div>
                        <div className={`px-6 py-4 border-t ${isDark ? "border-[#2E2E2E]" : "border-gray-200"} text-right`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`text-sm ${isDark ? "text-[#A0A0A0] hover:text-white" : "text-gray-600 hover:text-gray-900"}`}
                            onClick={(e) => {
                              e.stopPropagation()
                              setShowShareMenu(null)
                            }}
                          >
                            {t("close")}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {/* Comentarios */}
                {comentariosAbiertos === post.id && (
                  <div className="mt-4 pt-4 border-t space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder={t("writeComment")}
                        value={nuevoComentario}
                        onChange={(e) => setNuevoComentario(e.target.value)}
                        className={isDark ? "bg-[#141414] text-[#F5F5F5]" : "bg-white text-gray-900"}
                      />
                      <Button 
                        onClick={() => handleComentar(post.id, post)}  className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {t("post")}
                      </Button>
                    </div>
                    {(comentarios[post.id] || []).map((com) => (
                      <div key={com.id} className="ml-4 border-l pl-4 py-2 relative">
                        <div className="flex items-center gap-2">
                          <img src={com.foto_perfil || "/img/user.png"} alt="" className="w-6 h-6 rounded-full" />
                          <span className="font-medium text-sm">{com.nombre_usuario}</span>
                          <span className="text-xs text-gray-500">{new Date(com.fecha).toLocaleDateString()}</span>
                          {/* BOTONES DE EDITAR Y ELIMINAR (solo si es el autor del comentario) */}
                          {user?.id === com.id_usuario && (
                            <div className="absolute right-0 top-0 flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50 h-6 w-6 p-0"
                                onClick={() => {
                                  setEditingComment(com);
                                  setEditedCommentText(com.contenido);
                                  setIsEditCommentModalOpen(true);
                                }}
                              >
                                ✏️
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-600 hover:bg-red-50 h-6 w-6 p-0"
                                onClick={() => handleDeleteComment(com.id, post.id)}
                              >
                                🗑️
                              </Button>
                            </div>
                          )}
                        </div>
                        <p className={`text-sm mt-1 ${isDark ? "text-[#D0D0D0]" : "text-gray-700"}`}>{com.contenido}</p>
                      </div>
                    ))}
                  </div>
                )}
                {/* Sección para mostrar quién dio like (solo visible si se han cargado) */}
                {/* Este bloque ya no se usa, porque lo reemplazamos por el modal de Instagram */}
                {/* {publicacionLikes[post.id] && publicacionLikes[post.id].length > 0 && (
                  <div className="mt-4 pt-4 border-t relative">
                    <button
                      onClick={() => {
                        setPublicacionLikes((prev) => {
                          const nuevoEstado = { ...prev };
                          delete nuevoEstado[post.id];
                          return nuevoEstado;
                        });
                      }}
                      className="absolute top-0 right-0 p-1 text-gray-500 hover:text-gray-700 transition-colors"
                      aria-label="Cerrar lista de likes"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <h4 className={`text-sm font-medium mb-2 ${isDark ? "text-[#F5F5F5]" : "text-gray-900"}`}>
                      {t("likedBy")}:
                    </h4>
                    <div className="space-y-2">
                      {publicacionLikes[post.id].map((likeUser) => (
                        <div key={likeUser.id} className="flex items-center gap-2">
                          <img
                            src={likeUser.foto_perfil || "/img/user.png"}
                            alt={likeUser.nombre}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <span className={`text-sm ${isDark ? "text-[#D0D0D0]" : "text-gray-700"}`}>
                            {likeUser.nombre}
                          </span>
                          <span className={`text-xs ${isDark ? "text-[#707070]" : "text-gray-500"}`}>
                            {formatFecha(likeUser.fecha_creacion)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )} */}
              </div>
            </div>
          </CardContent>
        </Card>
      );
    });
  }, [publicaciones, isDark, userLikes, likes, comentariosAbiertos, comentarios, nuevoComentario, showShareMenu, t, getTipoConfig, formatFecha, handleLike, toggleComentarios, handleComentar, handleShare, user?.id, handleEditPost, handleDeletePost, handleEditComment, handleDeleteComment]);

  // Resetear modal al cerrar
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingPost(null)
    setNewPost({ titulo: "", contenido: "", tipo: "Intercambio", imagen: "" })
  }

  // Función para cerrar el modal de Instagram
  const closeInstagramLikesModal = () => {
    setIsInstagramLikesModalOpen(false);
    setInstagramLikesData([]); // Limpiamos los datos cuando se cierra
    setCurrentPostId(null);
  };

  return (
    <>
      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: scale(0.9) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        /* Estilos para el modal de Instagram */
        .instagram-likes-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }
        .instagram-likes-modal-content {
          background: #242424;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
          width: 100%;
          max-width: 400px;
          max-height: 600px;
          overflow-y: auto;
        }
        .instagram-likes-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #333;
        }
        .instagram-likes-modal-title {
          font-size: 18px;
          font-weight: bold;
          color: white;
        }
        .instagram-likes-modal-close {
          background: none;
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
        }
        .instagram-likes-modal-list {
          padding: 16px 20px;
        }
        .instagram-likes-modal-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #333;
        }
        .instagram-likes-modal-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          object-fit: cover;
          margin-right: 12px;
        }
        .instagram-likes-modal-user-info {
          flex: 1;
          overflow: hidden;
        }
        .instagram-likes-modal-username {
          font-size: 14px;
          font-weight: bold;
          color: white;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .instagram-likes-modal-name {
          font-size: 12px;
          color: #aaa;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .instagram-likes-modal-view-profile-btn {
          background-color: #0095f6;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 6px 12px;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .instagram-likes-modal-view-profile-btn:hover {
          background-color: #0077b6;
        }
      `}</style>
      <div className={`min-h-screen relative overflow-hidden transition-colors duration-300 ${isDark ? "bg-[#141414] text-[#F5F5F5]" : "bg-gray-50 text-gray-900"}`}>
        <Toaster position="top-right" />
        {/* Botón Hamburguesa */}
        <div className="absolute top-4 left-4 md:hidden z-50">
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-gray-600 dark:text-gray-300">
            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>
        {/* Sidebar Izquierdo */}
        <div className="fixed left-0 top-0 bottom-0 w-64 z-40 h-screen">
          <MainSidebar
            isDark={isDark}
            toggleTheme={toggleTheme}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            user={user}
          />
        </div>
        {/* Main Content */}
        <main className="ml-64 mr-80 p-4 min-h-screen overflow-y-auto">
        {/* Tabs */}
        <div className="flex items-center gap-4 mb-6 border-b border-[#2E2E2E] pb-2">
          {/* Botón "Publicaciones" */}
          <Button
            variant={viewMode === "posts" ? "default" : "ghost"}
            size="sm"
            className={`cursor-pointer ${
              viewMode === "posts"
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "text-[#A0A0A0] hover:text-white hover:bg-[#2E2E2E]"
            }`}
            onClick={() => setViewMode("posts")}
          >
            {t("posts")}
          </Button>
            {/* Separador */}
              <div className="h-6 w-px bg-[#404040] mx-2"></div>
            {/* Botón "Perfiles" */}
            <Button
              variant={viewMode === "profiles" ? "default" : "ghost"}
              size="sm"
              className={`cursor-pointer ${
                viewMode === "profiles"
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "text-[#A0A0A0] hover:text-white hover:bg-[#2E2E2E]"
              }`}
              onClick={() => {
                setViewMode("profiles");
                if (perfiles.length === 0) {
                  cargarPerfiles();
                }
              }}
            >
              {t("profiles")}
            </Button>
            {/* Botón "+ Nueva Publicación" (solo visible en modo posts) */}
          {viewMode === "posts" && (
              <div className="ml-auto flex items-center gap-2">
                <Button
                  variant="default"
                  size="lg"
                  className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-lg flex items-center gap-2"
                  onClick={() => {
                    setEditingPost(null);
                    setNewPost({ titulo: "", contenido: "", tipo: "Intercambio", imagen: "" });
                    setIsModalOpen(true);
                  }}
                >
                  <PlusIcon className="w-5 h-5" /> {t("newPost")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="cursor-pointer text-gray-500 hover:text-gray-700"
                  onClick={handleRefresh}
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
          {/* Publicaciones */}
            {viewMode === "posts" ? (
              <div className="space-y-6">
                {publicaciones.length > 0 ? renderedPosts : (
                  <div className={`text-center py-10 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    {t("noPosts")}
                  </div>
                )}
              </div>
            ) : (
            <>
    {/* ✅ Grid de perfiles compactos */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {perfiles.map((perfil) => (
                      <Card
                        key={perfil.id}
                        className={`transition-colors ${isDark ? "bg-[#1E1E1E] border-[#2E2E2E]" : "bg-white border-gray-200"} rounded-lg overflow-hidden`}
                        style={{ height: "220px" }}
                      >
                        <CardContent className="p-4 h-full flex flex-col items-center text-center">
                          <img
                            src={perfil.foto_perfil || "/img/user.png"}
                            alt={perfil.nombre}
                            className="w-16 h-16 rounded-full object-cover mb-3"
                          />
                          <h3 className={`text-sm font-semibold truncate w-full ${isDark ? "text-[#F5F5F5]" : "text-gray-900"}`}>
                            {perfil.nombre}
                          </h3>
                          <p className={`text-xs mt-1 line-clamp-2 w-full ${isDark ? "text-[#D0D0D0]" : "text-gray-700"}`}>
                            {perfil.descripcion || t("noDescription")}
                          </p>
                          {perfil.ubicacion && (
                            <p className={`text-xs mt-1 ${isDark ? "text-[#A0A0A0]" : "text-gray-600"}`}>
                              📍 {perfil.ubicacion}
                            </p>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className={`mt-auto text-xs px-2 py-1 ${isDark ? "border-gray-700 text-gray-200 hover:bg-[#2E2E2E]" : "border-gray-300 text-gray-700 hover:bg-gray-100"}`}
                            onClick={() => router.push(`/profile/${perfil.id_usuario}`)}
                          >
                            {t("viewProfile")}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
    {/* paginación */}
                  {perfiles.length > 0 && (
                    <div className="flex justify-center gap-2 mt-6">
                      <Button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => {
                          const newPage = Math.max(1, p - 1);
                          cargarPerfiles(newPage);
                          return newPage;
                        })}
                        variant="outline"
                        size="sm"
                      >
                        ← {t("previous")}
                      </Button>
                      <span className={`px-3 py-1 rounded ${isDark ? "bg-[#2E2E2E]" : "bg-gray-100"}`}>
                        Página {currentPage}
                      </span>
                      <Button
                        onClick={() => setCurrentPage(p => {
                          const newPage = p + 1;
                          cargarPerfiles(newPage);
                          return newPage;
                        })}
                        variant="outline"
                        size="sm"
                      >
                        {t("next")} →
                      </Button>
                    </div>
                  )}
                  {perfiles.length === 0 && (
                    <div className={`text-center py-10 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                      {t("noProfiles")}
                    </div>
                  )}
                </>
              )}
</main>
        {/* Right Sidebar */}
                <aside className="fixed right-0 top-0 bottom-0 w-80 z-80 p-4 overflow-y-auto h-screen space-y-16">
          <Card className={`${isDark ? "bg-[#1E1E1E] border-[#2E2E2E]" : "bg-white border-gray-200"}`}>
            <CardContent className="p-4">
              <h3 className={`text-base font-semibold mb-3 flex items-center gap-2 space-y-4 ${isDark ? "text-[#F5F5F5]" : "text-gray-900"}`}>
                <TrendingUp className="w-4 h-4" /> {t("popularCourses")}
              </h3>
              {cursos.length === 0 ? (
                    <p className={`text-sm text-center mb-4 ${isDark ? "text-gray-500" : "text-gray-600"}`}>
                      ¡Próximamente más cursos emocionantes! 🚀
                    </p>
              ) : (
                <>
                  <div className="space-y-3 max-h-[360px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                    {cursos
                      .sort((a, b) => (b.inscritosCount || 0) - (a.inscritosCount || 0))
                      .slice(0, 8)
                      .map((curso, index) => {
                        const colores = [
                          "bg-blue-600",
                          "bg-red-600",
                          "bg-green-600",
                          "bg-purple-600",
                          "bg-yellow-600",
                          "bg-pink-600",
                          "bg-indigo-600",
                        ];
                        const color = colores[index % colores.length];
                        return (
                          <div
                            key={curso.id}
                            className={`flex items-center justify-between px-2 py-2 rounded-md border transition-all ${
                              isDark
                                ? "border-[#2E2E2E] hover:bg-[#2C2C2C]"
                                : "border-gray-200 hover:bg-gray-50"
                            }`}
                          >
                            <div className="flex items-center gap-3 w-full">
                              <div
                                className={`flex-shrink-0 w-9 h-9 ${color} rounded-full flex items-center justify-center text-white font-bold`}
                              >
                                {curso.titulo.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex flex-col justify-center overflow-hidden space-y-3 w-[65%]">
                                <span
                                  className={`text-sm font-medium truncate ${
                                    isDark ? "text-[#F5F5F5]" : "text-gray-900"
                                  }`}
                                >
                                  {curso.titulo}
                                </span>
                                <span
                                  className={`text-xs ${
                                    isDark ? "text-gray-400" : "text-gray-600"
                                  }`}
                                >
                                  {curso.inscritosCount
                                    ? `${curso.inscritosCount} inscritos`
                                    : "0 inscritos"}
                                </span>
                              </div>
                              {/* 🔘 Botón Join */}
                              <Button
                                onClick={() =>
                                  router.push(`/Cursos/community_courses?cursoId=${curso.id}`)
                                }
                                size="sm"
                                className="cursor-pointer ml-auto bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1"
                              >
                                {t("join")}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                  {/* Mostrar mensaje si hay menos de 8 cursos */}
                  {cursos.length < 8 && (
                    <p className={`mt-3 text-center text-sm ${isDark ? "text-gray-500" : "text-gray-600"}`}>
                      ¡Próximamente más cursos emocionantes! 🚀
                    </p>
                  )}
                  {/* Botón que nos va a redirigir al apartado de cursos */}
                  <div className="mt-4 flex justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push("/Cursos/community_courses")}
                      className={`${
                        isDark
                          ? "cursor-pointer border-gray-700 text-gray-200 hover:bg-[#2E2E2E]"
                          : "border-gray-300 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      Ver más cursos
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          <Card className={`${isDark ? "bg-[#1E1E1E] border-[#2E2E2E]" : "bg-white border-gray-200"} `}>
            <CardContent className="p-6 ">
              <h3 className={`text-base font-semibold mb-6 ${isDark ? "text-[#F5F5F5]" : "text-gray-900"}`}>
                {t("yourStats")}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div className={`p-2 rounded-lg text-center ${isDark ? "bg-[#141414]" : "bg-gray-100"}`}>
                  <div className="text-xl font-bold text-blue-400">12</div>
                  <div className={`text-xs uppercase ${isDark ? "text-[#A0A0A0]" : "text-gray-600"}`}>{t("exchanges")}</div>
                </div>
                <div className={`p-3 rounded-lg text-center ${isDark ? "bg-[#141414]" : "bg-gray-100"}`}>
                  <div className="text-xl font-bold text-green-400">23</div>
                  <div className={`text-xs uppercase ${isDark ? "text-[#A0A0A0]" : "text-gray-600"}`}>{t("courses")}</div>
                </div>
                <div className={`p-3 rounded-lg text-center ${isDark ? "bg-[#141414]" : "bg-gray-100"}`}>
                  <div className="text-xl font-bold text-yellow-400">4.8</div>
                  <div className={`text-xs uppercase ${isDark ? "text-[#A0A0A0]" : "text-gray-600"}`}>{t("messages")}</div>
                </div>
                <div className={`p-2 rounded-lg text-center ${isDark ? "bg-[#141414]" : "bg-gray-100"}`}>
                  <div className="text-xl font-bold text-purple-400">23</div>
                  <div className={`text-xs uppercase ${isDark ? "text-[#A0A0A0]" : "text-gray-600"}`}>{t("review")}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>
        {/* Modal Nueva Publicación / Editar Publicación */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className={`w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden ${isDark ? "bg-[#1E1E1E]" : "bg-white"}`}>
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className={`text-xl font-semibold ${isDark ? "text-[#F5F5F5]" : "text-gray-900"}`}>
                  {editingPost ? t("editPost") : t("newPost")}
                </h2>
                <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <select
                  value={newPost.tipo}
                  onChange={(e) => setNewPost({ ...newPost, tipo: e.target.value })}
                  className={`w-full p-2 rounded-lg border ${isDark ? "bg-[#141414] border-[#2E2E2E] text-[#F5F5F5]" : "bg-white border-gray-300 text-gray-900"}`}
                >
                  <option value="Intercambio">{t("postTypeExchanges")}</option>
                  <option value="Curso">{t("postTypeCourses")}</option>
                  <option value="Pregunta">{t("postTypeQuestions")}</option>
                  <option value="Logro">{t("postTypeAchievements")}</option>
                </select>
                <input
                  type="text"
                  placeholder={`${t("title")}...`}
                  value={newPost.titulo}
                  onChange={(e) => setNewPost({ ...newPost, titulo: e.target.value })}
                  className={`w-full p-2 rounded-lg border ${isDark ? "bg-[#141414] border-[#2E2E2E] text-[#F5F5F5]" : "bg-white border-gray-300 text-gray-900"}`}
                />
                <textarea
                  rows={6}
                  placeholder={t("writeComment")}
                  value={newPost.contenido}
                  onChange={(e) => setNewPost({ ...newPost, contenido: e.target.value })}
                  className={`w-full p-2 rounded-lg border ${isDark ? "bg-[#141414] border-[#2E2E2E] text-[#F5F5F5]" : "bg-white border-gray-300 text-gray-900"}`}
                />
                <input
                  type="text"
                  placeholder="URL de la imagen (opcional)"
                  value={newPost.imagen}
                  onChange={(e) => setNewPost({ ...newPost, imagen: e.target.value })}
                  className={`w-full p-2 rounded-lg border ${isDark ? "bg-[#141414] border-[#2E2E2E] text-[#F5F5F5]" : "bg-white border-gray-300 text-gray-900"}`}
                />
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={handleCloseModal}>{t("cancel")}</Button>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleCreatePost}>
                    {editingPost ? t("saveChanges") : t("post")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        {isEditCommentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className={`w-full max-w-lg rounded-xl shadow-2xl overflow-hidden ${isDark ? "bg-[#1E1E1E]" : "bg-white"}`}>
              <div className="p-4 border-b flex justify-between items-center">
                <h2 className={`text-lg font-semibold ${isDark ? "text-[#F5F5F5]" : "text-gray-900"}`}>
                  {t("editComment") || "Editar comentario"}
                </h2>
                <button onClick={() => setIsEditCommentModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <textarea
                  rows={5}
                  value={editedCommentText}
                  onChange={(e) => setEditedCommentText(e.target.value)}
                  className={`w-full p-3 rounded-lg border ${isDark ? "bg-[#141414] border-[#2E2E2E] text-[#F5F5F5]" : "bg-white border-gray-300 text-gray-900"}`}
                />
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setIsEditCommentModalOpen(false)}>
                    {t("cancel") || "Cancelar"}
                  </Button>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSaveEditedComment}>
                    {t("saveChanges") || "Guardar cambios"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Likes */}
        {isInstagramLikesModalOpen && (
          <div className="instagram-likes-modal">
            <div className="instagram-likes-modal-content">
              <div className="instagram-likes-modal-header">
                <h3 className="instagram-likes-modal-title">Likes</h3>
                <button className="instagram-likes-modal-close" onClick={closeInstagramLikesModal}>×</button>
              </div>
              <div className="instagram-likes-modal-list">
                {instagramLikesData.length > 0 ? (
                  instagramLikesData.map((likeUser) => (
                    <div key={likeUser.id} className="instagram-likes-modal-item">
                      <div className="instagram-likes-modal-user-info">
                        <img
                          src={likeUser.foto_perfil || "/img/user.png"}
                          alt={likeUser.nombre}
                          className="instagram-likes-modal-avatar"
                        />
                        <div>
                          {/* Nombre de usuario y nombre completo en la misma línea */}
                          <div className="instagram-likes-modal-username">{likeUser.nombre_usuario}</div>
                          <div className="instagram-likes-modal-name">{likeUser.nombre}</div>
                        </div>
                      </div>
                      {/* Botón "Ver perfil" que redirige */}
                      <button
                        className="instagram-likes-modal-view-profile-btn"
                        onClick={() => router.push(`/profile/${likeUser.id_usuario}`)}
                      >
                        Ver perfil
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-400 py-4">No hay likes aún.</p>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  )
}
export default function ForumLayout() {
  return (
    <ProtectedRoute>
      <ForumLayoutComponent />
    </ProtectedRoute>
  )
}