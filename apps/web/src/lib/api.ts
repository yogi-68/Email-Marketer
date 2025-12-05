const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface ApiError {
    message: string;
    statusCode: number;
}

export interface WarmupStatusResponse {
    currentDay: number;
    totalEmailsSent: number;
    allowedToday: number;
    remainingToday: number;
    isComplete: boolean;
}

export interface ReputationResponse {
    bounceRate: number;
    complaintRate: number;
    deliveryAttempts: number;
}

export interface StoPredictionResponse {
    predictions: Array<{
        email: string;
        optimal_hour: number;
        confidence: number;
        delay_ms: number;
        profile_strength: string;
    }>;
    model_version: string;
    timestamp: string;
}

async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'An error occurred' }));
        throw { message: error.message || response.statusText, statusCode: response.status };
    }
    return response.json();
}

function getAuthHeader(): Record<string, string> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export const api = {
    auth: {
        login: async (data: any) => {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            return handleResponse<{ access_token: string; user: any }>(response);
        },
        register: async (data: any) => {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            return handleResponse<{ access_token: string; user: any }>(response);
        },
        getProfile: async () => {
            const response = await fetch(`${API_URL}/auth/profile`, {
                headers: { ...getAuthHeader() },
            });
            return handleResponse<any>(response);
        }
    },

    email: {
        sendBulk: async (data: any) => {
            const response = await fetch(`${API_URL}/email/send-bulk`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeader()
                },
                body: JSON.stringify(data),
            });
            return handleResponse<{ queuedCount: number; jobIds: string[]; campaignId?: string }>(response);
        },

        getReputation: async () => {
            const response = await fetch(`${API_URL}/email/reputation`, {
                headers: { ...getAuthHeader() }
            });
            return handleResponse<ReputationResponse>(response);
        },

        getWarmupStatus: async (customerId: string) => {
            const response = await fetch(`${API_URL}/email/warmup/${customerId}`, {
                headers: { ...getAuthHeader() }
            });
            return handleResponse<WarmupStatusResponse>(response);
        },

        getCampaigns: async () => {
            const response = await fetch(`${API_URL}/email/campaigns`, {
                headers: { ...getAuthHeader() }
            });
            return handleResponse<any[]>(response);
        },
    },

    ml: {
        predictSTO: async (data: any) => {
            // Note: In production, this might go through the NestJS API proxy
            // For MVP, we'll assume the NestJS API handles this or we call directly if exposed
            const response = await fetch(`${API_URL}/email/predict-sto`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            return handleResponse<StoPredictionResponse>(response);
        }
    },

    payment: {
        createOrder: async (amount: number) => {
            const response = await fetch(`${API_URL}/payment/create-order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeader()
                },
                body: JSON.stringify({ amount }),
            });
            return handleResponse<{ id: string; amount: number; currency: string }>(response);
        },

        verifyPayment: async (data: { orderId: string; paymentId: string; signature: string; amount: number }) => {
            const response = await fetch(`${API_URL}/payment/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeader()
                },
                body: JSON.stringify(data),
            });
            return handleResponse<{ success: boolean; message: string }>(response);
        }
    }
};
