'use client';

import { useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
        } catch (err: any) {
            setError(err?.detail || err?.message || 'Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#FAF9F6]">
            <div className="w-full max-w-sm space-y-8">
                <div className="text-center">
                    <svg viewBox="0 0 48 42" className="h-10 w-10 mx-auto mb-4" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g transform="scale(1.12) translate(-1,-1)">
                            <path d="M8.54931 29.4455L13.8414 35.9711C13.906 36.0508 13.9578 36.1401 14.0068 36.2302C14.3773 36.9129 14.9904 36.9386 15.3299 36.2802C15.3923 36.1592 15.4125 36.0216 15.4125 35.8854L15.4125 29.4455L8.54931 29.4455Z" fill="#1a1a1a" />
                            <path d="M31.7069 1.72461H35.4092C36.9208 1.72461 38.1461 2.94996 38.1461 4.46151V11.1064C38.1461 11.8851 38.4778 12.6269 39.0581 13.1461L41.3962 15.2381L39.0581 17.3301C38.4778 17.8493 38.1461 18.5911 38.1461 19.3697V25.6725C38.1461 27.1841 36.9208 28.4094 35.4092 28.4094H31.7069" stroke="#5867EF" strokeWidth="3.079" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M25.7264 28.4094L7.52649 28.4094C6.01494 28.4094 4.78958 27.1841 4.78958 25.6725L4.78958 19.0276C4.78958 18.249 4.45792 17.5072 3.87763 16.988L1.53951 14.896L3.87763 12.8039C4.45792 12.2847 4.78958 11.543 4.78958 10.7643L4.78958 4.4615C4.78958 2.94995 6.01494 1.7246 7.52649 1.7246L25.7264 1.7246" stroke="#1a1a1a" strokeWidth="3.079" strokeLinecap="round" strokeLinejoin="round" />
                        </g>
                    </svg>
                    <h1 className="text-xl font-bold text-gray-900">Sign in to AgentClaw</h1>
                    <p className="text-sm text-gray-500 mt-1">AI Agent Management Platform</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Email
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                                autoFocus
                                className="bg-white border-gray-200 text-gray-900 h-10"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Password
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                required
                                className="bg-white border-gray-200 text-gray-900 h-10"
                            />
                        </div>

                        {error && (
                            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                                {error}
                            </p>
                        )}

                        <Button
                            type="submit"
                            disabled={loading || !email || !password}
                            className="w-full bg-gray-900 hover:bg-gray-800 text-white h-10"
                        >
                            {loading ? 'Signing in...' : 'Sign in'}
                        </Button>
                    </div>
                </form>

                <p className="text-center text-xs text-gray-400">
                    AINative Studio
                </p>
            </div>
        </div>
    );
}
