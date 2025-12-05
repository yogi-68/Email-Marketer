import { Injectable, Logger } from '@nestjs/common';
import Razorpay from 'razorpay';
import crypto from 'crypto';

@Injectable()
export class PaymentService {
    private razorpay: any;
    private readonly logger = new Logger(PaymentService.name);

    constructor() {
        this.razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_YOUR_KEY_ID',
            key_secret: process.env.RAZORPAY_KEY_SECRET || 'YOUR_KEY_SECRET',
        });
    }

    async createOrder(amount: number, currency: string = 'INR') {
        const options = {
            amount: amount * 100, // Amount in paise
            currency,
            receipt: `receipt_${Date.now()}`,
        };

        try {
            const order = await this.razorpay.orders.create(options);
            return order;
        } catch (error) {
            this.logger.error('Error creating Razorpay order', error);
            throw error;
        }
    }

    verifyPayment(orderId: string, paymentId: string, signature: string): boolean {
        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'YOUR_KEY_SECRET')
            .update(orderId + '|' + paymentId)
            .digest('hex');

        return generatedSignature === signature;
    }
}
