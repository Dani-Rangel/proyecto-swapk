"use client"

import { createContext, useContext, useEffect, useState } from "react"

type Language = "es" | "en"

const LanguageContext = createContext<{
  lang: Language
  setLang: (lang: Language) => void
}>({
  lang: "es",
  setLang: () => {},
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>("es")
    console.log("LanguageProvider mounted");
  // Cargar idioma al iniciar
  useEffect(() => {
    const saved = localStorage.getItem("appLanguage") as Language | null
    if (saved && ["es", "en"].includes(saved)) {
      setLang(saved)
    } else {
      const browserLang = navigator.language.startsWith("es") ? "es" : "en"
      setLang(browserLang)
    }
  }, [])

  // Guardar en localStorage cuando cambia
  useEffect(() => {
    localStorage.setItem("appLanguage", lang)
  }, [lang])

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)