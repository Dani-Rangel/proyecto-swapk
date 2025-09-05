import "@/globals.css";
import type { AppProps } from 'next/app'
import { LanguageProvider } from "@/components/state/language_change";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ThemeProvider } from "../components/state/theme_context"

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
     
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID as string}>
      <LanguageProvider>
        <ThemeProvider>
        <Component {...pageProps} />
        </ThemeProvider>
      </LanguageProvider>
    </GoogleOAuthProvider>
    
  )
}

if (typeof window !== "undefined") {
  // @ts-ignore
  window.React1 = require("react");
}