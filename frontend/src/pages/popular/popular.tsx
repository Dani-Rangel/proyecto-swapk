// src/pages/popular/popular.tsx
"use client";

declare global {
  namespace JSX {
    interface Element extends React.ReactElement<any, any> {}
    interface ElementClass extends React.Component<any> {}
    interface ElementAttributesProperty {
      props: {};
    }
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}


import React, { useEffect, useState, useRef } from "react"; // 👈 Importamos React para JSX
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import toast from "react-hot-toast";
import axios from "axios";
import { MainSidebar } from "@/components/MainSidebar";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronLeft, ChevronRight } from "lucide-react";

// Configuración de API
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000",
});

api.interceptors.request.use((config) => {
  const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
    } catch (e) {
      console.error("Error parsing user", e);
    }
  }
  return config;
});

// Tipos
interface UsuarioBase {
  id: number;
  nombre: string;
}

interface ResenaResponse {
  id: number;
  intercambio_id: number;
  autor: UsuarioBase;
  destinatario: UsuarioBase;
  calificacion: number;
  comentario: string;
  fecha: string;
}

// Componente Carousel genérico
const Carousel = ({ 
  title, 
  reseñas, 
  isDark,
  showArrows = true,
  renderItem
}: { 
  title: string; 
  reseñas: ResenaResponse[]; 
  isDark: boolean;
  showArrows?: boolean;
  renderItem: (r: ResenaResponse) => JSX.Element;
}) => {
  const carouselRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = 350;
      carouselRef.current.scrollBy({
        left: direction === 'right' ? scrollAmount : -scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (reseñas.length === 0) return null;

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className={`text-lg font-semibold ${isDark ? "text-[#F5F5F5]" : "text-gray-900"}`}>
          {title}
        </h2>
        {showArrows && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => scroll('left')}
              className={isDark ? "bg-[#2E2E2E] border-[#404040] text-[#A0A0A0]" : "bg-white border-gray-300 text-gray-600"}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => scroll('right')}
              className={isDark ? "bg-[#2E2E2E] border-[#404040] text-[#A0A0A0]" : "bg-white border-gray-300 text-gray-600"}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
      
      <div 
        ref={carouselRef}
        className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide"
        style={{ 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none',
          padding: '8px'
        }}
      >
        {reseñas.map((r) => (
          <div key={r.id} className="flex-shrink-0 w-96 rounded-lg p-4">
            {renderItem(r)}
          </div>
        ))}
      </div>
    </section>
  );
};

