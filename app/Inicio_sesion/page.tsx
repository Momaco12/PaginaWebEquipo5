"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/auth';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            setError('Please enter email and password.');
            return;
        }
        setError('');
        const token = btoa(`${email}:${password}`);
        login(token);
        router.replace('/');
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
                <h2 className="mb-6 text-2xl font-semibold">Login</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
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
                        <label className="block text-sm font-medium">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                            required
                        />
                    </div>
                    {error && <div className="text-sm text-destructive">{error}</div>}
                    <button type="submit" className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                        Login
                    </button>
                    {/* Botón para llenar credenciales de admin — solo para pruebas */}
                    <button
                        type="button"
                        onClick={() => {
                            setEmail('admin@itesm.mx')
                            setPassword('pass123')
                        }}
                        className="w-full rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
                    >
                        Llenar como Admin 
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;