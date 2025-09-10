"use client"

import { useTranslation } from "../../lib/useTranslations"
import { useState, useEffect } from "react"
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
} from "lucide-react"

export default function ForumLayout() {
  const router = useRouter()
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState(t("postTypeExchanges"))
  const [isDark, setIsDark] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [perfil, setPerfil] = useState<any>(null)

  // Estados para publicaciones y comentarios
  const [publicaciones, setPublicaciones] = useState<any[]>([])
  const [likes, setLikes] = useState<Record<number, number>>({})
  const [userLikes, setUserLikes] = useState<Record<number, boolean>>({})
  const [comentarios, setComentarios] = useState<Record<number, any[]>>({})
  const [comentariosAbiertos, setComentariosAbiertos] = useState<number | null>(null)
  const [nuevoComentario, setNuevoComentario] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newPost, setNewPost] = useState({
    titulo: "",
    contenido: "",
    tipo: "Intercambio",
    imagen: ""
  })

  // Cargar usuario desde localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem("user")
    if (savedUser) {
      const parsed = JSON.parse(savedUser)
      setUser(parsed.usuario || { id: parsed.id, nombre: parsed.nombre })
      setPerfil(parsed.perfil)
    }
  }, [])

  // Cargar publicaciones al cambiar de pestaña
  useEffect(() => {
    const fetchPublicaciones = async () => {
      try {
        const tipo = activeTab === t("todo") ? "all" : newPost.tipo
        const res = await fetch(`http://localhost:8000/api/publicaciones/${tipo}`)
        const data = await res.json()
        const posts = Array.isArray(data) ? data : []

        setPublicaciones(posts)

        // Inicializar likes
        const likesMap: Record<number, number> = {}
        const userLikesMap: Record<number, boolean> = {}
        posts.forEach((post: any) => {
          likesMap[post.id] = post.likes?.length || 0
          userLikesMap[post.id] = post.likes?.some((like: any) => like.id_usuario === user?.id) || false
        })
        setLikes(likesMap)
        setUserLikes(userLikesMap)
      } catch (error) {
        console.error("Error al cargar publicaciones:", error)
        toast.error(t("errorLoading"))
      }
    }

    fetchPublicaciones()
  }, [activeTab])

  const toggleTheme = () => setIsDark(!isDark)

  // Manejar like
  const handleLike = async (postId: number) => {
    if (!user) {
      toast.error(t("mustLogin"))
      return
    }

    try {
      const token = JSON.parse(localStorage.getItem("user")!).token
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
    } catch (error) {
      toast.error(t("likeError"))
    }
  }

  // Manejar comentarios
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

  // Comentar
  const handleComentar = async (postId: number) => {
    if (!nuevoComentario.trim()) return

    try {
      const token = JSON.parse(localStorage.getItem("user")!).token
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
        toast.success(t("commentPosted"))
      } else {
        const error = await res.json()
        toast.error(error.detail || t("errorPosting"))
      }
    } catch (error) {
      toast.error(t("connectionError"))
    }
  }

  const [showShareMenu, setShowShareMenu] = useState<number | null>(null)

  const handleShare = (postId: number) => {
    setShowShareMenu(showShareMenu === postId ? null : postId)
  }

  const copyLink = (postId: number) => {
    const postUrl = `${window.location.origin}/post/${postId}`
    navigator.clipboard.writeText(postUrl)
    toast.success(t("linkCopied"))
    setShowShareMenu(null)
  }

  // Crear nueva publicación
  const handleCreatePost = async () => {
    if (!newPost.titulo.trim() || !newPost.contenido.trim()) {
      toast.error("Completa título y contenido")
      return
    }

    const savedUser = localStorage.getItem("user")
    if (!savedUser) {
      toast.error("No tienes una sesión activa")
      return
    }

    const parsedUser = JSON.parse(savedUser)
    const token = parsedUser.token
    const usuario = { id: parsedUser.id, nombre: parsedUser.nombre }
    const perfil = parsedUser.perfil

    try {
      const res = await fetch("http://localhost:8000/api/publicaciones", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newPost,
          id_usuario: usuario.id,
          id_perfil: perfil?.id || null
        }),
      })

      if (res.ok) {
        toast.success("Publicación creada")
        setIsModalOpen(false)
        setNewPost({ titulo: "", contenido: "", tipo: "Intercambios", imagen: "" })

        const updated = await fetch(`http://localhost:8000/api/publicaciones/${activeTab}`)
        const data = await updated.json()
        setPublicaciones(Array.isArray(data) ? data : [])
      } else {
        const error = await res.json()
        toast.error(error.detail || "Error al crear publicación")
      }
    } catch (error) {
      toast.error("Error de conexión con el servidor")
    }
  }

  const formatFecha = (fechaStr: string) => {
    const fecha = new Date(fechaStr)
    const ahora = new Date()
    const diffMs = ahora.getTime() - fecha.getTime()
    const diffMin = Math.floor(diffMs / (1000 * 60))
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60))

    if (diffMin < 1) return t("justNow")
    if (diffMin < 60) return `${diffMin} ${t("minutesAgo")}`
    if (diffHrs < 24) return `${diffHrs} ${t("hoursAgo")}`
    return fecha.toLocaleDateString()
  }

  return (
    <>
      {/* Animación para el menú de compartir */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>

      <div className={`min-h-screen flex transition-colors duration-300 ${isDark ? "bg-[#141414] text-[#F5F5F5]" : "bg-gray-50 text-gray-900"}`}>
        <Toaster position="top-right" />

        {/* Botón Hamburguesa */}
        <div className="absolute top-4 left-4 md:hidden z-50">
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-gray-600 dark:text-gray-300">
            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>

        {/* Sidebar Izquierdo */}
        <div className={`fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:static md:flex flex-col border-r ${isDark ? "bg-[#1E1E1E] border-[#2E2E2E]" : "bg-white border-gray-200"}`}>
          <div className={`p-3 border-b ${isDark ? "border-[#2E2E2E]" : "border-gray-200"}`}>
            <div className="flex items-center gap-2 mb-3">
              <img src="/img/logoswapk.png" alt="Swapk Logo" className="w-7 h-auto" />
              <span className={`text-sm ${isDark ? "text-[#F5F5F5]" : "text-gray-700"}`}>SWAPK</span>
              <Button variant="ghost" size="sm" onClick={toggleTheme} className={`ml-auto h-6 w-6 p-0 ${isDark ? "text-[#A0A0A0] hover:bg-[#2E2E2E]" : "text-gray-600 hover:text-gray-900"}`}>
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
            </div>

            <div className="relative mb-3">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-[#A0A0A0]" : "text-gray-500"}`} />
              <Input placeholder={t("search")} className={`pl-10 w-full h-8 border-none shadow-none focus-visible:ring-0 cursor-pointer ${isDark ? "bg-[#1E1E1E] text-[#F5F5F5] placeholder-[#A0A0A0]" : "bg-gray-100 text-gray-900 placeholder-gray-500"}`} />
            </div>

            <div className="flex gap-1 mb-3">
              {[
                { icon: MessageSquare, label: t("messages"), href: "/message/messages" },
                { icon: Bell, label: t("notifications"), href: "/notifications" },
                { icon: User, label: t("profile"), href: "/profile/profile" },
                { icon: Settings, label: t("settings"), href: "/settings/profile_edit" },
              ].map(({ icon: Icon, label, href }, idx) => (
                <Button
                  key={idx}
                  variant="ghost"
                  size="sm"
                  className={`flex-1 h-8 cursor-pointer ${isDark ? "text-[#A0A0A0] hover:bg-[#2E2E2E]" : "text-gray-600 hover:text-gray-900"}`}
                  onClick={() => href && router.push(href)}
                  title={label} // Tooltip útil
                >
                  <Icon className="w-4 h-4" />
                </Button>
              ))}
            </div>

            <nav className="space-y-1">
              {[
                { icon: Home, label: t("home"), active: true },
                { icon: TrendingUp, label: t("popular"), active: false },
                { icon: RefreshCw, label: t("exchanges"), active: false },
                { icon: BookOpen, label: t("myCourses"), active: false },
              ].map((item, idx) => (
                <Button key={idx} variant="ghost" size="sm" className={`w-full justify-start h-8 cursor-pointer transition-colors ${item.active ? "bg-blue-600 text-white hover:bg-blue-700" : isDark ? "text-[#A0A0A0] hover:bg-[#2E2E2E]" : "text-gray-700 hover:bg-gray-100"}`}>
                  <item.icon className="w-4 h-4 mr-2" /> {item.label}
                </Button>
              ))}
            </nav>
          </div>

          {/* Botón Cerrar Sesión */}
          <div className={`mt-auto p-3 border-t ${isDark ? "border-[#2E2E2E]" : "border-gray-200"}`}>
            <Button
              variant="ghost"
              className={`w-full justify-start ${isDark ? "text-red-400 hover:bg-red-900 hover:text-white" : "text-red-600 hover:bg-red-100 hover:text-red-800"} transition-colors duration-200 cursor-pointer`}
              onClick={() => {
                localStorage.removeItem("user")
                setUser(null)
                setPerfil(null)
                toast.success(t("sessionClosed"))
                setTimeout(() => router.push("/auth/login"), 1000)
              }}
            >
              {t("logout")}
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-4">
          {/* Tabs */}
          <div className="flex gap-5 mb-6">
            {[t("todo"), t("postTypeExchanges"), t("postTypeCourses"), t("postTypeQuestions"), t("postTypeAchievements")].map((tab) => (
              <Button
                key={tab}
                variant={activeTab === tab ? "default" : "ghost"}
                size="sm"
                className={`cursor-pointer transition-colors ${activeTab === tab ? "bg-blue-600 text-white" : isDark ? "text-[#A0A0A0]" : "text-gray-600"}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </Button>
            ))}
            {/* Botón Nueva Publicación */}
            <div className="flex justify-end mb-2">
              <Button
                variant="default"
                size="lg"
                className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-lg flex items-center gap-2"
                onClick={() => setIsModalOpen(true)}
              >
                <PlusIcon className="w-5 h-5" /> {t("newPost")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="cursor-pointer ml-2 text-gray-500 hover:text-gray-700"
                onClick={async () => {
                  const tipo = activeTab === t("todo") ? "all" : newPost.tipo
                  try {
                    const res = await fetch(`http://localhost:8000/api/publicaciones/${tipo}`)
                    const data = await res.json()
                    setPublicaciones(Array.isArray(data) ? data : [])
                    toast.success(t("postsUpdated"))
                  } catch (error) {
                    toast.error(t("errorLoading"))
                  }
                }}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Publicaciones */}
          <div className="space-y-6">
            {publicaciones.length > 0 ? (
              publicaciones.map((post) => (
                <Card key={post.id} className={`transition-colors ${isDark ? "bg-[#1E1E1E] border-[#2E2E2E]" : "bg-white border-gray-200"}`}>
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      {/* Likes */}
                      <div className="flex flex-col items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleLike(post.id)} className={`transition-colors ${userLikes[post.id] ? "text-blue-500" : isDark ? "text-[#A0A0A0]" : "text-gray-600"}`}>
                          <ChevronUp className="w-5 h-5" />
                        </Button>
                        <span className={`text-lg font-semibold ${isDark ? "text-[#F5F5F5]" : "text-gray-900"}`}>{likes[post.id] ?? 0}</span>
                        <Button variant="ghost" size="icon" className={`transition-colors ${isDark ? "text-[#A0A0A0]" : "text-gray-600"}`}>
                          <ChevronDown className="w-5 h-5" />
                        </Button>
                      </div>

                      {/* Contenido */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-6 h-6 rounded-full ${post.tipo === "Intercambios" ? "bg-green-600" : post.tipo === "Cursos" ? "bg-blue-600" : post.tipo === "Pregunta" ? "bg-yellow-600" : "bg-purple-600"}`}></div>
                          <span className={`text-sm ${isDark ? "text-[#A0A0A0]" : "text-gray-600"}`}>r/{post.tipo.toLowerCase()}</span>
                          <span className={`text-sm ${isDark ? "text-[#707070]" : "text-gray-500"}`}>• {post.usuario.nombre} • {formatFecha(post.fecha)}</span>
                        </div>

                        <h2 className={`text-xl font-semibold mb-3 ${isDark ? "text-[#F5F5F5]" : "text-gray-900"}`}>{post.titulo}</h2>
                        <p className={`mb-4 ${isDark ? "text-[#D0D0D0]" : "text-gray-700"}`}>{post.contenido}</p>

                        {post.imagen && (
                          <img src={post.imagen} alt="Publicación" className="w-full h-auto rounded-lg mb-4" />
                        )}

                        <div className={`flex gap-2 mb-4 ${isDark ? "text-[#A0A0A0]" : "text-gray-600"}`}>
                          <Badge className="bg-blue-600 text-white">#{post.tipo.toLowerCase()}</Badge>
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
                                      const text = encodeURIComponent(`Mira esta publicación: ${post.titulo}\n${window.location.origin}/post/${post.id}`)
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
                          <Button variant="ghost" size="sm" className="transition-colors">
                            <Flag className="w-4 h-4 mr-1" /> {t("report")}
                          </Button>
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
                              <Button onClick={() => handleComentar(post.id)} className="bg-blue-600 hover:bg-blue-700 text-white">
                                {t("post")}
                              </Button>
                            </div>
                            {(comentarios[post.id] || []).map((com) => (
                              <div key={com.id} className="ml-4 border-l pl-4">
                                <div className="flex items-center gap-2">
                                  <img src={com.foto_perfil} alt="" className="w-6 h-6 rounded-full" />
                                  <span className="font-medium text-sm">{com.nombre_usuario}</span>
                                  <span className="text-xs text-gray-500">{new Date(com.fecha).toLocaleDateString()}</span>
                                </div>
                                <p className={`text-sm mt-1 ${isDark ? "text-[#D0D0D0]" : "text-gray-700"}`}>{com.contenido}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className={`text-center py-10 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                {t("noPosts")}
              </div>
            )}
          </div>
        </main>

        {/* Right Sidebar */}
        <aside className={`w-82 p-4 border-l ${isDark ? "border-[#2E2E2E]" : "border-gray-200"}`}>
          <Card className={`mb-4 ${isDark ? "bg-[#1E1E1E] border-[#2E2E2E]" : "bg-white border-gray-200"}`}>
            <CardContent className="p-3">
              <h3 className={`text-base font-semibold mb-3 flex items-center gap-2 ${isDark ? "text-[#F5F5F5]" : "text-gray-900"}`}>
                <TrendingUp className="w-4 h-4" /> {t("popularCourses")}
              </h3>
              <div className="space-y-7">
                {[
                  { name: "r/IntercambioIdiomas", members: "45.2k miembros", color: "bg-green-600" },
                  { name: "r/ProgramaciónPython", members: "38.1k miembros", color: "bg-blue-600" },
                  { name: "r/DiseñoGráfico", members: "29.5k miembros", color: "bg-yellow-600" },
                  { name: "r/CursosGratuitos", members: "52.3k miembros", color: "bg-purple-600" },
                  { name: "r/MarketingDigital", members: "31.7k miembros", color: "bg-red-600" },
                  { name: "r/FotografíaBásica", members: "24.9k miembros", color: "bg-indigo-600" },
                ].map((c, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 ${c.color} rounded-full`}></div>
                      <div>
                        <div className={`text-sm font-medium ${isDark ? "text-[#F5F5F5]" : "text-gray-900"}`}>{c.name}</div>
                        <div className={`text-xs ${isDark ? "text-[#A0A0A0]" : "text-gray-600"}`}>{c.members}</div>
                      </div>
                    </div>
                    <Button size="sm" className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1">
                      {t("join")}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className={`${isDark ? "bg-[#1E1E1E] border-[#2E2E2E]" : "bg-white border-gray-200"}`}>
            <CardContent className="p-3">
              <h3 className={`text-base font-semibold mb-3 ${isDark ? "text-[#F5F5F5]" : "text-gray-900"}`}>
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
                  <div className={`text-xs uppercase ${isDark ? "text-[#A0A0A0]" : "text-gray-600"}`}>{t("rating")}</div>
                </div>
                <div className={`p-2 rounded-lg text-center ${isDark ? "bg-[#141414]" : "bg-gray-100"}`}>
                  <div className="text-xl font-bold text-purple-400">23</div>
                  <div className={`text-xs uppercase ${isDark ? "text-[#A0A0A0]" : "text-gray-600"}`}>{t("connections")}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Modal Nueva Publicación */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className={`w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden ${isDark ? "bg-[#1E1E1E]" : "bg-white"}`}>
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className={`text-xl font-semibold ${isDark ? "text-[#F5F5F5]" : "text-gray-900"}`}>{t("newPost")}</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <select
                  value={newPost.tipo}
                  onChange={(e) => setNewPost({ ...newPost, tipo: e.target.value })}
                  className={`w-full p-2 rounded-lg border ${isDark ? "bg-[#141414] border-[#2E2E2E] text-[#F5F5F5]" : "bg-white border-gray-300 text-gray-900"}`}
                >
                  <option value="Intercambios">{t("postTypeExchanges")}</option>
                  <option value="Cursos">{t("postTypeCourses")}</option>
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
                  <Button variant="outline" onClick={() => setIsModalOpen(false)}>{t("cancel")}</Button>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleCreatePost}>{t("post")}</Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}