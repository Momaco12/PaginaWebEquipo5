import React from 'react';

const alerts = [
    { id: 1, message: 'High temperature detected', type: 'warning' },
    { id: 2, message: 'System update available', type: 'info' },
    { id: 3, message: 'Low battery', type: 'error' },
];

const getAlertStyle = (type: string) => {
    switch (type) {
        case 'warning':
            return { backgroundColor: '#fff3cd', color: '#856404' };
        case 'info':
            return { backgroundColor: '#d1ecf1', color: '#0c5460' };
        case 'error':
            return { backgroundColor: '#f8d7da', color: '#721c24' };
        default:
            return {};
    }
};

export default function AlertsPage() {
    return (
        <div style={{ padding: '2rem' }}>
            <h1>Alerts</h1>
            <ul style={{ listStyle: 'none', padding: 0 }}>
                {alerts.map(alert => (
                    <li
                        key={alert.id}
                        style={{
                            ...getAlertStyle(alert.type),
                            marginBottom: '1rem',
                            padding: '1rem',
                            borderRadius: '4px',
                            border: '1px solid #ccc',
                        }}
                    >
                        {alert.message}
                    </li>
                ))}
            </ul>
        </div>
    );
}