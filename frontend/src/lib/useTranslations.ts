import { useLanguage } from "../components/state/language_change"
import { translations } from "./i18n"

// Idiomas disponibles
export type Locale = keyof typeof translations

// Todas las claves válidas (basadas en español)
export type TranslationKey = keyof typeof translations["es"]

// 🔐 Traducciones tipadas de forma segura
const typedTranslations = translations as Record<
  Locale,
  Record<TranslationKey, string>
>

// Hook de traducción
export function useTranslation() {
  const { lang } = useLanguage()
  const locale = lang as Locale

  function t(key: TranslationKey): string {
    const translation =
      typedTranslations[locale][key] ?? typedTranslations.es[key]

    if (!translation) {
      console.warn(
        `No se ha encontrado la traducción de: "${key}" en el idioma "${locale}"`
      )
      return key
    }

    return translation
  }

  return { t, lang }
}}
