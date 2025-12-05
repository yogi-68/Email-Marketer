'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './Navigation.module.css';

export default function Navigation() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // Simple check for MVP - real apps use AuthContext
        const token = localStorage.getItem('token');
        setIsLoggedIn(!!token);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsLoggedIn(false);
        router.push('/');
    };

    return (
        <nav className={styles.nav}>
            <div className="container">
                <div className={styles.navContent}>
                    {/* Logo */}
                    <Link href="/" className={styles.logo}>
                        <span className="text-gradient">Email</span>Marketer
                    </Link>

                    {/* Navigation Links */}
                    <ul className={styles.navLinks}>
                        <li><Link href="/#features">Features</Link></li>
                        <li><Link href="/#pricing">Pricing</Link></li>
                        {isLoggedIn && <li><Link href="/dashboard">Dashboard</Link></li>}
                    </ul>

                    {/* CTA Buttons */}
                    <div className={styles.navActions}>
                        {isLoggedIn ? (
                            <button onClick={handleLogout} className="btn btn-secondary">
                                Log Out
                            </button>
                        ) : (
                            <>
                                <Link href="/login" className="btn btn-secondary">
                                    Log In
                                </Link>
                                <Link href="/signup" className="btn btn-primary">
                                    Start Free Trial
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button className={styles.mobileMenuBtn} aria-label="Toggle menu">
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>
                </div>
            </div>
        </nav>
    );
}
