"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/router";
import {
  X, Search, HomeIcon, Star, Camera, Plus, Settings,
  LogOut, User, Bell, MessageSquare, Eye, Edit, MapPin, Menu
} from "lucide-react"

// ✅ CORREGIDO: Importar correctamente
import { skillsAPI, SkillAssociation, Skill, SkillAssociationResponse } from "@/services/api_Skills";
import { AddSkillForm } from "../../components/ui/AddSkillForm"
import CreateSkillForm from "../../components/ui/CreateSkillForm"
import Image from "next/image"
import axios from "axios"


interface Perfil {
  id: number; 
  nombre: string;
  id_usuario: number;
  correo?: string;
  descripcion?: string;
  ubicacion?: string;
  Tel?: number;
  foto_perfil?: string;
  habilidades: any[];
}

export default function ProfilePage() {
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeSkillIndex, setActiveSkillIndex] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const skillContainerRef = useRef<HTMLDivElement>(null)
  const [user, setUser] = useState<any>(null); 
  const router = useRouter();
  const [habilidadesDisponibles, setHabilidadesDisponibles] = useState<Skill[]>([])
  const [habilidadesPerfil, setHabilidadesPerfil] = useState<SkillAssociationResponse[]>([]);


   useEffect(() => {
  const storedUser = localStorage.getItem("user");
  if (!storedUser) {
    router.push("../auth/login");
    return;
  }

  try {
    const parsedUser = JSON.parse(storedUser);
    if (!parsedUser.token) {
      console.warn("❌ No hay token en el objeto de usuario");
      setLoading(false);
      return;
    }

    console.log("✅ Usuario cargado:", parsedUser);
    setUser(parsedUser);

    // 🔥 Cargar el perfil del usuario
    axios.get(`http://localhost:8000/perfil/usuario/${parsedUser.id}`, {
      headers: {
        Authorization: `Bearer ${parsedUser.token}`
      }
    })
    .then(response => {
      setPerfil(response.data);
    })
    .catch(error => {
      console.error("Error al obtener el perfil:", error);
      setError("No se pudo cargar el perfil.");
    });
  } catch (err) {
    console.error("Error al parsear localStorage", err);
  } finally {
    setLoading(false);
  }
}, []);

 useEffect(() => {
  skillsAPI.getSkills()
    .then(setHabilidadesDisponibles)
    .catch(err => {
      console.error("❌ Error al cargar habilidades disponibles:", err);
    });
}, []);

  const handleSaveAssociation = async (assoc: SkillAssociation) => {
  try {
    if (!perfil) return;
    setLoading(true);

    const nuevaAsociacion = await skillsAPI.associateSkill({
      Perfil_id: perfil.id,
      habilidad_id: assoc.habilidad_id,
      tipo: assoc.tipo,
      nivel: assoc.nivel
    });

    const habilidadCompleta = habilidadesDisponibles.find(h => h.id === assoc.habilidad_id);

    // Añadir nombre en la propiedad correcta (ejemplo: habilidad_nombre)
    setHabilidadesPerfil(prev => [
  ...prev,
  { ...nuevaAsociacion, habilidad_nombre: habilidadCompleta?.nombre || "" }
]);
    setShowAddForm(false);
  } catch (error) {
    console.error(error);
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  if (!perfil?.id) return;
  skillsAPI.getPerfilSkills(perfil.id)
    .then(setHabilidadesPerfil)
    .catch(err => console.error(err));
}, [perfil?.id]);


  const handleRemoveSkill = async (idAsociacion: number) => {
  if (!perfil) return;
  try {
    setLoading(true);
    await skillsAPI.deleteSkillAssociation(idAsociacion); // Debes implementar este método en tu API
    setHabilidadesPerfil(prev => prev.filter(h => h.id !== idAsociacion));
  } catch (error) {
    console.error(error);
    alert("Error al eliminar la habilidad.");
  } finally {
    setLoading(false);
  }
};

 const handleLogout = () => {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
  router.push("/login");
};

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.log("Buscando:", searchQuery)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center">
        <div className="text-white text-lg">Cargando perfil...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-4 text-red-500 font-semibold">
        🚫 No hay token de autenticación. Por favor, inicia sesión.
      </div>
    );
  }
  


  return (
    <div className="relative min-h-screen bg-[#141414] flex">
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
            <Image
              src="/img/logoswapk.png"
              alt="Logo Swapk"
              width={22}
              height={22}
              className="w-6 h-6 mr-3"
            />
            <span className="text-white font-bold text-rm">Swapk</span>
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
                onChange={e => setSearchQuery(e.target.value)}
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
      <div
        className={`min-h-screen transition-all duration-300 w-full ${
          isSidebarOpen ? "pl-6" : "pl-14"
        } pr-6 py-6`}
      >
        <div className="w-full">
          {/* User Profile Card */}
          <div className="bg-[#1E1E1E] border-[#2E2E2E] rounded-xl p-6 border w-350 mx-auto">
            {/* ✅ AÑADE ESTO: Mensaje de error */}
            {error && (
              <div className="bg-yellow-500/20 border border-yellow-500 text-yellow-300 p-3 rounded-lg mb-4 text-sm">
                ⚠️ {error}
              </div>
            )}
  
            <div className="text-left">
              <div className="w-100 flex justify-between items-center p-8">
                <div className="relative inline-block mb-4 ">
                  <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full mx-auto flex items-center justify-space overflow-hidden">
                    <Image
                      src={perfil?.foto_perfil || "/img/user.png"}
                      alt="Profile"
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button className="absolute -bottom-1 -right-1 bg-blue-600 p-2 rounded-full hover:bg-blue-700 transition-colors">
                    <Camera className="w-4 h-4 text-white" />
                  </button>
                </div>

                <div className="relative inline-block">
                  <h2 className="text-white text-2xl font-bold mb-1 flex items-center justify-center gap-2 w-100">
                      {perfil?.nombre || "Cargando..."}
                      <div className="w-3 h-3 bg-green-500 rounded-full flex items-center justify-center"></div>
                   </h2>
                    

                  <div className="flex items-center justify-center gap-1 text-gray-400 mb-3">
                    <MapPin className="w-5 h-5" />
                    <span>{perfil?.ubicacion || "Ubicación no especificada"}</span>
                  </div>
                </div>
              </div>

              <div className="relative inline-block ml-2">
                <div className="flex justify-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>

               <button 
                className="bg-gradient-to-r from-gray-900 to-gray-600 text-white px-6 py-2.5 rounded-lg hover:from-gray-600 hover:to-gray-500 transition-all duration-200 flex items-center gap-2 mx-auto shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                  <>
                    <Edit className="w-4 h-4" />
                        Editar perfil

                  </>
              </button>
              </div>
            </div>
            <div className="mt-6 p-4 bg-gray-900/50 rounded-lg">
              <p className="text-gray-300 text-sm leading-relaxed">
                {perfil?.descripcion || "¡Bienvenido a tu perfil!"}
              </p>
            </div>
          </div>

          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-350 mt-6 mx-auto">
            {/* Exchange Information */}
            <div className="bg-[#1E1E1E] border-[#2E2E2E] rounded-xl p-6">
              <h3 className="text-white text-lg font-bold mb-6">Información de Intercambios</h3>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-white mb-1">5</div>
                  <div className="text-gray-400 text-sm">intercambios realizados</div>
                  <div className="text-gray-500 text-xs">cursos completos</div>
                </div>

                <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-white mb-1">2</div>
                  <div className="text-gray-400 text-sm">Intercambios Inscrito</div>
                  <div className="text-gray-500 text-xs">Cursos a realizar</div>
                </div>

                <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-white mb-1">7</div>
                  <div className="text-gray-400 text-sm">Persona conocidas</div>
                </div>

                <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                  <div className="text-gray-400 text-sm">Personas de intercambio</div>
                  <div className="text-gray-500 text-xs">instructores</div>
                </div>
              </div>

              <div className="border-t border-gray-700 pt-10">
                <div className="flex items-center justify-between mb-8">
                  <h4 className="text-white text-lx font-semibold">Certificados</h4>
                  <div className="flex gap-2">
                    <button className="bg-gradient-to-r bg-blue-600 to-blue-500 text-white px-1 py-4 rounded-lg hover:from-blue-500 hover:to-blue-400 transition-all duration-200 flex items-center gap-1 text-sm font-medium shadow-lg hover:shadow-emerald-500/25">
                      <Plus className="w-4 h-4" />
                      Agregar
                    </button>

                    <button className="bg-gradient-to-r from-gray-700 to-gray-600 text-white px-1 py-4 rounded-lg hover:from-gray-600 hover:to-gray-500 transition-all duration-200 flex items-center gap-1 text-sm font-medium shadow-lg">
                      <Eye className="w-4 h-4" />
                      Ver más
                    </button>
                  </div>
                </div>

                <div className="bg-gray-900/50 rounded-lg p-6">
                  <div className="text-center text-gray-400">
                    <p className="text-sm">No tienes certificados aún</p>
                    <p className="text-xs text-gray-500">Subelos a tu perfil para obtener el recononimiento!</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Skills Section */}
            <div className="bg-[#1E1E1E] border-[#2E2E2E] rounded-xl p-6 border ">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white text-lg font-bold ">Habilidades</h3>
                <div className="flex gap-6 ">
                  <button onClick={() => setShowAddForm(true)} className="bg-blue-600 px-3 py-2 rounded mt-3 text-white">
                    Añadir habilidad
                  </button>
                </div>
              </div>

              <div ref={skillContainerRef} className="flex flex-wrap gap-3 mb-6 relative">
  {habilidadesPerfil.length > 0 ? habilidadesPerfil.map((skill, index) => (
    <div key={skill.id} className="relative group">
      <span
        onClick={() => setActiveSkillIndex(prev => (prev === index ? null : index))}
        className="bg-gradient-to-r from-purple-600 to-purple-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg hover:shadow-purple-500/25 hover:scale-105 transition-all duration-200 cursor-pointer"
      >
        #{skill.habilidad_nombre || `Habilidad ${index + 1}`}
      </span>

      <button
        onClick={() => handleRemoveSkill(skill.id)}
        className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
      >
        ×
      </button>

      {activeSkillIndex === index && (
        <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs p-3 rounded-lg shadow-lg z-10 w-max max-w-xs">
          <p className="mb-1">
            <span className="font-semibold">Tipo:</span> {skill.tipo}
          </p>
          <p>
            <span className="font-semibold">Nivel:</span> {skill.nivel}
          </p>
        </div>
      )}
    </div>
  )) : (
    <p className="text-gray-400 text-sm">No hay habilidades agregadas</p>
  )}
</div>


              {/* Formularios */}

             {showAddForm && (
                  <AddSkillForm
                  onClose={() => setShowAddForm(false)}
                  onSave={handleSaveAssociation}
                  perfilId={perfil?.id || 0}
                  habilidades={habilidadesDisponibles} 
                />

                )}


              {/* Exchange History */}
              <div className="border-t border-gray-700 pt-10">
                <h4 className="text-white text-lg font-bold mb-4">Historial de intercambios</h4>
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex-shrink-0 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">U</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-white font-medium">Usuario</span>
                        <span className="text-gray-400 text-sm">Clases de cocina por lecciones de fotografía</span>
                      </div>
                      <div className="flex gap-1 mb-4">
                        {[...Array(4)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <p className="text-gray-400 text-sm italic mb-3">
                        "Me encantó el intercambio, aprendí mucho y la experiencia fue genial."
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}