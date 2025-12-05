import { Injectable, Logger } from '@nestjs/common';

export interface WarmupSchedule {
    day: number;
    maxEmails: number;
}

export interface WarmupStatus {
    currentDay: number;
    totalEmailsSent: number;
    allowedToday: number;
    remainingToday: number;
    isComplete: boolean;
}

/**
 * Automated Warmup Guardian System
 * Implements progressive IP/domain warming as per the strategic blueprint
 */
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WarmupStatus as WarmupStatusEntity } from '../../entities/warmup-status.entity';

@Injectable()
export class WarmupService {
    private readonly logger = new Logger(WarmupService.name);

    constructor(
        @InjectRepository(WarmupStatusEntity)
        private warmupStatusRepo: Repository<WarmupStatusEntity>,
    ) { }

    /**
     * Default 45-day warmup schedule
     * Gradually increases from 50 to 50,000 emails
     */
    private readonly defaultSchedule: WarmupSchedule[] = [
        { day: 1, maxEmails: 50 },
        { day: 2, maxEmails: 100 },
        { day: 3, maxEmails: 200 },
        { day: 4, maxEmails: 400 },
        { day: 5, maxEmails: 800 },
        { day: 6, maxEmails: 1600 },
        { day: 7, maxEmails: 3200 },
        { day: 14, maxEmails: 6400 },
        { day: 21, maxEmails: 12800 },
        { day: 28, maxEmails: 25000 },
        { day: 35, maxEmails: 37500 },
        { day: 45, maxEmails: 50000 },
    ];

    /**
     * Calculate allowed sending volume for current warmup day
     */
    getAllowedVolumeForDay(currentDay: number): number {
        if (currentDay >= 45) {
            return 50000; // Warmup complete
        }

        // Find the appropriate schedule tier
        for (let i = this.defaultSchedule.length - 1; i >= 0; i--) {
            if (currentDay >= this.defaultSchedule[i].day) {
                return this.defaultSchedule[i].maxEmails;
            }
        }

        return this.defaultSchedule[0].maxEmails;
    }

    /**
     * Check if customer can send the requested volume
     */
    async canSendVolume(
        customerId: string,
        requestedVolume: number,
        currentDay?: number, // Optional override
        todaysSentCount?: number, // Optional override
    ): Promise<{ allowed: boolean; reason?: string; maxAllowed: number }> {
        let day = currentDay;
        let sent = todaysSentCount;

        if (day === undefined || sent === undefined) {
            // Fetch from DB
            let status = await this.warmupStatusRepo.findOne({
                where: { user: { id: customerId } },
                relations: ['user'],
            });

            if (!status) {
                // If no status, assume day 1
                day = 1;
                sent = 0;
            } else {
                day = status.currentDay;

                // Check if we need to reset for a new day
                const lastDate = new Date(status.lastSentDate);
                const today = new Date();
                if (lastDate.toDateString() !== today.toDateString()) {
                    sent = 0;
                    // Increment day if we sent volume yesterday? Or just increment based on time?
                    // For MVP, simplistic logic: increment day if last sent was yesterday
                    if (status.sentToday > 0) {
                        day = status.currentDay + 1;
                    }
                } else {
                    sent = status.sentToday;
                }
            }
        }

        const maxAllowed = this.getAllowedVolumeForDay(day);
        const remaining = maxAllowed - sent;

        if (requestedVolume <= remaining) {
            return { allowed: true, maxAllowed: remaining };
        }

        this.logger.warn(
            `Customer ${customerId} exceeded warmup limit. Day: ${day}, ` +
            `Requested: ${requestedVolume}, Allowed: ${remaining}/${maxAllowed}`
        );

        return {
            allowed: false,
            reason: `Warmup limit exceeded. You can send ${remaining} more emails today (Day ${day} of warmup).`,
            maxAllowed: remaining,
        };
    }

    /**
     * Get warmup status for a customer
     */
    async getWarmupStatus(customerId: string): Promise<WarmupStatus> {
        let status = await this.warmupStatusRepo.findOne({
            where: { user: { id: customerId } },
        });

        let currentDay = 1;
        let sentToday = 0;
        let totalSent = 0; // We might need to track total sent in DB too

        if (status) {
            currentDay = status.currentDay;
            const lastDate = new Date(status.lastSentDate);
            const today = new Date();
            if (lastDate.toDateString() === today.toDateString()) {
                sentToday = status.sentToday;
            }
        }

        const maxToday = this.getAllowedVolumeForDay(currentDay);
        const isComplete = currentDay >= 45;

        return {
            currentDay,
            totalEmailsSent: totalSent, // TODO: Add total sent tracking
            allowedToday: maxToday,
            remainingToday: Math.max(0, maxToday - sentToday),
            isComplete,
        };
    }

    /**
     * Validate domain authentication (SPF, DKIM, DMARC)
     * This is a placeholder - in production, integrate with DNS checking services
     */
    async validateDomainAuthentication(domain: string): Promise<{
        spf: boolean;
        dkim: boolean;
        dmarc: boolean;
        allValid: boolean;
    }> {
        // TODO: Implement actual DNS record validation
        // For now, return mock validation
        this.logger.log(`Validating domain authentication for: ${domain}`);

        return {
            spf: true,
            dkim: true,
            dmarc: true,
            allValid: true,
        };
    }
}
