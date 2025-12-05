import { Controller, Post, Body, BadRequestException, UseGuards, Request } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { AuthGuard } from '@nestjs/passport';
import { OrgService } from '../org/org.service';
import { CreateOrderDto, VerifyPaymentDto } from './dto/payment.dto';

@Controller('payment')
@UseGuards(AuthGuard('jwt'))
export class PaymentController {
    constructor(
        private readonly paymentService: PaymentService,
        private readonly orgService: OrgService
    ) { }

    @Post('create-order')
    async createOrder(@Body() body: CreateOrderDto) {
        return this.paymentService.createOrder(body.amount);
    }

    @Post('verify')
    async verifyPayment(
        @Body() body: VerifyPaymentDto,
        @Request() req: any
    ) {
        const isValid = this.paymentService.verifyPayment(body.orderId, body.paymentId, body.signature);
        if (!isValid) {
            throw new BadRequestException('Invalid payment signature');
        }

        // Determine plan based on amount (Hardcoded for MVP logic)
        // 299900 paise = 2999 INR -> Pro
        // 999900 paise = 9999 INR -> Enterprise
        let plan: 'pro' | 'enterprise' | null = null;
        if (body.amount === 2999) plan = 'pro';
        if (body.amount === 9999) plan = 'enterprise';

        if (plan) {
            // Find user's org
            // We need a method in OrgService or UserService to get Org by User ID
            // For now, assuming we can get it via OrgService if we had a method, 
            // or we use the user's organization relation if available on req.user?
            // req.user usually just has userId from JWT strategy.

            // Let's assume we link it by finding the user's org.
            // I'll call a new method in OrgService: upgradeUserPlan(userId, plan)
            await this.orgService.upgradeUserPlan(req.user.userId, plan);
        }

        return { success: true, message: 'Payment verified and plan upgraded' };
    }
}
