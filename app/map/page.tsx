'use client'
// Usamos llaves { } porque MyMap no es un 'default export'
import { MyMap } from '@/components/ui/mymap' 

export default function MapPage() {
    return (
        <div style={{ width: '100%', height: '100vh', padding: '20px' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                Monitoreo de Riego - Chihuahua City
            </h1>
            <div style={{ height: 'calc(100% - 60px)', border: '1px solid #ddd', borderRadius: '12px', overflow: 'hidden' }}>
                {/* Ahora usamos el nombre exacto de la función que importamos */}
                <MyMap />
            </div>
        </div>
    )
}