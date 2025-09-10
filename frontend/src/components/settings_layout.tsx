"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/router"
import {
  ArrowLeft,
  User,
  Shield,
  HelpCircle,
  Globe,
  Palette,
  Archive,
  Eye,
  Award,
  Upload,
  CheckCircle,
  Bell,
  LogOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslation } from "../lib/useTranslations"

interface SettingsLayoutProps {
  children: React.ReactNode
  title?: string
}

export default function SettingsLayout({ children, title }: SettingsLayoutProps) {
  const router = useRouter()
  const { t } = useTranslation()
  const [activeSection, setActiveSection] = useState(router.pathname.split("/").pop() || "profile_edit")

  const menuItems = [
    {
      category: t("account_settings"),
      items: [
        { id: "change_email", label: t("change_email"), icon: User },
        { id: "change_password", label: t("change_password"), icon: Shield },
        { id: "delete_account", label: t("delete_account"), icon: User },
        { id: "notifications", label: t("notifications"), icon: Bell },
      ],
    },
    {
      category: t("platform_preferences"),
      items: [
        { id: "language", label: t("language"), icon: Globe },
        { id: "theme", label: t("theme"), icon: Palette },
        { id: "preferred_mode", label: t("my_files"), icon: Archive },
        { id: "activity_privacy", label: t("activity_privacy"), icon: Eye },
      ],
    },
    {
      category: t("privacy_security"),
      items: [
        { id: "certifications", label: t("certifications"), icon: Award },
        { id: "upload_documents", label: t("upload_documents"), icon: Upload },
        { id: "verification_status", label: t("verification_status"), icon: CheckCircle },
      ],
    },
    {
      category: t("extra_options"),
      items: [
        { id: "help_center", label: t("help_center"), icon: HelpCircle },
      ],
    },
  ]

  const handleLogout = () => {
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"

    router.push("/auth/login")
  }

  const handleNavigation = (itemId: string) => {
    setActiveSection(itemId)
    router.push(`/settings/${itemId}`)
  }

  return (
    <div className="min-h-screen bg-[#141414] text-white">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-80 bg-[#121212] border-r border-gray-800 min-h-screen flex flex-col">
          <div className="p-6 flex-1">
            <div className="flex items-center gap-3 mb-8">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard/index_dashboard')}
                className="text-gray-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h1 className="text-xl font-semibold">{t("settings")}</h1>
            </div>

            <nav className="space-y-6">
              {menuItems.map((section) => (
                <div key={section.category}>
                  <h3 className="text-sm font-medium text-gray-400 mb-3">{section.category}</h3>
                  <ul className="space-y-1">
                    {section.items.map((item) => {
                      const Icon = item.icon
                      const isActive = activeSection === item.id
                      return (
                        <li key={item.id}>
                          <button
                            onClick={() => handleNavigation(item.id)}
                            className={`cursor-pointer w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                              isActive 
                                ? "bg-blue-600 text-white" 
                                : "text-gray-300 hover:bg-gray-800 hover:text-white"
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            <span className="text-sm">{item.label}</span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </nav>
          </div>

          {/* Logout */}
          <div className="p-6 border-t border-gray-800">
            <Button
              variant="ghost"
              className="w-full flex items-center gap-3 text-red-400 hover:bg-red-900/30 hover:text-red-300 justify-start px-3 py-2 rounded-lg transition-colors"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              <span className="cursor-pointer text-sm font-medium">{t("logout")}</span>
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              {title && <h2 className="text-2xl font-bold">{title}</h2>}
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
