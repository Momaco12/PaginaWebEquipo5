export interface Alert {
    id: number;
    title: string;
    message: string;
    type: 'critical' | 'warning' | 'info';
    status: string;
    area: string;
    time: string;
    priority: 'Alta' | 'Media' | 'Baja';
    category: string;
}

export const mockAlerts: Alert[] = [
    {
        id: 1,
        title: 'Humedad del suelo crítica',
        message: 'La humedad del suelo ha bajado a 18% uwu onichan.',
        type: 'critical',
        status: 'Nueva',
        area: 'Área 1 - Nogal',
        time: 'Hace 18 min',
        priority: 'Alta',
        category: 'Riego',
    },
    // ... poner más alertas
]