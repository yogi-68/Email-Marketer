'use client';

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import styles from './CampaignChart.module.css';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

interface CampaignChartProps {
    campaigns: any[];
}

export default function CampaignChart({ campaigns }: CampaignChartProps) {
    const sortedCampaigns = [...campaigns]
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .slice(-7); // Last 7 campaigns

    const labels = sortedCampaigns.map(c => c.name.length > 15 ? c.name.substring(0, 15) + '...' : c.name);

    const data = {
        labels,
        datasets: [
            {
                label: 'Open Rate (%)',
                data: sortedCampaigns.map(c => c.openRate),
                borderColor: '#8b5cf6',
                backgroundColor: 'rgba(139, 92, 246, 0.5)',
                tension: 0.4,
            },
            {
                label: 'Click Rate (%)',
                data: sortedCampaigns.map(c => c.clickRate),
                borderColor: '#ec4899',
                backgroundColor: 'rgba(236, 72, 153, 0.5)',
                tension: 0.4,
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
                labels: {
                    color: '#9ca3af',
                }
            },
            title: {
                display: true,
                text: 'Performance Trends (Last 7 Campaigns)',
                color: '#fff',
            },
        },
        scales: {
            y: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)',
                },
                ticks: {
                    color: '#9ca3af',
                }
            },
            x: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)',
                },
                ticks: {
                    color: '#9ca3af',
                }
            }
        }
    };

    return (
        <div className={styles.chartContainer}>
            <Line options={options} data={data} />
        </div>
    );
}
