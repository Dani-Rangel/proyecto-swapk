"use client"

import { useTranslation } from "../lib/useTranslations"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import toast, { Toaster } from 'react-hot-toast'
import Image from "next/image"
import { FaWhatsapp, FaInstagram, FaFacebook, FaGlobe } from "react-icons/fa"
import {
  X,
  Search,
  FileText,
  Handshake,
  HomeIcon,
  Star,
  Camera,
  Plus,
  Settings,
  LogOut,
  User,
  Bell,
  MessageSquare,
  Eye,
  Edit,
  MapPin,
  Menu,
  TrendingUp,
  RefreshCw,
  Home,
  BookOpen,
  Moon,
  Sun
} from "lucide-react"

interface Testimonial {
  id: number
  name: string
  role: string
  image: string
  text: string
  rating: number
}

export default function SwapkLanding() {
  const [isDark, setIsDark] = useState<boolean>(true)
  const { t } = useTranslation()
  const [isMobile, setIsMobile] = useState(false)
  const [currentTestimonial, setCurrentTestimonial] = useState<number>(0)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false)

  const testimonials: Testimonial[] = [
    {
      id: 1,
      name: "Ana Martínez",
      role: "Estudiante de Diseño Gráfico",
      image: "/img/cat_profile.jpg",
      text: "transformó mi manera de aprender! Los cursos son dinámicos y los instructores realmente dominan su tema. Ahora aplico habilidades que nunca creí posible desarrollar... ¡y todo gracias a esta comunidad!",
      rating: 5,
    },
    {
      id: 2,
      name: "Carlos Rodriguez",
      role: "Desarrollador Web",
      image: "/img/fox_profile.jpg",
      text: "me permitió intercambiar mis conocimientos de programación por clases de marketing digital. Una experiencia increíble que me ayudó a crecer profesionalmente.",
      rating: 5,
    },
    {
      id: 3,
      name: "María González",
      role: "Profesora de Idiomas",
      image: "/img/men_profile.jpg",
      text: "me ayudó a encontrar estudiantes increíbles que me enseñaron diseño mientras yo les enseñaba inglés. Hace posible el intercambio justo de conocimientos.",
      rating: 5,
    },
  ]

  const nextTestimonial = (): void => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
  }

  const prevTestimonial = (): void => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  const goToTestimonial = (index: number): void => {
    setCurrentTestimonial(index)
  }

  useEffect(() => {
    const interval = setInterval(nextTestimonial, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Searching:", searchQuery)
  }

  const router = useRouter()

  const handleLoginClick = (): void => {
    router.push("/auth/login")
  }

  const handleSignupClick = (): void => {
    router.push("/auth/register")
  }

  const handleJoinClick = (): void => {
    router.push("/auth/register")
  }

  const handleHowItWorksClick = (): void => {
    console.log("How it works clicked")
  }

  const handleFindExchangeClick = (): void => {
    console.log("Find exchange clicked")
  }

  const handleLearnMoreClick = (): void => {
    console.log("Learn more about mission clicked")
  }

  const handleDiscoverGoalsClick = (): void => {
    console.log("Discover goals clicked")
  }

  // Toggle theme and save to localStorage
  const toggleTheme = () => {
    const newTheme = !isDark
    setIsDark(newTheme)
    localStorage.setItem('theme', newTheme ? 'dark' : 'light')
  }

  // Detect initial theme from localStorage or prefers-color-scheme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDark(true)
    } else {
      setIsDark(false)
    }
  }, [])

  // Detect screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <div className="min-h-screen flex">

      {/* Sidebar Izquierdo — FIJO Y VISIBLE SIEMPRE */}
      <div
        className={`fixed top-0 left-0 min-h-screen z-50 w-52 transform transition-transform duration-300 
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} 
        md:translate-x-0 md:static 
        flex flex-col border-r
        ${isDark ? "bg-[#181717] border-[#121212]" : "bg-white border-gray-200"}
        `}
      >
        <div className={`p-3 border-b ${isDark ? "border-[#2E2E2E]" : "border-gray-200"}`}>
          <div className="flex items-center gap-2 mb-6">
            <img src="/img/logoswapk.png" alt="Swapk Logo" className="w-7 h-auto" />
            <span className={`text-sm ${isDark ? "text-[#F5F5F5]" : "text-gray-700"}`}>SWAPK</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className={`ml-auto h-6 w-6 p-0 ${
                isDark ? "text-[#A0A0A0] hover:bg-[#2E2E2E]" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
          </div>

          <div className="relative mb-8">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-[#A0A0A0]" : "text-gray-500"}`} />
            <Input
              placeholder={t("search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-10 w-full h-8 border-none shadow-none focus-visible:ring-0 cursor-pointer ${
                isDark 
                  ? "bg-[#1E1E1E] text-[#F5F5F5] placeholder-[#A0A0A0]" 
                  : "bg-gray-100 text-gray-900 placeholder-gray-500"
              }`}
            />
          </div>

          {/* Redes Sociales */}
          <div className="flex gap-1 mb-7">
            {[
              { icon: FaWhatsapp, label: t("whatsapp"), href: "https://wa.me/YOURNUMBER" },
              { icon: FaInstagram, label: t("instagram"), href: "https://instagram.com/tu_usuario" },
              { icon: FaFacebook, label: t("facebook"), href: "https://www.facebook.com/profile.php?id=XXXXXXXXXX" },
              { icon: FaGlobe, label: t("website"), href: "https://tusitio.com" },
            ].map(({ icon: Icon, label, href }, idx) => (
              <Button
                key={idx}
                variant="ghost"
                size="sm"
                className={`flex-1 h-8 cursor-pointer ${
                  isDark ? "text-[#A0A0A0] hover:bg-[#2E2E2E]" : "text-gray-600 hover:text-gray-900"
                }`}
                onClick={(e) => {
                  e.preventDefault()
                  window.open(href, "_blank", "noopener,noreferrer")
                }}
                title={label}
              >
                <Icon className="w-4 h-4" />
              </Button>
            ))}
          </div>

          <nav className="space-y-3">
            {[
              { icon: Home, label: t("home"), active: true, href: "home" },
              { icon: TrendingUp, label: t("services"), active: false, href: "how-it-works" },
              { icon: RefreshCw, label: t("mission_vision"), active: false, href: "mission" },
              { icon: BookOpen, label: t("testimonials"), active: false, href: "testimonials" },
            ].map((item, idx) => (
              <Button
                key={idx}
                variant="ghost"
                size="sm"
                className={`w-full justify-start h-8 cursor-pointer transition-colors ${
                  item.active
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : isDark
                    ? "text-[#A0A0A0] hover:bg-[#2E2E2E]"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  const element = document.getElementById(item.href);
                  if (element) {
                    element.scrollIntoView({ behavior: "smooth", block: "start" });
                    // Opcional: actualiza el hash en la URL
                    window.location.hash = item.href;
                  }
                }}
              >
                <item.icon className="w-4 h-4 mr-2" /> {item.label}
              </Button>
            ))}
          </nav>
        </div>

        {/* Botones auth */}
        <div className="flex flex-col gap-3 mt-auto px-3 pb-6">
          <button
            className="cursor-pointer bg-transparent text-white border border-gray-600 px-5 py-3 rounded-lg font-semibold hover:border-blue-600 hover:text-blue-600 transition-all"
            onClick={handleLoginClick}
          >
            Iniciar Sesión
          </button>
          <button
            className="cursor-pointer bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-3 rounded-lg font-semibold hover:from-blue-500 hover:to-blue-600 hover:shadow-lg hover:shadow-blue-600/30 transition-all"
            onClick={handleSignupClick}
          >
            Crea cuenta gratis
          </button>
        </div>
      </div>

      {/* Botón Hamburguesa (solo móvil) */}
      <div className="absolute top-4 left-4 md:hidden z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={isDark ? "text-gray-300" : "text-gray-700"}
        >
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
      </div>

      {/* Contenido Principal */}
      <div 
        className={`flex-1 overflow-y-auto h-screen transition-all duration-300 ${
          isSidebarOpen ? 'ml-64' : 'ml-0'
        } ${isDark ? 'bg-[#141414] text-gray-100' : 'bg-gray-50 text-gray-900'}`}
      >

        {/* SECCIÓN 1 */}
        <section id="home"  className={`px-5 py-20 ${isDark ? 'bg-[#141414]' : 'bg-blue-50'}`}>
          <div className="max-w-4xl mx-auto text-center w-full">
            <h2 className={`text-4xl md:text-5xl lg:text-6xl font-extrabold mb-5 leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
              ¿Qué pasa cuando 2 <span className="text-blue-600 font-bold cursor-pointer">mentes</span> se encuentran?
            </h2>
            <p className={`text-xl md:text-2xl mb-16 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Aprende, enseña y conecta como nunca antes.
            </p>

            <div className="mb-12">
              <p className={`text-lg md:text-xl italic ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                "Únete a 5,000+ personas que ya están revitalizando sus habilidades."
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
              <button 
                className={`cursor-pointer border px-6 py-3 rounded-lg font-semibold transition-all text-sm ${
                  isDark 
                    ? 'bg-transparent text-gray-400 border-gray-600 hover:border-blue-600 hover:text-blue-600' 
                    : 'bg-transparent text-gray-700 border-gray-300 hover:border-blue-500 hover:text-blue-600'
                }`}
                onClick={handleHowItWorksClick}
              >
                ¿CÓMO FUNCIONA?
              </button>
              <button 
                className="cursor-pointer bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-500 hover:to-blue-600 hover:shadow-lg hover:shadow-blue-600/30 transition-all"
                onClick={handleFindExchangeClick}
              >
                ENCUENTRA TU INTERCAMBIO
              </button>
            </div>
          </div>
        </section>

        {/* SECCIÓN 2 */}
        <section id="how-it-works" className={`px-5 py-20 ${isDark ? 'bg-[#141414]' : 'bg-blue-50'}`}>
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="text-center lg:text-left">
              <h1 className={`text-4xl md:text-6xl font-extrabold mb-5 leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                ¿No puedes pagar <span className="text-blue-600 font-bold cursor-pointer">cursos</span>?
              </h1>
              <p className={`text-lg md:text-xl mb-10 leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Muchos como tú, tienen habilidades para intercambiar.
                <br />
                Aquí lo hacemos posible
              </p>
              <button 
                className={`cursor-pointer px-8 py-4 rounded-lg font-bold text-lg transition-all mb-16 ${
                  isDark 
                    ? 'bg-gradient-to-r from-gray-700 to-gray-800 text-white hover:from-gray-600 hover:to-gray-700 hover:shadow-xl hover:shadow-blue-600/20' 
                    : 'bg-gradient-to-r from-gray-200 to-gray-300 text-gray-800 hover:from-gray-100 hover:to-gray-200 hover:shadow-xl hover:shadow-gray-400/20'
                }`}
                onClick={handleJoinClick}
              >
                ÚNETE A <span className="cursor-pointer text-gray-400">SWAPK</span> GRATIS
              </button>
            </div>

            <div className="flex flex-col gap-8">
              {[
                { icon: FileText, title: "Registra tus", highlight: "habilidades", desc: "(que tú ofreces y que necesitas)" },
                { icon: Search, title: "Encuentra a tu pareja de", highlight: "intercambio", desc: "con nuestro buscador inteligente" },
                { icon: Handshake, title: "Acuerda el", highlight: "intercambio", desc: "y aprende sin costos" }
              ].map((item, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-center gap-5 p-5 rounded-xl backdrop-blur-sm transition-all ${
                    isDark 
                      ? 'bg-white/5 hover:bg-white/10 hover:shadow-xl hover:shadow-blue-600/20' 
                      : 'bg-white hover:shadow-xl hover:shadow-gray-300/50'
                  }`}
                >
                  <div className="w-15 h-15 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-7 h-7 text-white" />
                  </div>
                  <div className={isDark ? 'text-white' : 'text-gray-800'}>
                    <h3 className="text-lg font-semibold mb-1">
                      {item.title} <span className="text-blue-600 font-bold cursor-pointer">{item.highlight}</span>
                    </h3>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECCIÓN 3 */}
        <section id="mission" className={`px-5 py-20 ${isDark ? 'bg-[#141414]' : 'bg-blue-50'}`}>
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center w-full">
            <div>
              <h2 className={`text-3xl md:text-5xl font-bold mb-12 leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Descubre la misión y visión de <span className="text-blue-600 font-bold cursor-pointer">SWAPK</span>
              </h2>

              <div className="flex flex-col gap-10">
                {[
                  { title: "NUESTRA MISIÓN", text: "Revolucionar la educación mediante experiencias de aprendizaje innovadoras, haciendo que el conocimiento de calidad sea accesible para todos a través del intercambio de habilidades." },
                  { title: "NUESTRA VISIÓN", text: "Ser la red global líder en aprendizaje colaborativo, donde cada persona pueda desarrollar sus habilidades a través del intercambio, sin que el dinero sea una barrera para crecer." }
                ].map((section, idx) => (
                  <div 
                    key={idx} 
                    className={`p-8 rounded-2xl backdrop-blur-sm border ${
                      isDark 
                        ? 'bg-white/5 border-gray-700' 
                        : 'bg-white border-gray-200 shadow-md'
                    }`}
                  >
                    <h3 className="text-blue-600 font-bold text-xl mb-5">{section.title}</h3>
                    <p className={`mb-6 leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {section.text}
                    </p>
                    <button 
                      className={`border px-6 py-3 rounded-lg font-semibold transition-all text-sm ${
                        isDark 
                          ? 'bg-transparent text-gray-400 border-gray-600 hover:border-blue-600 hover:text-blue-600' 
                          : 'bg-transparent text-gray-700 border-gray-300 hover:border-blue-500 hover:text-blue-600'
                      }`}
                      onClick={idx === 0 ? handleLearnMoreClick : handleDiscoverGoalsClick}
                    >
                      DESCUBRE NUESTROS OBJETIVOS
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SECCIÓN 4 */}
        <section id="testimonials" className={`px-5 py-20 ${isDark ? 'bg-[#141414]' : 'bg-blue-50'}`}>
          <div className="max-w-4xl mx-auto w-full">
            <div 
              className={`rounded-2xl p-10 relative flex items-center gap-10 mb-8 ${
                isDark 
                  ? 'bg-gray-700/30 border border-gray-600' 
                  : 'bg-white border border-gray-200 shadow-lg'
              }`}
            >
              <div className="flex-shrink-0">
                <img
                  src={testimonials[currentTestimonial].image || "/placeholder.svg"}
                  alt={testimonials[currentTestimonial].name}
                  className="w-20 h-20 rounded-full object-cover"
                />
              </div>
              <div className="flex-1">
                <p className={`text-lg leading-relaxed mb-5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <span className="text-blue-600 font-bold cursor-pointer">Swapk</span>{" "}
                  {testimonials[currentTestimonial].text}
                </p>

                <div className="mb-5">
                  <p className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>— {testimonials[currentTestimonial].name}</p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{testimonials[currentTestimonial].role}</p>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex gap-1">
                    {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <div className="flex items-center gap-2 font-semibold">
                    <span className={isDark ? 'text-white' : 'text-gray-900'}>Sw</span>
                    <span className="text-blue-600 font-bold cursor-pointer">a</span>
                    <span className={isDark ? 'text-white' : 'text-gray-900'}>pk</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-3">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  className={`w-3 h-3 rounded-full border-none cursor-pointer transition-colors ${
                    index === currentTestimonial 
                      ? 'bg-blue-600' 
                      : isDark ? 'bg-gray-600' : 'bg-gray-400'
                  }`}
                  onClick={() => goToTestimonial(index)}
                  aria-label={`Ir al testimonio ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className={`py-2 text-center ${isDark ? 'bg-gray-900 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
          <p className="text-sm font-medium">© 2025 Swapk. Todos los derechos reservados.</p>
        </footer>
      </div>
    </div>
  )
}