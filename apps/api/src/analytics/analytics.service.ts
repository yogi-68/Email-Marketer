import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../entities/event.entity';
import { Campaign } from '../entities/campaign.entity';

@Injectable()
export class AnalyticsService {
    constructor(
        @InjectRepository(Event)
        private eventRepo: Repository<Event>,
        @InjectRepository(Campaign)
        private campaignRepo: Repository<Campaign>,
    ) { }

    async trackOpen(campaignId: string, recipient: string, ip: string, userAgent: string) {
        // Prevent duplicate open tracking for unique opens logic (optional, but good for simple stats)
        // For now, track all, aggregation can handle unique
        const event = this.eventRepo.create({
            type: 'open',
            recipient,
            ip,
            userAgent,
            campaign: { id: campaignId },
        });
        await this.eventRepo.save(event);

        // Update campaign aggregated stats
        await this.campaignRepo.increment({ id: campaignId }, 'openCount', 1);
    }

    async trackClick(campaignId: string, recipient: string, url: string, ip: string, userAgent: string) {
        const event = this.eventRepo.create({
            type: 'click',
            recipient,
            url,
            ip,
            userAgent,
            campaign: { id: campaignId },
        });
        await this.eventRepo.save(event);

        // Update campaign aggregated stats
        await this.campaignRepo.increment({ id: campaignId }, 'clickCount', 1);
    }
}
