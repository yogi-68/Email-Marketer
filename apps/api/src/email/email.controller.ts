import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { EmailService } from './email.service';
import { BulkEmailDto } from './dto/bulk-email.dto';
import { WarmupService } from './warmup/warmup.service';

@Controller('email')
export class EmailController {
    constructor(
        private emailService: EmailService,
        private warmupService: WarmupService,
    ) { }

    @Post('send-bulk')
    async sendBulk(@Body() request: BulkEmailDto) {
        return this.emailService.queueBulkEmails(request);
    }

    @Get('reputation')
    async getReputation() {
        return this.emailService.getReputationMetrics();
    }

    @Get('warmup/:customerId')
    async getWarmupStatus(@Param('customerId') customerId: string) {
        return this.warmupService.getWarmupStatus(customerId);
    }

    @Get('campaigns')
    async getCampaigns() {
        // In a real app, extract customerId from JWT/Session
        // For MVP, return all or filter by a test ID
        return this.emailService.getCampaigns();
    }
    @Post('predict-sto')
    async predictSTO(@Body() body: any) {
        return this.emailService.getOptimalSendTime(body);
    }
}
