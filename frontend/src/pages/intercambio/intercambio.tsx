"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  Search,
  Menu,
  X,
  User,
  Bell,
  MessageSquare,
  HomeIcon,
  Star,
  Camera,
  Plus,
  Settings,
  LogOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"

export default function SwapkPlatform() {
  const router = useRouter()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [modalidad, setModalidad] = useState("")
  const [nivel, setNivel] = useState("")
  const [busqueda, setBusqueda] = useState("")
  const [idioma, setIdioma] = useState("")

  const handleLogout = () => {
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    router.push("/login")
  }

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.log("Buscando:", searchQuery)
  }

  const tutors = [
    {
      name: "Maria",
      rating: 4,
      level: "principiante",
      offers: "#Ingles #Yoga #Piano #Remoto",
      seeks: "#matematicas #programacion",
      location: "Colombia, Bogotá-carrera 92 #129 b-42",
      description:
        "Hola, me interesan mucho tus conocimientos en matemáticas e programación. Yo puedo ofrecerte clases de piano y demás desde nivel básico hasta avanzado, completamente personalizadas. También tengo experiencia en técnicas de respiración y meditación que podríamos complementar. Estoy disponible los miércoles y sábados por la tarde. ¿Te animas a intercambiar saberes?",
      image: "/smiling-woman-outdoors.png",
    },
    {
      name: "Dalto",
      rating: 4,
      level: "principiante",
      offers: "#Ingles #Yoga #Piano #Remoto",
      seeks: "#matematicas #programacion",
      location: "Colombia, Bogotá-carrera 92 #129 b-42",
      description:
        "Hola, me interesan mucho tus conocimientos en matemáticas e programación. Yo puedo ofrecerte clases de piano y demás desde nivel básico hasta avanzado, completamente personalizadas. También tengo experiencia en técnicas de respiración y meditación que podríamos complementar. Estoy disponible los miércoles y sábados por la tarde. ¿Te animas a intercambiar saberes?",
      image: "/man-working-computer.jpg",
    },
    {
      name: "Julia",
      rating: 4,
      level: "principiante",
      offers: "#Ingles #Yoga #Piano #Remoto",
      seeks: "#matematicas #programacion",
      location: "Colombia, Bogotá-carrera 92 #129 b-42",
      description:
        "Hola, me interesan mucho tus conocimientos en matemáticas e programación. Yo puedo ofrecerte clases de piano y demás desde nivel básico hasta avanzado, completamente personalizadas. También tengo experiencia en técnicas de respiración y meditación que podríamos complementar. Estoy disponible los miércoles y sábados por la tarde. ¿Te animas a intercambiar saberes?",
      image: "/young-woman-nature.jpg",
    },
    {
      name: "Edgar",
      rating: 4,
      level: "principiante",
      offers: "#Ingles #Yoga #Piano #Remoto",
      seeks: "#matematicas #programacion",
      location: "Colombia, Bogotá-carrera 92 #129 b-42",
      description:
        "Hola, me interesan mucho tus conocimientos en matemáticas e programación. Yo puedo ofrecerte clases de piano y demás desde nivel básico hasta avanzado, completamente personalizadas. También tengo experiencia en técnicas de respiración y meditación que podríamos complementar. Estoy disponible los miércoles y sábados por la tarde. ¿Te animas a intercambiar saberes?",
      image: "/man-with-dog-studying.jpg",
    },
    {
      name: "Roberto",
      rating: 4,
      level: "principiante",
      offers: "#Ingles #Yoga #Piano #Remoto",
      seeks: "#matematicas #programacion",
      location: "Colombia, Bogotá-carrera 92 #129 b-42",
      description:
        "Hola, me interesan mucho tus conocimientos en matemáticas e programación. Yo puedo ofrecerte clases de piano y demás desde nivel básico hasta avanzado, completamente personalizadas. También tengo experiencia en técnicas de respiración y meditación que podríamos complementar. Estoy disponible los miércoles y sábados por la tarde. ¿Te animas a intercambiar saberes?",
      image: "/man-blue-shirt-smiling.jpg",
    },
    {
      name: "Gilberta",
      rating: 4,
      level: "principiante",
      offers: "#Ingles #Yoga #Piano #Remoto",
      seeks: "#matematicas #programacion",
      location: "Colombia, Bogotá-carrera 92 #129 b-42",
      description:
        "Hola, me interesan mucho tus conocimientos en matemáticas e programación. Yo puedo ofrecerte clases de piano y demás desde nivel básico hasta avanzado, completamente personalizadas. También tengo experiencia en técnicas de respiración y meditación que podríamos complementar. Estoy disponible los miércoles y sábados por la tarde. ¿Te animas a intercambiar saberes?",
      image: "/blonde-woman-white-shirt.jpg",
    },
  ]

  const renderStars = (rating: number) => {
    return Array.from({ length: 4 }, (_, i) => (
      <span key={i} className={`text-yellow-400 ${i < rating ? "opacity-100" : "opacity-30"}`}>
        ★
      </span>
    ))
  }

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <nav
        className={`fixed md:relative h-screen bg-[rgb(30,30,30)] border-[#2E2E2E] backdrop-blur-md border-r flex flex-col transition-all duration-300
    ${isSidebarOpen ? "w-60 fixed" : "w-14 fixed"}`}
      >
        {/* Botón para colapsar/expandir */}
        <div className="flex justify-end p-2 left-0.5">
          <button
            className="flex justify-end text-white hover:text-blue-400 transition-colors left-2.5"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Logo */}
        {isSidebarOpen && (
          <div className="flex items-center mb-8 px-4">
            <div className="w-6 h-6 mr-3 bg-blue-500 rounded"></div>
            <span className="text-white font-bold text-lg">Swapk</span>
          </div>
        )}

        {/* Perfil / Notificaciones / Mensajes */}
        {isSidebarOpen && (
          <div className="flex gap-12 justify-center mb-12">
            <User className="w-6 h-6 text-white hover:text-blue-400 cursor-pointer transition-colors" />
            <Bell className="w-6 h-6 text-white hover:text-blue-400 cursor-pointer transition-colors" />
            <MessageSquare className="w-6 h-6 text-white hover:text-blue-400 cursor-pointer transition-colors" />
          </div>
        )}

        {/* Buscador */}
        {isSidebarOpen && (
          <div className="mb-20 px-3">
            <form onSubmit={handleSearch} className="flex flex-col gap-6">
              <input
                type="text"
                placeholder="¿Qué aprenderás hoy?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-gray-800/80 text-white px-4 py-3 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-emerald-400/20 w-full transition-all duration-200"
              />
              <button
                type="submit"
                className="cursor-pointer bg-gradient-to-r bg-blue-600 px-4 py-3 rounded-lg hover:bg-blue-500 hover:to-blue-600 transition-all duration-200 flex items-center justify-center gap-2 text-white font-medium shadow-lg hover:shadow-emerald-500/25"
              >
                <Search className="w-4 h-4" />
                Buscar
              </button>
            </form>
          </div>
        )}

        {/* Links navegación */}
        <div className="flex flex-col gap-4 mb-8 px-5">
          <button className="cursor-pointer flex items-center gap-3 text-white font-medium py-3 px-2 rounded-lg hover:bg-blue-500/20 hover:text-blue-400 transition-all duration-200">
            <HomeIcon className="w-5 h-5" />
            {isSidebarOpen && "INICIO"}
          </button>
          <button className="cursor-pointer flex items-center gap-3 text-white font-medium py-3 px-2 rounded-lg hover:bg-blue-500/20 hover:text-blue-400 transition-all duration-200">
            <Search className="w-5 h-5" />
            {isSidebarOpen && "EXPLORAR"}
          </button>
          <button className="cursor-pointer flex items-center gap-3 text-white font-medium py-3 px-2 rounded-lg hover:bg-blue-500/20 hover:text-blue-400 transition-all duration-200">
            <Star className="w-5 h-5" />
            {isSidebarOpen && "MIS TRUEQUES"}
          </button>
          <button className="cursor-pointer flex items-center gap-3 text-white font-medium py-3 px-2 rounded-lg hover:bg-blue-500/20 hover:text-blue-400 transition-all duration-200">
            <Camera className="w-5 h-5" />
            {isSidebarOpen && "MIS CURSOS"}
          </button>
          <button className="cursor-pointer flex items-center gap-3 text-white font-medium py-3 px-2 rounded-lg hover:bg-blue-500/20 hover:text-blue-400 transition-all duration-200">
            <Plus className="w-5 h-5" />
            {isSidebarOpen && "COMUNIDAD"}
          </button>
          <button className="cursor-pointer flex items-center gap-3 text-white font-medium py-3 px-2 rounded-lg hover:bg-blue-500/20 hover:text-blue-400 transition-all duration-200">
            <Settings className="w-5 h-5" />
            {isSidebarOpen && "AJUSTES"}
          </button>
        </div>

        {/* Logout */}
        <div className="mt-auto px-2 mb-4">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 text-red-500 hover:text-red-400 transition w-full"
          >
            <LogOut className="w-5 h-5" />
            {isSidebarOpen && <span>Cerrar sesión</span>}
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? "ml-2" : "ml-2"}`}>
        <div className="flex h-full">
          {/* Search Filters Sidebar */}
          <div className="w-80 bg-gray-800 p-6 border-r border-gray-700">
            <div className="flex items-center mb-8">
              <h1 className="text-2xl font-bold text-center">
                Buscar
                Intercambios
              </h1>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Tipo de modalidad</h3>
                <select
                  value={modalidad}
                  onChange={(e) => setModalidad(e.target.value)}
                  className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:border-blue-400 focus:outline-none"
                >
                  <option value="">Virtual, Presencial, Híbrido.</option>
                  <option value="virtual">Virtual</option>
                  <option value="presencial">Presencial</option>
                  <option value="hibrido">Híbrido</option>
                </select>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Nivel requerido</h3>
                <select
                  value={nivel}
                  onChange={(e) => setNivel(e.target.value)}
                  className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:border-blue-400 focus:outline-none"
                >
                  <option value="">Principiante, Intermedio, Avanzado.</option>
                  <option value="principiante">Principiante</option>
                  <option value="intermedio">Intermedio</option>
                  <option value="avanzado">Avanzado</option>
                </select>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">¿Qué buscas?</h3>
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Ciencias, Artes, Desarrollo, etc."
                  className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:border-blue-400 focus:outline-none"
                />
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Idioma preferido</h3>
                <input
                  type="text"
                  value={idioma}
                  onChange={(e) => setIdioma(e.target.value)}
                  placeholder="Inglés, Español, etc."
                  className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:border-blue-400 focus:outline-none"
                />
              </div>

              <Button className="w-full bg-blue-600 hover:bg-blue-700 py-3 text-lg">Buscar</Button>
            </div>
            
          </div>

          {/* Results Area */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-8 bg-gray-800 p-4 rounded-lg border border-gray-700">
                <h2 className="text-2xl font-bold mb-4">Intercambios</h2>
                <div><Button className="bg-blue-600 hover:bg-blue-700">Crear trueque</Button></div>
            </div>
            <h4 className="text-2xl font-bold text-start mb-8">
              Estas son las opciones que mas se ajustan a tu busqueda!
            </h4>
            

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {tutors.map((tutor, index) => (
                <div key={index} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <div className="flex items-start gap-4 mb-4">
                    <Image
                      src={tutor.image || "/placeholder.svg"}
                      alt={tutor.name}
                      width={80}
                      height={80}
                      className="rounded-full"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-bold">{tutor.name}</h3>
                        <div className="flex items-center gap-2">
                          <div className="flex">{renderStars(tutor.rating)}</div>
                          <span className="text-sm text-gray-400">{tutor.level}</span>
                        </div>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div>
                          <span className="text-green-400">Ofrece</span> {tutor.offers}
                        </div>
                        <div>
                          <span className="text-blue-400">Busca</span> {tutor.seeks}
                        </div>
                        <div className="text-gray-400">{tutor.location}</div>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-300 mb-4 leading-relaxed">{tutor.description}</p>

                  <div className="flex justify-end">
                    <Button className="bg-blue-600 hover:bg-blue-700">Proponer trueque</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
