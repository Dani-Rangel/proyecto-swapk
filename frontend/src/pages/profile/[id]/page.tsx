// frontend/src/app/profile/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  MapPin,
  Camera,
  Award,
  Heart,
  MessageSquare,
} from "lucide-react";
import { Menu, Edit } from "lucide-react";
import toast, { Toaster } from 'react-hot-toast'
import { MainSidebar } from "@/components/MainSidebar";
import { getCurrentUser } from "@/lib/auth";
import { skillsAPI } from "@/services/api_Skills";
import { expedienteService, TipoExpedienteEnum, TipoEstadoEnum } from "@/services/expediente";

interface PublicProfile {
  id: number;
  id_usuario: number;
  nombre: string;
  descripcion?: string;
  ubicacion?: string;
  Tel?: number;
  foto_perfil?: string;
  habilidades: any[];
}

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const idUsuario = Number(params.id);

  const [perfil, setPerfil] = useState<PublicProfile | null>(null);
  const [habilidades, setHabilidades] = useState<any[]>([]);
  const [certificaciones, setCertificaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Colores de estado para certificados
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Verificado": return "bg-green-600";
      case "Pendiente": return "bg-yellow-600";
      case "En proceso": return "bg-blue-600";
      case "Rechazado": return "bg-red-600";
      default: return "bg-gray-600";
    }
  };

  // URL de imagen
  const getProfileImageUrl = (foto_perfil?: string): string => {
    if (!foto_perfil) return "/img/user.png";
    if (foto_perfil.startsWith("http")) return foto_perfil;
    if (foto_perfil.startsWith("/")) return `http://localhost:8000${foto_perfil}`;
    return "/img/user.png";
  };

  // Cargar datos del perfil público
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        // 1. Perfil
        const resPerfil = await axios.get(`http://localhost:8000/perfil/usuario/${idUsuario}`);
        setPerfil(resPerfil.data);
        
        // 2. Habilidades
        const resHabilidades = await skillsAPI.getPerfilSkills(resPerfil.data.id);
        setHabilidades(resHabilidades);
        
        // 3. Certificados
        const resCert = await expedienteService.listarPorUsuario(idUsuario);
        const certs = resCert.filter((exp: any) => exp.tipo === TipoExpedienteEnum.CERTIFICADO);
        setCertificaciones(certs);
      } catch (err) {
        console.error("Error al cargar perfil:", err);
        setError("Perfil no encontrado");
      } finally {
        setLoading(false);
      }
    };

    if (idUsuario) {
      cargarDatos();
    }
  }, [idUsuario]);

  // Cargar usuario actual (para saber si es tu propio perfil)
  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
  }, []);

  const esMiPerfil = user?.id === idUsuario;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center">
        <div className="text-white text-lg">Cargando perfil...</div>
      </div>
    );
  }

  if (error || !perfil) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center">
        <div className="text-red-400 text-lg">Perfil no encontrado</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] flex">
      {/* Botón Hamburguesa */}
      <div className="absolute top-4 left-4 md:hidden z-50">
        <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-gray-600 dark:text-gray-300">
          <Menu className="w-6 h-6" />
        </Button>
      </div>

      {/* Sidebar */}
      <MainSidebar
        isDark={isDark}
        toggleTheme={() => setIsDark(!isDark)}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        user={user}
      />

      {/* Contenido principal */}
      <div className={`min-h-screen transition-all duration-300 w-full ${isSidebarOpen ? "pl-6" : "pl-14"} pr-6 py-6`}>
        <div className="max-w-4xl mx-auto">
          {/* Tarjeta de perfil */}
          <div className="bg-[#1E1E1E] border-[#2E2E2E] rounded-xl p-6 border">
            <div className="text-left">
              <div className="w-full flex flex-col md:flex-row md:items-center md:justify-between p-6 gap-6">
                <div className="relative flex flex-col items-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full mx-auto flex items-center justify-center overflow-hidden">
                    <img
                      src={getProfileImageUrl(perfil.foto_perfil)}
                      alt="Foto de perfil"
                      className="w-full h-full object-cover"
                      onError={() => {
                        // fallback a imagen por defecto
                      }}
                    />
                  </div>
                </div>

                <div className="text-center md:text-left">
                  <h2 className="text-white text-2xl font-bold mb-2 flex items-center justify-center md:justify-start gap-2">
                    {perfil.nombre}
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </h2>

                  <div className="flex items-center justify-center md:justify-start gap-1 text-gray-400 mb-3">
                    <MapPin className="w-5 h-5" />
                    <span>{perfil.ubicacion || "Ubicación no especificada"}</span>
                  </div>

                  <div className="flex justify-center md:justify-start gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                    ))}
                  </div>

                  {esMiPerfil ? (
                    <Button
                      className="bg-gradient-to-r from-gray-900 to-gray-600 text-white px-6 py-2.5 rounded-lg hover:from-gray-600 hover:to-gray-500"
                      onClick={() => router.push("/settings/profile_edit")}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editar perfil
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Mensaje
                      </Button>
                      <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
                        <Heart className="w-4 h-4 mr-2" />
                        Seguir
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-900/50 rounded-lg">
                <p className="text-gray-300 text-sm leading-relaxed">
                  {perfil.descripcion || "¡Bienvenido a su perfil!"}
                </p>
              </div>
            </div>
          </div>

          {/* Grid: Habilidades y Certificados */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Habilidades */}
            <div className="bg-[#1E1E1E] border-[#2E2E2E] rounded-xl p-6">
              <h3 className="text-white text-lg font-bold mb-4">Habilidades</h3>
              <div className="flex flex-wrap gap-3">
                {habilidades.length > 0 ? (
                  habilidades.map((skill) => (
                    <span
                      key={skill.id}
                      className="bg-gradient-to-r from-purple-600 to-purple-500 text-white px-4 py-2 rounded-full text-sm font-medium"
                    >
                      #{skill.habilidad_nombre}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-400 text-sm">No hay habilidades agregadas</p>
                )}
              </div>
            </div>

            {/* Certificados */}
            <div className="bg-[#1E1E1E] border-[#2E2E2E] rounded-xl p-6">
              <h4 className="text-white text-lg font-semibold mb-4">Certificados</h4>
              {certificaciones.length === 0 ? (
                <div className="text-center py-4 text-gray-400">Sin certificados</div>
              ) : (
                <div className="space-y-3">
                  {certificaciones.map((cert) => (
                    <div key={cert.id} className="bg-gray-900/50 rounded-lg p-3 border border-gray-800">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <h5 className="text-white font-medium text-sm">{cert.nombre}</h5>
                          <p className="text-gray-400 text-xs">por {cert.institucion}</p>
                        </div>
                        <Badge className={`${getStatusColor(cert.estado)} text-white text-xs px-2 py-1`}>
                          {cert.estado}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}