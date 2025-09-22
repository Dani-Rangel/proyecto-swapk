import { useLanguage } from "../components/state/language_change"
import { translations } from "./i18n"  // Importación estática

export type Locale = keyof typeof translations

// Hook para traducciones
export function useTranslation() {
  // ✅ El hook useLanguage se usa correctamente dentro de otro hook
  const { lang } = useLanguage()

  // Función para traducir textos
  function t(key: keyof (typeof translations)["es"]): string {
    const translation = translations[lang]?.[key]
    
    if (!translation) {
      console.warn(`Missing translation for key: ${key}`)
      return key // Devuelve la clave como fallback
    }

    return translation
  }

  return { t, lang }
}