'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

import { api } from '@/lib/api';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await api.auth.login({ email, password });
            localStorage.setItem('token', response.access_token);
            localStorage.setItem('user', JSON.stringify(response.user));
            window.location.href = '/dashboard';
        } catch (err: any) {
            setError(err.message || 'Failed to login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.glassCard}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Welcome Back</h1>
                    <p className={styles.subtitle}>Sign in to your account</p>
                </div>

                {error && (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid rgba(239, 68, 68, 0.5)',
                        color: '#fca5a5',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        marginBottom: '1.5rem',
                        textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@company.com"
                            required
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <div className={styles.actions}>
                        <label className={styles.remember}>
                            <input type="checkbox" />
                            <span>Remember me</span>
                        </label>
                        <Link href="/forgot-password" className={styles.forgot}>
                            Forgot password?
                        </Link>
                    </div>

                    <button type="submit" className={styles.submitBtn} disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div className={styles.footer}>
                    <p>
                        Don't have an account?{' '}
                        <Link href="/signup" className={styles.link}>
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
