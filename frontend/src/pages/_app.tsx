import "@/globals.css";
import type { AppProps } from 'next/app'
import Head from "next/head";
import { LanguageProvider } from "@/components/state/language_change";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ThemeProvider } from "../components/state/theme_context"
import { NotificacionesProvider } from "../context/notificacionesContext";
import { VideoCallProvider } from "@/components/state/video_call_provider";
import { NotificacionesList } from "@/components/ui/notificaciones/notificacionesList"

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
          <title>Swapk - Intercambia Conocimientos</title>
          <meta name="description" content="Plataforma de trueque de conocimientos y habilidades." />
          <link rel="icon" href="/img/logoswapk.png" />
      </Head>
      <VideoCallProvider>
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID as string}>
          <LanguageProvider>
            <NotificacionesProvider>
              <ThemeProvider>
                <Component {...pageProps} />
              </ThemeProvider>
              <NotificacionesList />
            </NotificacionesProvider>
          </LanguageProvider>
        </GoogleOAuthProvider>
      </VideoCallProvider>
    </>
  )
}

if (typeof window !== "undefined") {
  // @ts-ignore
  window.React1 = require("react");
}