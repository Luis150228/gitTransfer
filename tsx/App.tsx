// src/App.tsx
import { useState } from 'react'
import './App.css'

// Componentes existentes en tu zip
import { BentoGrid } from './components/BentoGrid'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { Sidebar } from './components/Sidebar'
import Vinheta from './components/Vinheta'

// Nuevo: toggle de tema (usa el hook que te dejé)
import { ThemeToggle } from './components/ThemeToggle'

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="h-full grid grid-rows-[auto_1fr_auto]">
      {/* Header con su prop original */}
      <Header onToggleSidebar={() => setSidebarOpen((v) => !v)} />

      <div className="grid md:grid-cols-[18rem_1fr] h-[calc(100dvh-3.5rem)] md:h-auto">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Bloque superior: mantenido como en tu proyecto */}
            <div className="flex items-center justify-between">
              <div>
                {/* Coloca aquí tus títulos/subtítulos si los tenías */}
                {/* ... */}
              </div>

              {/* Muevo Vinheta aquí si quieres que siga al tope; puedes dejarlo como estaba */}
              <Vinheta />
            </div>

            {/* Tu grid bento tal cual */}
            <BentoGrid />
          </div>
        </main>
      </div>

      <Footer />

      {/* Botón flotante para alternar Light/Dark (mínimo invasivo) */}
      <div className="fixed bottom-4 right-4 z-50">
        <ThemeToggle />
      </div>
    </div>
  )
}
