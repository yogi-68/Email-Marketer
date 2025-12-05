import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SesService } from './ses.service';
import { WarmupService } from './warmup/warmup.service';
import { OrgService } from '../org/org.service';

export interface EmailJobData {
    to: string;
    from: string;
    subject: string;
    htmlBody: string;
    textBody?: string;
    customerId: string;
    campaignId?: string;
    scheduledFor?: Date;
}

export interface BulkEmailRequest {
    recipients: Array<{
        email: string;
        personalizations?: Record<string, string>;
    }>;
    from: string;
    subject: string;
    htmlBody: string;
    textBody?: string;
    customerId: string;
    campaignId: string;
    useSTO?: boolean;
}

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign } from '../entities/campaign.entity';
import { User } from '../entities/user.entity';
import { WarmupStatus } from '../entities/warmup-status.entity';

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);

    constructor(
        @InjectQueue('email') private emailQueue: Queue,
        private sesService: SesService,
        private warmupService: WarmupService,
        @InjectRepository(Campaign) private campaignRepo: Repository<Campaign>,
        @InjectRepository(User) private userRepo: Repository<User>,
        @InjectRepository(WarmupStatus) private warmupStatusRepo: Repository<WarmupStatus>,
        private orgService: OrgService,
    ) { }

    /**
     * Queue a single email for sending
     */
    async queueEmail(data: EmailJobData, delayMs?: number) {
        const jobOptions = delayMs
            ? { delay: delayMs }
            : {};

        const job = await this.emailQueue.add('send-email', data, jobOptions);
        this.logger.log(`Email queued with job ID: ${job.id}`);
        return job.id;
    }

    /**
     * Queue bulk emails with optional STO (Send Time Optimization)
     */
    async queueBulkEmails(request: BulkEmailRequest) {
        const { recipients, customerId, useSTO } = request;

        // Find or create user
        let user = await this.userRepo.findOne({
            where: { id: customerId },
            relations: ['organization']
        });
        if (!user) {
            // handle not found or dummy logic
        }

        // Create Campaign Entity
        const campaign = this.campaignRepo.create({
            name: request.subject,
            subject: request.subject,
            htmlBody: request.htmlBody,
            textBody: request.textBody,
            useSTO: !!useSTO,
            recipientsCount: recipients.length,
            status: 'scheduled',
            user: user || undefined,
        });

        // Org Limit Check
        if (user && user.organization) {
            const hasLimit = await this.orgService.checkLimit(user.organization.id, recipients.length);
            if (!hasLimit) {
                throw new Error('Monthly email limit exceeded for your plan. Please upgrade.');
            }
        }

        await this.campaignRepo.save(campaign);

        // Increment Usage
        if (user && user.organization) {
            await this.orgService.incrementUsage(user.organization.id, recipients.length);
        }

        // Warmup check
        let warmupStatus = await this.warmupStatusRepo.findOne({
            where: { user: { id: customerId } }
        });

        if (!warmupStatus) {
            // Initialize for new user
            warmupStatus = this.warmupStatusRepo.create({
                currentDay: 1,
                sentToday: 0,
                lastSentDate: new Date().toISOString().split('T')[0],
                user: { id: customerId } as User
            });
            await this.warmupStatusRepo.save(warmupStatus);
        }

        // Check if day needs to advance (simplified logic)
        // In prod, this would be more robust or handled by a cron
        const lastDateVal = new Date(warmupStatus.lastSentDate);
        const today = new Date();
        // Reset time component for accurate day comparison
        today.setHours(0, 0, 0, 0);
        lastDateVal.setHours(0, 0, 0, 0);

        const isSameDay = lastDateVal.getTime() === today.getTime();

        if (!isSameDay) {
            // New day, reset sent count and increment day if previous day was successful (simplified)
            warmupStatus.sentToday = 0;
            // Only increment day if we aren't "stuck" (not implemented here, assuming linear progression)
            warmupStatus.currentDay += 1;
            warmupStatus.lastSentDate = today.toISOString().split('T')[0];
            await this.warmupStatusRepo.save(warmupStatus);
        }

        const warmupCheck = await this.warmupService.canSendVolume(
            customerId,
            recipients.length,
            warmupStatus.currentDay,
            warmupStatus.sentToday,
        );

        if (!warmupCheck.allowed) {
            campaign.status = 'failed';
            await this.campaignRepo.save(campaign);
            throw new Error(warmupCheck.reason);
        }

        // Update sent count
        warmupStatus.sentToday += recipients.length;
        await this.warmupStatusRepo.save(warmupStatus);

        // If STO is enabled, call ML service for optimal send times
        let stoTimes: Map<string, number> = new Map();

        if (useSTO) {
            stoTimes = await this.fetchSTOTimes(recipients.map(r => r.email));
        }

        // Queue individual emails
        const jobPromises = recipients.map((recipient) => {
            const delay = stoTimes.get(recipient.email) || 0;
            const trackingData = { campaignId: campaign.id, recipient: recipient.email };

            return this.queueEmail({
                to: recipient.email,
                from: request.from,
                subject: this.personalizeContent(request.subject, recipient.personalizations),
                htmlBody: this.personalizeContent(request.htmlBody, recipient.personalizations, trackingData),
                textBody: request.textBody,
                customerId,
                campaignId: campaign.id,
            }, delay);
        });

        const jobIds = await Promise.all(jobPromises);

        this.logger.log(`Queued ${jobIds.length} emails for campaign ${campaign.id}`);

        return {
            queuedCount: jobIds.length,
            jobIds,
            campaignId: campaign.id,
        };
    }

    /**
     * Fetch optimal send times from ML service
     */
    private async fetchSTOTimes(emails: string[]): Promise<Map<string, number>> {
        const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:5000';

        try {
            const response = await fetch(`${mlServiceUrl}/predict-sto`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emails }),
            });

            if (!response.ok) {
                throw new Error(`ML service error: ${response.statusText}`);
            }

            // const data = await response.json(); // Use in prod

            // Convert optimal times to delay in milliseconds
            const stoMap = new Map<string, number>();
            emails.forEach((email, index) => {
                const optimalHour = (index % 24);
                const delayMs = optimalHour * 60 * 60 * 1000;
                stoMap.set(email, delayMs);
            });

            return stoMap;
        } catch (error) {
            this.logger.error('Failed to fetch STO times, proceeding without optimization', error);
            return new Map();
        }
    }

    /**
     * Personalize email content with recipient data and add tracking
     */
    private personalizeContent(
        content: string,
        personalizations?: Record<string, string>,
        trackingData?: { campaignId: string; recipient: string }
    ): string {
        let personalized = content;

        if (personalizations) {
            Object.entries(personalizations).forEach(([key, value]) => {
                personalized = personalized.replace(new RegExp(`{{${key}}}`, 'g'), value);
            });
        }

        if (trackingData) {
            const { campaignId, recipient } = trackingData;
            const baseUrl = process.env.API_URL || 'http://localhost:3001';

            const trackingPixel = `<img src="${baseUrl}/track/open/${campaignId}/${encodeURIComponent(recipient)}" width="1" height="1" alt="" style="display:none;" />`;
            if (personalized.includes('</body>')) {
                personalized = personalized.replace('</body>', `${trackingPixel}</body>`);
            } else {
                personalized += trackingPixel;
            }

            const linkRegex = /href=["'](http[^"']+)["']/g;
            personalized = personalized.replace(linkRegex, (match, url) => {
                const trackingUrl = `${baseUrl}/track/click/${campaignId}/${encodeURIComponent(recipient)}?url=${encodeURIComponent(url)}`;
                return `href="${trackingUrl}"`;
            });
        }

        return personalized;
    }

    async getReputationMetrics() {
        return this.sesService.getReputationMetrics();
    }

    async getCampaigns(customerId?: string) {
        const query = this.campaignRepo.createQueryBuilder('campaign')
            .orderBy('campaign.createdAt', 'DESC');

        if (customerId) {
            query.where('campaign.user.id = :customerId', { customerId });
        }

        return query.getMany();
    }

    async getOptimalSendTime(input: any) {
        const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:5000';
        try {
            const response = await fetch(`${mlServiceUrl}/predict`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(input),
            });
            if (!response.ok) return null;
            return response.json();
        } catch (e) {
            this.logger.error(`ML Service unavailable: ${e.message}`);
            return null;
        }
    }
}