// Componente para reseñas personales (recibidas/escritas)
const ReseñaPersonal = ({ r, isDark }: { r: ResenaResponse, isDark: boolean }) => {
  return (
    <div className={`rounded-lg p-4 ${
      isDark ? "bg-[#2E2E2E] border-[#404040] border" : "bg-white border-gray-200 border"
    }`}>
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
          {r.autor.nombre.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm ${isDark ? "text-[#F5F5F5]" : "text-gray-900"}`}>
            {r.autor.nombre}
          </p>
          <div className="flex items-center mt-1">
            {[...Array(5)].map((_, i) => (
              <span 
                key={i} 
                className={`text-yellow-400 ${i < Math.floor(r.calificacion) ? 'opacity-100' : 'opacity-30'}`}
              >
                ★
              </span>
            ))}
            <span className={`ml-1 text-xs ${isDark ? "text-[#A0A0A0]" : "text-gray-500"}`}>
              {r.calificacion.toFixed(1)}
            </span>
          </div>
        </div>
      </div>
      <p className={`text-sm italic ${isDark ? "text-[#A0A0A0]" : "text-gray-600"} line-clamp-2`}>
        "{r.comentario}"
      </p>
      <small className={`text-xs mt-2 block ${isDark ? "text-[#606060]" : "text-gray-400"}`}>
        {new Date(r.fecha).toLocaleDateString()}
      </small>
    </div>
  );
};

// Componente para reseñas completas (todas las reseñas)
const ReseñaCompleta = ({ r, isDark }: { r: ResenaResponse, isDark: boolean }) => {
  return (
    <div className={`rounded-lg p-6 max-w-3xl w-full h-45 ${
      isDark ? "bg-[#2E2E2E] border-[#404040] border" : "bg-white border-gray-200 border"
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">
            {r.autor.nombre.charAt(0).toUpperCase()}
          </div>
          <span className={`font-semibold text-sm ${isDark ? "text-[#F5F5F5]" : "text-gray-900"}`}>
            {r.autor.nombre}
          </span>
          <span className={isDark ? "text-[#A0A0A0]" : "text-gray-500"}>→</span>
          <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-bold">
            {r.destinatario.nombre.charAt(0).toUpperCase()}
          </div>
          <span className={`font-semibold text-sm ${isDark ? "text-[#F5F5F5]" : "text-gray-900"}`}>
            {r.destinatario.nombre}
          </span>
        </div>
      </div>
      <p className={`text-sm italic ${isDark ? "text-[#A0A0A0]" : "text-gray-600"} line-clamp-3`}>
        "{r.comentario}"
      </p>
      <div className="w-full flex justify-between items-center">
        <small className={`text-xs mt-2 block ${isDark ? "text-[#606060]" : "text-gray-400"}`}>
        {new Date(r.fecha).toLocaleDateString()}
      </small>
      <div className="flex items-center">
          {[...Array(5)].map((_, i) => (
            <span 
              key={i} 
              className={`text-yellow-400 ${i < Math.floor(r.calificacion) ? 'opacity-100' : 'opacity-30'}`}
            >
              ★
            </span>
          ))}
          <span className={`ml-1 text-xs ${isDark ? "text-[#A0A0A0]" : "text-gray-500"}`}>
            {r.calificacion.toFixed(1)}
          </span>
        </div>
      </div>
    </div>
  );
};


export default function MisResenas() {
  const router = useRouter();
  
  // Estados del sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const toggleTheme = () => setIsDark(!isDark);

  // Estados de la página
  const [reseñasRecibidas, setReseñasRecibidas] = useState<ResenaResponse[]>([]);
  const [reseñasEscritas, setReseñasEscritas] = useState<ResenaResponse[]>([]);
  const [todasLasResenas, setTodasLasResenas] = useState<ResenaResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Cargar usuario al montar
  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.push("/auth/login");
      return;
    }
    setCurrentUser(user);
  }, [router]);

  // Cargar reseñas
  useEffect(() => {
    if (!currentUser) return;

    const cargarResenas = async () => {
      try {
        const [recibidasRes, escritasRes, todasRes] = await Promise.all([
          api.get("/intercambios/resenas/mias"),
          api.get("/intercambios/resenas/escritas"),
          api.get("/intercambios/resenas/todas"),
        ]);

        setReseñasRecibidas(recibidasRes.data);
        setReseñasEscritas(escritasRes.data);
        setTodasLasResenas(todasRes.data);
      } catch (error: any) {
        console.error("Error:", error);
        toast.error("Error al cargar reseñas");
        router.push("/auth/login");
      } finally {
        setLoading(false);
      }
    };

    cargarResenas();
  }, [currentUser, router]);

  if (loading) {
    return (
      <div className="flex h-screen">
        <MainSidebar
          isDark={isDark}
          toggleTheme={toggleTheme}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          user={currentUser}
        />
        <div className="flex-1 flex items-center justify-center">
          Cargando...
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen ${isDark ? "bg-[#1A1A1A]" : "bg-gray-50"} text-gray-900 dark:text-gray-100`}>
      {/* Botón hamburguesa (solo móvil) */}
      <div className="absolute top-4 left-4 md:hidden z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={isDark ? "text-gray-300" : "text-gray-600"}
        >
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
      </div>

      {/* Sidebar */}
      <MainSidebar
        isDark={isDark}
        toggleTheme={toggleTheme}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        user={currentUser}
      />

      {/* Contenido principal - Ajustado para ocupar todo el espacio */}
      <div className="flex-1 transition-all duration-300 ml-0 md:ml-0 p-0 overflow-y-auto">
        <div className="h-full">
          {/* Encabezado */}
          <div className={`p-6 ${isDark ? "bg-[#1E1E1E]" : "bg-white"} border-b ${isDark ? "border-[#2E2E2E]" : "border-gray-200"}`}>
            <h1 className={`text-2xl font-bold ${isDark ? "text-[#F5F5F5]" : "text-gray-900"}`}>
              Mis reseñas
            </h1>
          </div>

          {/* Sección de reseñas personales (lado a lado) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            <div className={`${isDark ? "bg-[#1E1E1E]" : "bg-white"} rounded-lg p-4`}>
              <Carousel 
                title="Reseñas que recibí" 
                reseñas={reseñasRecibidas} 
                isDark={isDark} 
                renderItem={(r) => <ReseñaPersonal r={r} isDark={isDark} />}
              />
            </div>
            
            <div className={`${isDark ? "bg-[#1E1E1E]" : "bg-white"} rounded-lg p-4`}>
              <Carousel 
                title="Reseñas que escribí" 
                reseñas={reseñasEscritas} 
                isDark={isDark} 
                renderItem={(r) => <ReseñaPersonal r={r} isDark={isDark} />}
              />
            </div>
          </div>

          {/* Sección de todas las reseñas */}
          <div className={`p-6 ${isDark ? "bg-[#1E1E1E]" : "bg-white"}`}>
            <Carousel 
              title="Todas las reseñas" 
              reseñas={todasLasResenas} 
              isDark={isDark} 
              showArrows={true}
              renderItem={(r) => <ReseñaCompleta r={r} isDark={isDark} />}
            />
          </div>
        </div>
      </div>
    </div>
  );
}