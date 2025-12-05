'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import styles from './page.module.css';

declare global {
    interface Window {
        Razorpay: any;
    }
}

export default function BillingPage() {
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Load Razorpay script
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
        return () => {
            document.body.removeChild(script);
        };
    }, []);

    const handleSubscribe = async (plan: 'pro' | 'enterprise', amount: number) => {
        setLoading(true);
        try {
            // 1. Create order on backend
            const order = await api.payment.createOrder(amount);

            // 2. Initialize Razorpay options
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_YOUR_KEY_ID',
                amount: order.amount,
                currency: order.currency,
                name: 'Email Marketer',
                description: `${plan.toUpperCase()} Plan Subscription`,
                order_id: order.id,
                handler: async function (response: any) {
                    // 3. Verify payment on backend
                    try {
                        await api.payment.verifyPayment({
                            orderId: response.razorpay_order_id,
                            paymentId: response.razorpay_payment_id,
                            signature: response.razorpay_signature,
                            amount: amount, // Pass the original amount to verify plan
                        });
                        alert('Subscription successful!');
                        // Redirect or update user state
                    } catch (error) {
                        alert('Payment verification failed');
                    }
                },
                prefill: {
                    name: 'Yogesh', // Fetch from user context
                    email: 'yogesh@example.com',
                    contact: '9999999999',
                },
                theme: {
                    color: '#8b5cf6',
                },
            };

            // 4. Open checkout
            const rzp1 = new window.Razorpay(options);
            rzp1.open();
        } catch (error) {
            console.error('Payment failed', error);
            alert('Failed to initiate payment');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Upgrade Your Plan</h1>
            <p className={styles.subtitle}>Choose the perfect plan for your business</p>

            <div className={styles.grid}>
                {/* Free Plan */}
                <div className={styles.card}>
                    <h2>Free</h2>
                    <div className={styles.price}>₹0<span>/month</span></div>
                    <ul className={styles.features}>
                        <li>1,000 Emails/month</li>
                        <li>Basic Analytics</li>
                        <li>Community Support</li>
                    </ul>
                    <button className={styles.currentBtn} disabled>Current Plan</button>
                </div>

                {/* Pro Plan */}
                <div className={`${styles.card} ${styles.popular}`}>
                    <div className={styles.badge}>Most Popular</div>
                    <h2>Pro</h2>
                    <div className={styles.price}>₹2,999<span>/month</span></div>
                    <ul className={styles.features}>
                        <li>50,000 Emails/month</li>
                        <li>Advanced Analytics</li>
                        <li>Priority Support</li>
                        <li>AI Optimization</li>
                    </ul>
                    <button
                        className={styles.upgradeBtn}
                        onClick={() => handleSubscribe('pro', 2999)}
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : 'Upgrade to Pro'}
                    </button>
                </div>

                {/* Enterprise Plan */}
                <div className={styles.card}>
                    <h2>Enterprise</h2>
                    <div className={styles.price}>₹9,999<span>/month</span></div>
                    <ul className={styles.features}>
                        <li>Unlimited Emails</li>
                        <li>Dedicated Success Manager</li>
                        <li>Custom Integrations</li>
                        <li>SLA Guarantee</li>
                    </ul>
                    <button
                        className={styles.upgradeBtn}
                        onClick={() => handleSubscribe('enterprise', 9999)}
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : 'Contact Sales'}
                    </button>
                </div>
            </div>
        </div>
    );
}
