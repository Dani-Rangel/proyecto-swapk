"use client";

// Importación de funcionalidad "change_language"
import { useTranslation } from "../../lib/useTranslations";

// Importación de componentes 
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "@/components/ui/badge";

// Importación para alertas
import toast, { Toaster } from 'react-hot-toast';

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  X, 
  Search, 
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
  Sun,
  Award
} from "lucide-react";
import { skillsAPI, SkillAssociation, Skill, SkillAssociationResponse } from "@/services/api_Skills";
import { AddSkillForm } from "../../components/ui/AddSkillForm";
import ProtectedRoute from "@/components/protected_routes/protected_routes"; 
import { getCurrentUser, clearCurrentUser } from "@/lib/auth";
import { MainSidebar } from "@/components/MainSidebar";
import { expedienteService, TipoExpedienteEnum, TipoEstadoEnum } from "@/services/expediente";
import { intercambioService, IntercambioConResena } from "@/services/api_profile_intercambio";

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

function ProfilePageComponent() {
  const [isDark, setIsDark] = useState(true);
  const { t } = useTranslation();
  
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSkillIndex, setActiveSkillIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const skillContainerRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<any>(null); 
  const router = useRouter();
  const [habilidadesDisponibles, setHabilidadesDisponibles] = useState<Skill[]>([]);
  const [habilidadesPerfil, setHabilidadesPerfil] = useState<SkillAssociationResponse[]>([]);
  const [imageSrc, setImageSrc] = useState<string>("/img/user.png");

  // ✅ Estado para certificados
  const [certificaciones, setCertificaciones] = useState<any[]>([]);
  const [loadingCertificados, setLoadingCertificados] = useState(true);
  const [intercambiosConResenas, setIntercambiosConResenas] = useState<IntercambioConResena[]>([]);
  const [loadingIntercambios, setLoadingIntercambios] = useState(true);
  const [selectedIntercambio, setSelectedIntercambio] = useState<IntercambioConResena | null>(null);

  // ✅ Función para obtener URL completa de la foto
  const getProfileImageUrl = (foto_perfil?: string): string => {
    if (!foto_perfil) return "/img/user.png";
    if (foto_perfil.startsWith("http")) return foto_perfil;
    if (foto_perfil.startsWith("/")) return `http://localhost:8000${foto_perfil}`;
    return "/img/user.png";
  };

  // ✅ Función para colores de estado de certificados
  const getStatusColor = (status: string) => {
    switch (status) {
      case TipoEstadoEnum.VERIFICADO:
        return "bg-green-600";
      case TipoEstadoEnum.PENDIENTE:
        return "bg-yellow-600";
      case TipoEstadoEnum.EN_PROCESO:
        return "bg-blue-600";
      case TipoEstadoEnum.RECHAZADO:
        return "bg-red-600";
      default:
        return "bg-gray-600";
    }
  };

  // ✅ Cargar perfil del usuario
  useEffect(() => {
    const currentUser = getCurrentUser();
    
    if (!currentUser || !currentUser.token) {
      console.warn("❌ No hay usuario autenticado");
      router.push("/auth/login");
      return;
    }

    console.log("✅ Usuario cargado:", currentUser);
    setUser(currentUser);

    axios.get(`http://localhost:8000/perfil/usuario/${currentUser.id}`, {
      headers: {
        Authorization: `Bearer ${currentUser.token}`
      }
    })
    .then(response => {
      setPerfil(response.data);
    })
    .catch(error => {
      console.error("Error al obtener el perfil:", error);
      if (error.response?.status === 401) {
        clearCurrentUser();
        router.push("/auth/login");
      } else {
        setError("No se pudo cargar el perfil.");
      }
    })
    .finally(() => {
      setLoading(false);
    });
  }, [router]);

  // ✅ Cargar habilidades disponibles
  useEffect(() => {
    skillsAPI.getSkills()
      .then(setHabilidadesDisponibles)
      .catch(err => {
        console.error("❌ Error al cargar habilidades disponibles:", err);
      });
  }, []);

  // ✅ Cargar habilidades del perfil
  useEffect(() => {
    if (!perfil?.id) return;
    skillsAPI.getPerfilSkills(perfil.id)
      .then(setHabilidadesPerfil)
      .catch(err => console.error(err));
  }, [perfil?.id]);

  // ✅ Cargar certificados del usuario
  useEffect(() => {
    if (!user?.id) return;

    const fetchCertificaciones = async () => {
      try {
        const expedientes = await expedienteService.listarPorUsuario(user.id);
        const certificados = expedientes.filter(
          (exp) => exp.tipo === TipoExpedienteEnum.CERTIFICADO
        );

        const mapped = certificados.map((cert) => ({
          id: cert.id,
          name: cert.nombre,
          issuer: cert.institucion,
          date: cert.fecha_inicio || new Date().toISOString(),
          status: cert.estado,
          archivos: cert.archivos || [],
        }));

        setCertificaciones(mapped);
      } catch (error) {
        console.error("Error al cargar certificados en perfil:", error);
        toast.error("No se pudieron cargar los certificados.");
      } finally {
        setLoadingCertificados(false);
      }
    };

    fetchCertificaciones();
  }, [user?.id]);

  // ✅ Cargar intercambios con reseñas
  useEffect(() => {
    if (!user?.id) return;

    const fetchIntercambios = async () => {
      try {
        setLoadingIntercambios(true);
        const data = await intercambioService.getIntercambiosConResenas(user.id);
        setIntercambiosConResenas(data);
      } catch (error) {
        console.error("Error al cargar intercambios con reseñas:", error);
        toast.error("No se pudieron cargar los intercambios.");
      } finally {
        setLoadingIntercambios(false);
      }
    };

    fetchIntercambios();
  }, [user?.id]);

  // ✅ Actualizar imagen de perfil
  useEffect(() => {
    if (perfil?.foto_perfil) {
      setImageSrc(getProfileImageUrl(perfil.foto_perfil));
    } else {
      setImageSrc("/img/user.png");
    }
  }, [perfil?.foto_perfil]);

  // ✅ Guardar asociación de habilidad
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

      setHabilidadesPerfil(prev => [
        ...prev,
        { ...nuevaAsociacion, habilidad_nombre: habilidadCompleta?.nombre || "" }
      ]);
      setShowAddForm(false);
    } catch (error) {
      console.error(error);
      toast.error("Error al agregar la habilidad.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Eliminar habilidad
  const handleRemoveSkill = async (idAsociacion: number) => {
    if (!perfil) return;
    try {
      setLoading(true);
      await skillsAPI.deleteSkillAssociation(idAsociacion);
      setHabilidadesPerfil(prev => prev.filter(h => h.id !== idAsociacion));
    } catch (error) {
      console.error(error);
      toast.error("Error al eliminar la habilidad.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Cerrar sesión
  const handleLogout = () => {
    clearCurrentUser();
    setUser(null);
    setPerfil(null);
    toast.success(t("sessionClosed"));
    setTimeout(() => router.push("/auth/login"), 1000);
  };

  // ✅ Búsqueda (placeholder)
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Buscando:", searchQuery);
  };

  // ✅ Render loading
  if (loading) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center">
        <div className="text-white text-lg">Cargando perfil...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-4 text-red-500 font-semibold">
        🚫 No hay token de autenticación. Por favor, inicia sesión.
      </div>
    );
  }

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <div className="min-h-screen bg-[#141414] flex">
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
        user={user}
      />

      {/* Main Content */}
      <div className={`min-h-screen transition-all duration-300 w-full ${isSidebarOpen ? "pl-6" : "pl-14"} pr-6 py-6`}>
        <div className="w-full">
          {/* User Profile Card */}
          <div className="bg-[#1E1E1E] border-[#2E2E2E] rounded-xl p-6 border w-full max-w-full">
            {error && (
              <div className="bg-yellow-500/20 border border-yellow-500 text-yellow-300 p-3 rounded-lg mb-4 text-sm">
                ⚠️ {error}
              </div>
            )}

            <div className="text-left">
              <div className="w-100 flex justify-between items-center p-8">
                <div className="relative inline-block mb-4">
                  <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full mx-auto flex items-center justify-center overflow-hidden">
                    <img
                      src={imageSrc}
                      alt="Foto de perfil"
                      className="w-full h-full object-cover"
                      onError={() => {
                        if (imageSrc !== "/img/user.png") {
                          setImageSrc("/img/user.png");
                        }
                      }}
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
                  onClick={() => router.push("/settings/profile_edit")}
                >
                  <Edit className="w-4 h-4" />
                  Editar perfil
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mx-auto mt-6">
            {/* Exchange Information */}
            <div className="bg-[#1E1E1E] border-[#2E2E2E] rounded-xl p-6">
              <h3 className="text-white text-lg font-bold mb-6">Información de Intercambios</h3>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-white mb-1">{intercambiosConResenas.length}</div>
                  <div className="text-gray-400 text-sm">intercambios realizados</div>
                  <div className="text-gray-500 text-xs">cursos completos</div>
                </div>

                <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-white mb-1">2</div>
                  <div className="text-gray-400 text-sm">Intercambios Inscrito</div>
                  <div className="text-gray-500 text-xs">Cursos a realizar</div>
                </div>

                <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-white mb-1">
                    {new Set(intercambiosConResenas.map(i => 
                      i.id_usuario1 === user.id 
                        ? i.propuestas?.find(p => p.aceptada)?.usuario_interesado?.id 
                        : i.id_usuario1
                    ).filter(Boolean)).size}
                  </div>
                  <div className="text-gray-400 text-sm">Personas conocidas</div>
                </div>

                <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                  <div className="text-gray-400 text-sm">Personas de intercambio</div>
                  <div className="text-gray-500 text-xs">instructores</div>
                </div>
              </div>

              {/* Certificados en Perfil */}
              <div className="border-t border-gray-700 pt-10">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-white text-lg font-semibold">Certificados</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-blue-400 border-blue-500 hover:bg-blue-500/10"
                    onClick={() => router.push("/settings/certifications")}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Ver todos
                  </Button>
                </div>

                {loadingCertificados ? (
                  <div className="text-center py-4 text-gray-400">Cargando certificados...</div>
                ) : certificaciones.length === 0 ? (
                  <div className="bg-gray-900/50 rounded-lg p-6 text-center">
                    <Award className="w-10 h-10 mx-auto text-gray-500 mb-3" />
                    <p className="text-gray-400 text-sm">Aún no has agregado certificados</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Sube tus credenciales en <span className="text-blue-400">Configuración</span> para mostrarlas aquí.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {certificaciones.map((cert) => (
                      <div
                        key={cert.id}
                        className="bg-gray-900/50 rounded-lg p-4 border border-gray-800 hover:border-gray-700 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div>
                            <h5 className="text-white font-medium">{cert.name}</h5>
                            <p className="text-gray-400 text-sm">por {cert.issuer}</p>
                            <p className="text-gray-500 text-xs mt-1">
                              {new Date(cert.date).toLocaleDateString("es-ES")}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap justify-end">
                            <Badge className={`${getStatusColor(cert.status)} text-white text-xs px-2 py-1`}>
                              {cert.status}
                            </Badge>

                            {cert.archivos && cert.archivos.length > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-300 hover:text-white hover:bg-gray-800"
                                title="Ver certificado"
                                onClick={() => {
                                  const url = `http://localhost:8000/uploads/${cert.archivos[0].ruta}`;
                                  window.open(url, "_blank");
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Skills Section */}
            <div className="bg-[#1E1E1E] border-[#2E2E2E] rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white text-lg font-bold">Habilidades</h3>
                <button onClick={() => setShowAddForm(true)} className="bg-blue-600 px-3 py-2 rounded mt-3 text-white">
                  Añadir habilidad
                </button>
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

              {showAddForm && (
                <AddSkillForm
                  onClose={() => setShowAddForm(false)}
                  onSave={handleSaveAssociation}
                  perfilId={perfil?.id || 0}
                  habilidades={habilidadesDisponibles}
                />
              )}

              {/* Historial de intercambios */}
              <div className="border-t border-gray-700 pt-10">
                <h4 className="text-white text-lg font-bold mb-4">Historial de intercambios</h4>

                {loadingIntercambios ? (
                  <div className="text-center py-4 text-gray-400">Cargando intercambios...</div>
                ) : intercambiosConResenas.length === 0 ? (
                  <div className="bg-gray-900/50 rounded-lg p-6 text-center">
                    <BookOpen className="w-12 h-12 mx-auto text-gray-500 mb-3" />
                    <p className="text-gray-400 text-sm">Aún no has realizado intercambios</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {intercambiosConResenas.map((intercambio) => {
                      // ✅ Obtener el otro usuario de forma segura
                      const otroUsuario = intercambio.id_usuario1 === user.id
                        ? intercambio.propuestas?.find(p => p.aceptada)?.usuario_interesado
                        : intercambio.usuario1;

                      const habilidadesOfrece = intercambio.habilidades_ofrece.map(h => h.nombre).join(", ");
                      const habilidadesBusca = intercambio.habilidades_busca.map(h => h.nombre).join(", ");

                      return (
                        <div
                          key={intercambio.id}
                          className="bg-gray-900/50 rounded-lg p-4 border border-gray-800 hover:border-gray-700 transition-colors cursor-pointer"
                          onClick={() => setSelectedIntercambio(intercambio)}
                        >
                          <div className="flex items-start gap-3">
                            {/* ✅ Avatar con inicial */}
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0">
                              {otroUsuario?.nombre?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-white font-medium">
                                  {habilidadesOfrece} ↔ {habilidadesBusca}
                                </span>
                              </div>
                              {intercambio.resenas && intercambio.resenas.length > 0 ? (
                                <p className="text-gray-300 text-sm italic mb-3">
                                  "{intercambio.resenas[0].comentario}"
                                </p>
                              ) : (
                                <p className="text-gray-500 text-sm italic mb-3">
                                  Sin reseña aún.
                                </p>
                              )}
                              <div className="flex items-center gap-1 mb-3">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} className={`w-4 h-4 ${i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-500'}`} />
                                ))}
                              </div>
                              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded text-sm font-medium transition-colors">
                                Ver detalles
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Toaster position="top-right" />

      {/* Modal de detalle */}
      {selectedIntercambio && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1E1E1E] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-[#2E2E2E]">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-white text-xl font-bold">Detalle del intercambio</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedIntercambio(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Otro usuario */}
              <div className="flex items-center gap-4 mb-6">
                {/* ✅ Avatar con inicial */}
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-lg font-bold bg-gradient-to-br from-blue-500 to-purple-600">
                  {selectedIntercambio.id_usuario1 === user.id
                    ? selectedIntercambio.propuestas?.find(p => p.aceptada)?.usuario_interesado?.nombre?.charAt(0).toUpperCase() || '?'
                    : selectedIntercambio.usuario1.nombre?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <h4 className="text-white text-lg font-semibold">
                    {selectedIntercambio.id_usuario1 === user.id
                      ? selectedIntercambio.propuestas?.find(p => p.aceptada)?.usuario_interesado?.nombre || "Usuario"
                      : selectedIntercambio.usuario1.nombre}
                  </h4>
                  <p className="text-gray-400 text-sm">Intercambio finalizado</p>
                </div>
              </div>

              {/* Habilidades */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-900/50 p-4 rounded-lg">
                  <h5 className="text-white font-medium mb-2">Ofrece:</h5>
                  <ul className="text-gray-300 text-sm">
                    {selectedIntercambio.habilidades_ofrece.map((h, i) => (
                      <li key={i}>• {h.nombre}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-gray-900/50 p-4 rounded-lg">
                  <h5 className="text-white font-medium mb-2">Busca:</h5>
                  <ul className="text-gray-300 text-sm">
                    {selectedIntercambio.habilidades_busca.map((h, i) => (
                      <li key={i}>• {h.nombre}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Reseña */}
              <div className="mb-6">
                <h5 className="text-white font-medium mb-2">Tu reseña:</h5>
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-5 h-5 ${i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-500'}`} />
                  ))}
                </div>
               {selectedIntercambio?.resenas?.length > 0 ? (
                <p className="text-gray-300 italic">{selectedIntercambio.resenas[0].comentario}</p>
              ) : (
                <p className="text-gray-300 italic">Sin reseña aún.</p>
              )}
              </div>

              {/* Acciones */}
              <div className="flex gap-3">
                <Button variant="outline" className="text-blue-400 border-blue-500">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Mensaje
                </Button>
                <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700">
                  ¡Swapk!
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfilePageComponent />
    </ProtectedRoute>
  );
}