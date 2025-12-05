'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';
import CampaignForm from '@/components/CampaignForm';
import CampaignChart from '@/components/CampaignChart';
import { api } from '@/lib/api';

interface Campaign {
    id: string;
    name: string;
    status: 'draft' | 'scheduled' | 'sending' | 'complete';
    recipients: number;
    sent: number;
    openRate: number;
    clickRate: number;
    useSTO: boolean;
    createdAt: string;
}

interface WarmupStatus {
    currentDay: number;
    dailyLimit: number;
    sentToday: number;
}

interface ReputationMetrics {
    bounceRate: number;
    complaintRate: number;
}

export default function DashboardPage() {
    const [showNewCampaignModal, setShowNewCampaignModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [warmupStatus, setWarmupStatus] = useState<WarmupStatus | null>(null);
    const [reputation, setReputation] = useState<ReputationMetrics | null>(null);

    const [campaigns, setCampaigns] = useState<Campaign[]>([
        {
            id: '1',
            name: 'Welcome Series - Week 1',
            status: 'complete',
            recipients: 1500,
            sent: 1500,
            openRate: 42.3,
            clickRate: 18.7,
            useSTO: true,
            createdAt: '2023-11-15',
        },
        {
            id: '2',
            name: 'Product Launch Announcement',
            status: 'sending',
            recipients: 5000,
            sent: 3200,
            openRate: 38.5,
            clickRate: 15.2,
            useSTO: true,
            createdAt: '2023-11-20',
        },
        {
            id: '3',
            name: 'Monthly Newsletter',
            status: 'scheduled',
            recipients: 8000,
            sent: 0,
            openRate: 0,
            clickRate: 0,
            useSTO: false,
            createdAt: '2023-11-25',
        },
    ]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch warmup status for a demo customer ID
                // In a real app, this would come from the authenticated user context
                const status = await api.email.getWarmupStatus('customer-123').catch(() => null);
                if (status) {
                    setWarmupStatus({
                        currentDay: status.currentDay || 1,
                        dailyLimit: status.allowedToday || 50,
                        sentToday: (status.allowedToday || 50) - (status.remainingToday || 50)
                    });
                } else {
                    // Fallback mock data if API is not running
                    setWarmupStatus({
                        currentDay: 15,
                        dailyLimit: 6400,
                        sentToday: 2100
                    });
                }

                const rep = await api.email.getReputation().catch(() => null);
                if (rep) {
                    setReputation(rep);
                }

                // Fetch campaigns
                const fetchedCampaigns = await api.email.getCampaigns().catch(() => null);
                if (fetchedCampaigns && fetchedCampaigns.length > 0) {
                    setCampaigns(fetchedCampaigns.map((c: any) => ({
                        id: c.id,
                        name: c.name,
                        status: c.status,
                        recipients: c.recipientsCount,
                        sent: c.sentCount,
                        openRate: c.sentCount > 0 ? Number(((c.openCount / c.sentCount) * 100).toFixed(1)) : 0,
                        clickRate: c.sentCount > 0 ? Number(((c.clickCount / c.sentCount) * 100).toFixed(1)) : 0,
                        useSTO: c.useSTO,
                        createdAt: new Date(c.createdAt).toISOString().split('T')[0],
                    })));
                }
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleCreateCampaign = async (data: any) => {
        try {
            const result = await api.email.sendBulk({
                ...data,
                customerId: 'customer-123', // Hardcoded for MVP, ideally from auth context
                recipients: data.recipients // Use parsed recipients from form
            });

            // Add to local state immediately for better UX
            const newCampaign: Campaign = {
                id: result.campaignId || Date.now().toString(),
                name: data.name,
                status: 'scheduled',
                recipients: data.recipients.length,
                sent: 0,
                openRate: 0,
                clickRate: 0,
                useSTO: data.useSTO,
                createdAt: new Date().toISOString().split('T')[0],
            };

            setCampaigns([newCampaign, ...campaigns]);
            setShowNewCampaignModal(false);
            alert('Campaign created successfully!');
        } catch (error: any) {
            console.error('Failed to create campaign:', error);
            alert(`Failed to create campaign: ${error.message || 'Unknown error'}`);
        }
    };

    const getStatusBadge = (status: Campaign['status']) => {
        const statusMap = {
            draft: { label: 'Draft', class: styles.statusDraft },
            scheduled: { label: 'Scheduled', class: styles.statusScheduled },
            sending: { label: 'Sending', class: styles.statusSending },
            complete: { label: 'Complete', class: styles.statusComplete },
        };
        const { label, class: className } = statusMap[status];
        return <span className={`${styles.statusBadge} ${className}`}>{label}</span>;
    };

    return (
        <div className="container">
            {/* Header */}
            <div className={styles.header}>
                <div>
                    <h1>Campaign Dashboard</h1>
                    <p className={styles.subtitle}>Manage and monitor your email campaigns</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <a href="/billing" className="btn btn-secondary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                        💎 Upgrade
                    </a>
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowNewCampaignModal(true)}
                    >
                        + New Campaign
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className={`grid grid-3 ${styles.statsGrid}`}>
                <div className="glass-card">
                    <div className={styles.statIcon}>📧</div>
                    <h3>{campaigns.reduce((acc, c) => acc + c.sent, 0).toLocaleString()}</h3>
                    <p>Total Emails Sent</p>
                    <div className={styles.statTrend}>
                        <span className={styles.trendUp}>↑ 23%</span>
                        <span>vs last month</span>
                    </div>
                </div>

                <div className="glass-card">
                    <div className={styles.statIcon}>📊</div>
                    <h3>
                        {reputation ? `${(reputation.bounceRate * 100).toFixed(2)}%` : '1.2%'}
                    </h3>
                    <p>Bounce Rate</p>
                    <div className={styles.statTrend}>
                        <span className={styles.trendUp} style={{ color: '#05ffa1' }}>Good</span>
                        <span>(Target &lt; 5%)</span>
                    </div>
                </div>

                <div className="glass-card">
                    <div className={styles.statIcon}>🎯</div>
                    <h3>
                        {reputation ? `${(reputation.complaintRate * 100).toFixed(2)}%` : '0.05%'}
                    </h3>
                    <p>Complaint Rate</p>
                    <div className={styles.statTrend}>
                        <span className={styles.trendUp} style={{ color: '#05ffa1' }}>Excellent</span>
                        <span>(Target &lt; 0.1%)</span>
                    </div>
                </div>
            </div>

            {/* Performance Chart */}
            <CampaignChart campaigns={campaigns} />

            {/* Campaigns Table */}
            <div className={`glass-card ${styles.campaignsSection}`}>
                <h2>Recent Campaigns</h2>

                <div className={styles.tableContainer}>
                    <table className={styles.campaignsTable}>
                        <thead>
                            <tr>
                                <th>Campaign Name</th>
                                <th>Status</th>
                                <th>Recipients</th>
                                <th>Sent</th>
                                <th>Open Rate</th>
                                <th>Click Rate</th>
                                <th>STO</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {campaigns.map((campaign) => (
                                <tr key={campaign.id}>
                                    <td>
                                        <strong>{campaign.name}</strong>
                                    </td>
                                    <td>{getStatusBadge(campaign.status)}</td>
                                    <td>{campaign.recipients.toLocaleString()}</td>
                                    <td>
                                        {campaign.sent.toLocaleString()}
                                        {campaign.status === 'sending' && (
                                            <div className={styles.progressBar}>
                                                <div
                                                    className={styles.progressFill}
                                                    style={{ width: `${(campaign.sent / campaign.recipients) * 100}%` }}
                                                />
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        {campaign.openRate > 0 ? (
                                            <span className={styles.metricGood}>
                                                {campaign.openRate}%
                                            </span>
                                        ) : '—'}
                                    </td>
                                    <td>
                                        {campaign.clickRate > 0 ? (
                                            <span className={styles.metricGood}>
                                                {campaign.clickRate}%
                                            </span>
                                        ) : '—'}
                                    </td>
                                    <td>
                                        {campaign.useSTO ? (
                                            <span className={styles.stoEnabled}>✓ Enabled</span>
                                        ) : (
                                            <span className={styles.stoDisabled}>—</span>
                                        )}
                                    </td>
                                    <td>{campaign.createdAt}</td>
                                    <td>
                                        <div className={styles.actions}>
                                            <button className={styles.actionBtn} title="View">👁️</button>
                                            <button className={styles.actionBtn} title="Edit">✏️</button>
                                            <button className={styles.actionBtn} title="Duplicate">📋</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Warmup Status */}
            <div className={`glass-card ${styles.warmupCard}`}>
                <h2>IP Warmup Status</h2>
                {warmupStatus ? (
                    <div className={styles.warmupContent}>
                        <div className={styles.warmupInfo}>
                            <div>
                                <p className={styles.warmupLabel}>Current Day</p>
                                <p className={styles.warmupValue}>Day {warmupStatus.currentDay} of 45</p>
                            </div>
                            <div>
                                <p className={styles.warmupLabel}>Daily Limit</p>
                                <p className={styles.warmupValue}>{warmupStatus.dailyLimit.toLocaleString()} emails</p>
                            </div>
                            <div>
                                <p className={styles.warmupLabel}>Sent Today</p>
                                <p className={styles.warmupValue}>{warmupStatus.sentToday.toLocaleString()} / {warmupStatus.dailyLimit.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className={styles.warmupLabel}>Remaining</p>
                                <p className={styles.warmupValue}>{(warmupStatus.dailyLimit - warmupStatus.sentToday).toLocaleString()} emails</p>
                            </div>
                        </div>
                        <div className={styles.warmupProgress}>
                            <div className={styles.warmupBar}>
                                <div
                                    className={styles.warmupBarFill}
                                    style={{ width: `${(warmupStatus.currentDay / 45) * 100}%` }}
                                />
                            </div>
                            <p className={styles.warmupText}>
                                Warmup {Math.round((warmupStatus.currentDay / 45) * 100)}% complete • Estimated completion: {45 - warmupStatus.currentDay} days
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className={styles.warmupContent}>
                        <p>Loading warmup status...</p>
                    </div>
                )}
            </div>

            {/* New Campaign Modal */}
            {showNewCampaignModal && (
                <CampaignForm
                    onClose={() => setShowNewCampaignModal(false)}
                    onSubmit={handleCreateCampaign}
                />
            )}
        </div>
    );
}
