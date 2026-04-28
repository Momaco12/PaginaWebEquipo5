"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/auth';

const LoginPage: React.FC = () => {
    const [tab, setTab] = useState<'login' | 'register'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!email || !password) {
            setError('Por favor ingresa email y contraseña.');
            return;
        }
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, passwordHash: password }),
            });
            if (res.status === 401) {
                setError('Usuario o contraseña incorrectos.');
                return;
            }
            if (!res.ok) {
                setError('Error al iniciar sesión.');
                return;
            }
            const user = await res.json();
            const token = btoa(`${user.email}:${password}`);
            login(token);
            router.replace('/');
        } catch (err) {
            setError('Error al conectar con el servidor.');
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (!email || !password || !name) {
            setError('Por favor completa todos los campos.');
            return;
        }
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, passwordHash: password, nombre_completo: name }),
            });
            if (!res.ok) {
                setError('Error al crear la cuenta.');
                return;
            }
            setSuccess('Cuenta creada. Ya puedes iniciar sesión.');
            setTab('login');
            setEmail('');
            setPassword('');
            setName('');
        } catch (err) {
            setError('Error al conectar con el servidor.');
        }
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center bg-background px-4">
            <div className="absolute inset-0">
                <img
                    src="https://transcode-v2.app.engoo.com/image/fetch/f_auto,c_lfill,w_300,dpr_3/https://assets.app.engoo.com/images/98bO4uMITPHGi7YoAiGG9YYDVzyHwPEYQpPbaMu4jBR.jpeg"
                    alt="Background"
                    className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40" />
            </div>
            <div className="relative w-full max-w-md rounded-lg border border-muted/30 bg-white/90 p-8 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-950/70">

                {/* Tabs */}
                <div className="mb-6 flex border-b border-border">
                    <button
                        type="button"
                        onClick={() => { setTab('login'); setError(''); setSuccess(''); }}
                        className={`mr-4 pb-2 text-sm font-medium ${tab === 'login' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
                    >
                        Iniciar sesión
                    </button>
                    <button
                        type="button"
                        onClick={() => { setTab('register'); setError(''); setSuccess(''); }}
                        className={`pb-2 text-sm font-medium ${tab === 'register' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
                    >
                        Crear cuenta
                    </button>
                </div>

                {/* Login */}
                {tab === 'login' && (
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Contraseña</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                                required
                            />
                        </div>
                        {error && <div className="text-sm text-red-500">{error}</div>}
                        {success && <div className="text-sm text-green-600">{success}</div>}
                        <button type="submit" className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                            Iniciar sesión
                        </button>
                        <button
                            type="button"
                            onClick={() => { setEmail('admin@itesm.mx'); setPassword('pass123'); }}
                            className="w-full rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
                        >
                            Llenar como Admin
                        </button>
                    </form>
                )}

                {/* Registro */}
                {tab === 'register' && (
                    <form onSubmit={handleRegister} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium">Nombre</label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Contraseña</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                                required
                            />
                        </div>
                        {error && <div className="text-sm text-red-500">{error}</div>}
                        <button type="submit" className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                            Crear cuenta
                        </button>
                    </form>
                )}

            </div>
        </div>
    );
};

export default LoginPage;