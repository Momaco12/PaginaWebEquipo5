'use client'
import SettingsPanel from '@/components/ui/settingsPanel'
import { useRouter } from 'next/navigation'

export default function GlobalSettingsPage() {
    const router = useRouter()

    return (
        /* flex-1 ocupa todo el ancho disponible.
           p-8 da espacio interno.
           La Sidebar empujará este contenido automáticamente 
           gracias al SidebarProvider que tienes en tu Layout.
        */
        <main className="flex-1 p-6 md:p-10 bg-slate-50/50 min-h-screen">
            <div className="max-w-4xl mx-auto">
                <SettingsPanel onBack={() => router.back()} />
            </div>
        </main>
    )
}