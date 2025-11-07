// components/MainSidebar.tsx
"use client"

import React from "react"
import {
  Search,
  Sun,
  Moon,
  MessageSquare,
  User,
  Settings,
  Home,
  TrendingUp,
  RefreshCw,
  BookOpen,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useTranslation } from "@/lib/useTranslations"
import { Notificaciones } from "@/components/ui/notificaciones/notifications"
import toast from 'react-hot-toast'
import { getCurrentUser, UserData } from "@/lib/auth"

interface MainSidebarProps {
  isDark: boolean
  toggleTheme: () => void
  isSidebarOpen: boolean
  setIsSidebarOpen: (open: boolean) => void
  user: UserData | null
}

export function MainSidebar({
  isDark,
  toggleTheme,
  isSidebarOpen,
  setIsSidebarOpen,
  user
}: MainSidebarProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const pathname = usePathname()

  const navItems = [
    { icon: Home, label: t("home"), href: "/dashboard/index_dashboard" },
    { icon: TrendingUp, label: t("popular"), href: "/popular/popular" },
    { icon: RefreshCw, label: t("exchanges"), href: "/intercambio/intercambio" },
    { icon: BookOpen, label: t("myCourses"), href: "/Cursos/community_courses" },
  ]

  const getInitials = (nombre: string): string => {
    return nombre
      .split(' ')
      .filter(n => n.length > 0)
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase()
  }

  return (
    <div
      className={`fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 h-screen ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      } md:translate-x-0 md:static md:flex flex-col border-r ${
        isDark ? "bg-[#1E1E1E] border-[#2E2E2E]" : "bg-white border-gray-200"
      }`}
    >
      <div className={`p-3 border-b ${isDark ? "border-[#2E2E2E]" : "border-gray-200"}`}>
        <div className="flex items-center gap-2 mb-3">
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

        <div className="relative mb-3">
          <Search
            className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
              isDark ? "text-[#A0A0A0]" : "text-gray-500"
            }`}
          />
          <Input
            placeholder={t("search")}
            className={`pl-10 w-full h-8 border-none shadow-none focus-visible:ring-0 cursor-pointer ${
              isDark
                ? "bg-[#1E1E1E] text-[#F5F5F5] placeholder-[#A0A0A0]"
                : "bg-gray-100 text-gray-900 placeholder-gray-500"
            }`}
          />
        </div>

        <div className="flex gap-1 mb-9">
          <Button
            variant="ghost"
            size="sm"
            className={`flex-1 h-8 cursor-pointer ${
              isDark ? "text-[#A0A0A0] hover:bg-[#2E2E2E]" : "text-gray-600 hover:text-gray-900"
            }`}
            onClick={() => router.push("/message/messages")}
            title={t("messages")}
          >
            <MessageSquare className="w-4 h-4" />
          </Button>

          <div className="flex-1 h-8 flex items-center justify-center">
            <Notificaciones />
          </div>

          <Button
            variant="ghost"
            size="sm"
            className={`flex-1 h-8 cursor-pointer ${
              isDark ? "text-[#A0A0A0] hover:bg-[#2E2E2E]" : "text-gray-600 hover:text-gray-900"
            }`}
            onClick={() => router.push("/profile/profile")}
            title={t("profile")}
          >
            <User className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className={`flex-1 h-8 cursor-pointer ${
              isDark ? "text-[#A0A0A0] hover:bg-[#2E2E2E]" : "text-gray-600 hover:text-gray-900"
            }`}
            onClick={() => router.push("/settings/profile_edit")}
            title={t("settings")}
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>

        {/* Tarjeta de Usuario con Avatar */}
        {user && (
          <div className={`p-3 mb-4 rounded-lg flex items-center gap-3 ${isDark ? "bg-[#2E2E2E]" : "bg-gray-100"}`}>
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center shadow-lg">
              <span className="text-lg font-bold text-white">
                {getInitials(user.nombre)}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-2">
                {user.rol === "Administrador" && (
                  <span className="px-2 py-1 text-xs font-medium bg-red-500/15 text-red-500 rounded-full">
                    🛡️ {t("admin")}
                  </span>
                )}
                {user.rol === "Moderador" && (
                  <span className="px-2 py-1 text-xs font-medium bg-green-500/15 text-green-500 rounded-full">
                    👮 {t("moderator")}
                  </span>
                )}
                {user.rol === "Usuario" && (
                  <span className="px-2 py-1 text-xs font-medium bg-gray-500/15 text-gray-500 rounded-full">
                    👤 {t("user")}
                  </span>
                )}
              </div>

              <p className={`text-sm font-semibold truncate ${isDark ? "text-[#F5F5F5]" : "text-gray-800"}`}>
                {user.nombre}
              </p>

              <p className={`text-[11px] truncate ${isDark ? "text-[#A0A0A0]" : "text-gray-500"}`}>
                {user.correo}
              </p>
            </div>
          </div>
        )}

        {/* Mensaje de Bienvenida */}
        {user && (
          <div className="px-3 pb-2">
            <p className={`text-xs font-medium uppercase tracking-wide ${isDark ? "text-[#888]" : "text-gray-500"}`}>
              {t("welcome")},{" "}
              <span className={`font-semibold ${user.rol === "Administrador" ? "text-red-500" : user.rol === "Moderador" ? "text-green-500" : "text-blue-500"}`}>
                {user.rol === "Administrador" ? t("admin") : user.rol === "Moderador" ? t("moderator") : t("user")}
              </span>
            </p>
          </div>
        )}

        <nav className="space-y-1">
          {navItems.map((item, idx) => {
            const isActive = pathname === item.href
            return (
              <Link key={idx} href={item.href} passHref>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`w-full justify-start h-10 mb-4 cursor-pointer transition-colors gap-4 ${
                    isActive
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : isDark
                        ? "text-[#A0A0A0] hover:bg-[#2E2E2E]"
                        : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <item.icon className="w-4 h-4 mr-2" /> {item.label}
                </Button>
              </Link>
            )
          })}
        </nav>

        {user?.rol === "Moderador" && (
          <div className="mt-4">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
              {t("moderator")}
            </h4>
            <Link href="/Moderador/moderador" passHref>
              <Button
                variant="ghost"
                size="sm"
                className={`w-full justify-start h-8 cursor-pointer transition-colors ${
                  pathname === "/Moderador/moderador"
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : isDark
                      ? "text-[#A0A0A0] hover:bg-[#2E2E2E]"
                      : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {t("moderator")} Panel
              </Button>
            </Link>
          </div>
        )}

        {user?.rol === "Administrador" && (
          <div className="mt-4">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
              {t("admin")}
            </h4>
            <Link href="/admin/admin" passHref>
              <Button
                variant="ghost"
                size="sm"
                className={`w-full justify-start h-8 cursor-pointer transition-colors ${
                  pathname === "/admin/admin"
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : isDark
                      ? "text-[#A0A0A0] hover:bg-[#2E2E2E]"
                      : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {t("admin")} Panel
              </Button>
            </Link>
          </div>
        )}
      </div>

      <div className={`mt-auto p-3 border-t ${isDark ? "border-[#2E2E2E]" : "border-gray-200"}`}>
        <Button
          variant="ghost"
          className={`w-full justify-start ${
            isDark
              ? "text-red-400 hover:bg-red-900 hover:text-white"
              : "text-red-600 hover:bg-red-100 hover:text-red-800"
          } transition-colors duration-200 cursor-pointer`}
          onClick={() => {
            localStorage.removeItem("user")
            toast.success(t("sessionClosed"))
            setTimeout(() => router.push("/auth/login"), 1000)
          }}
        >
          {t("logout")}
        </Button>
      </div>
    </div>
  )
}