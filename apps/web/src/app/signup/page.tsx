'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from '../login/page.module.css'; // Reuse login styles for consistency

import { api } from '@/lib/api';

export default function SignupPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await api.auth.register({ email, password, name });
            localStorage.setItem('token', response.access_token);
            localStorage.setItem('user', JSON.stringify(response.user));
            window.location.href = '/dashboard';
        } catch (err: any) {
            setError(err.message || 'Failed to create account');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.glassCard}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Create Account</h1>
                    <p className={styles.subtitle}>Start your 14-day free trial</p>
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
                        <label htmlFor="name">Full Name</label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="John Doe"
                            required
                        />
                    </div>

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
                            placeholder="Create a strong password"
                            required
                            minLength={8}
                        />
                    </div>

                    <div className={styles.actions}>
                        <label className={styles.remember}>
                            <input type="checkbox" required />
                            <span>I agree to the Terms & Privacy Policy</span>
                        </label>
                    </div>

                    <button type="submit" className={styles.submitBtn} disabled={loading}>
                        {loading ? 'Creating Account...' : 'Get Started'}
                    </button>
                </form>

                <div className={styles.footer}>
                    <p>
                        Already have an account?{' '}
                        <Link href="/login" className={styles.link}>
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
