"use client"

import { Button } from "@/components/ui/button"

export default function EmptyChat() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-6">
      {/* Logo o ícono representativo de Swapk */}
      <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center mb-6">
        <span className="text-white text-4xl font-bold">S</span>
      </div>

      {/* Mensaje principal */}
      <h2 className="text-2xl font-semibold text-white mb-2">Bienvenido a Swapk</h2>
      <p className="text-gray-400 mb-6 max-w-md">
        Aquí aparecerán tus conversaciones. Empieza a interactuar con otros usuarios para ver tus chats aquí.
      </p>

      {/* Botón para iniciar un chat (opcional) */}
      <Button className="bg-blue-600 hover:bg-blue-700">
        Iniciar chat
      </Button>
    </div>
  )
}
