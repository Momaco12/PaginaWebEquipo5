'use client'
import React from 'react'
import { mockAlerts, Alert } from '@/lib/mockAlerts'
import {Bell, MapPin, Clock} from 'lucide-react'

//ESTILOSSSSSS
const getAlertStyle = (type: Alert['type']) => {
    switch (type) {
        case 'critical': return { backgroundColor: '#fff0f0', borderColor: '#f5c6c6' }
        case 'warning':  return { backgroundColor: '#fffde7', borderColor: '#f5e6a3' }
        default:         return { backgroundColor: '#f0f4ff', borderColor: '#c6d4f5' }
    }
}

const getPriorityStyle = (priority: Alert['priority']) => {
    switch (priority) {
        case 'Alta':  return { backgroundColor: '#fff0f0', color: '#c0392b' }
        case 'Media': return { backgroundColor: '#fff8e1', color: '#e67e22' }
        default:      return { backgroundColor: '#f0f4ff', color: '#2980b9' }
    }
}

const getStatusStyle = (status: Alert['status']) => {
    switch (status) {
        case 'Nueva': return { backgroundColor: '#e8f5e9', color: '#e53935', dot: '#e53935' }
        default:      return { backgroundColor: '#e8f0fe', color: '#1a73e8', dot: '#1a73e8' }
    }
}

const getIcon = (type: Alert['type']) => {
    switch (type) {
        case 'critical': return { symbol: '⚠', color: '#e53935' }
        case 'warning':  return { symbol: '⊙', color: '#f59e0b' }
        default:         return { symbol: 'ℹ', color: '#1a73e8' }
    }
}

export default function AlertsPage() {
    const alerts = mockAlerts
    // TODO: reemplazar por fetch a la API cuando esté lista

    const nuevas       = alerts.filter(a => a.status === 'Nuevas').length
    const criticas     = alerts.filter(a => a.type === 'Críticas').length
    const advertencias = alerts.filter(a => a.type === 'Advertencias').length

    return (
        <div style={{ padding: '2rem', maxWidth: '900px' }}>

            {/* ENCABEZADO */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <Bell size={24} color="#e53935" />
                <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 700 }}>Alertas</h1>
            </div>
            <p style={{ margin: '0 0 1.5rem', color: '#666', fontSize: '0.9rem' }}>
                {alerts.length} alertas encontradas
            </p>

            {/* Cards de resumen */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                {[
                    { label: 'Nuevas',       count: nuevas,       color: '#e53935' },
                    { label: 'Críticas',     count: criticas,     color: '#e53935' },
                    { label: 'Advertencias', count: advertencias, color: '#f59e0b' },
                ].map(card => (
                    <div key={card.label} style={{
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        padding: '0.75rem 1rem',
                        minWidth: '100px',
                        boxSizing: 'border-box',
                    }}>
                        <p style={{ margin: '0 0 0.4rem', fontSize: '0.8rem', color: '#888' }}>{card.label}</p>
                        <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700, color: card.color }}>{card.count}</p>
                    </div>
                ))}
            </div>

            {/* Lista de alertas */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {alerts.map(alert => {
                    const icon       = getIcon(alert.type)
                    const statusSt   = getStatusStyle(alert.status)
                    const prioritySt = getPriorityStyle(alert.priority)

                    return (
                        <div key={alert.id} style={{
                            ...getAlertStyle(alert.type),
                            border: '1px solid',
                            borderRadius: '12px',
                            padding: '1.25rem',
                            boxSizing: 'border-box',
                        }}>
                            {/* Título + badge estado */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <span style={{ color: icon.color, fontSize: '1.1rem' }}>{icon.symbol}</span>
                                <strong style={{ fontSize: '1rem' }}>{alert.title}</strong>
                                <span style={{
                                    ...statusSt,
                                    fontSize: '0.75rem',
                                    padding: '2px 10px',
                                    borderRadius: '999px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                }}>
                                    <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: statusSt.dot, display: 'inline-block' }} />
                                    {alert.status}
                                </span>
                            </div>

                            {/* Descripción */}
                            <p style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', color: '#444', lineHeight: 1.5 }}>
                                {alert.message}
                            </p>

                            {/* Área + tiempo + prioridad */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8rem', color: '#666', marginBottom: '0.75rem' }}>
                                <MapPin size={14} />  {alert.area}
                                <Clock size={14} />   {alert.time}
                                <span style={{
                                    ...prioritySt,
                                    padding: '2px 8px',
                                    borderRadius: '999px',
                                    fontWeight: 600,
                                }}>
                                    {alert.priority}
                                </span>
                            </div>

                            {/* Categoría */}
                            <span style={{
                                backgroundColor: '#e8f0fe',
                                color: '#1a73e8',
                                fontSize: '0.78rem',
                                padding: '3px 12px',
                                borderRadius: '999px',
                            }}>
                                {alert.category}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}