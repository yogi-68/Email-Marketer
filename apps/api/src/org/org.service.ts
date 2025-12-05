import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Organization } from '../entities/organization.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class OrgService {
    private readonly logger = new Logger(OrgService.name);

    constructor(
        @InjectRepository(Organization)
        private orgRepo: Repository<Organization>,
        @InjectRepository(User)
        private userRepo: Repository<User>,
    ) { }

    @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
    async handleMonthlyReset() {
        this.logger.log('Resetting monthly email usage for all organizations...');
        await this.orgRepo.update({}, { emailsSentThisMonth: 0 });
        this.logger.log('Monthly usage reset complete.');
    }

    async createOrganization(name: string, userId: string) {
        // Create organization
        const org = this.orgRepo.create({ name });
        await this.orgRepo.save(org);

        // Link user to organization (owner)
        // In a recurring billing model, we might want to attach current user as admin
        await this.userRepo.update(userId, { organization: org });

        return org;
    }

    async getOrganization(id: string) {
        return this.orgRepo.findOne({
            where: { id },
            relations: ['users']
        });
    }

    async addUserToOrganization(orgId: string, email: string) {
        const user = await this.userRepo.findOne({ where: { email } });
        if (!user) {
            throw new Error('User not found');
        }
        user.organization = { id: orgId } as Organization;
        return this.userRepo.save(user);
    }

    async checkLimit(orgId: string, amount: number): Promise<boolean> {
        const org = await this.orgRepo.findOne({ where: { id: orgId } });
        if (!org) return false;

        // Reset if new month (simplified logic for MVP - assumes cron job normally handles this)
        // For now, we trust the stored value. In prod, we'd check dates.

        return (org.emailsSentThisMonth + amount) <= org.emailLimit;
    }

    async incrementUsage(orgId: string, amount: number) {
        await this.orgRepo.increment({ id: orgId }, 'emailsSentThisMonth', amount);
    }

    async upgradePlan(orgId: string, plan: 'pro' | 'enterprise') {
        const limits = {
            'free': 1000,
            'pro': 50000,
            'enterprise': 1000000 // Unlimited effectively
        };

        await this.orgRepo.update(orgId, {
            plan,
            emailLimit: limits[plan]
        });
    }

    async upgradeUserPlan(userId: string, plan: 'pro' | 'enterprise') {
        const user = await this.userRepo.findOne({
            where: { id: userId },
            relations: ['organization']
        });

        if (!user) throw new Error('User not found');
        if (!user.organization) {
            // If user has no organization, create one? Or error?
            // For now, create one
            const org = await this.createOrganization(`${user.email}'s Org`, userId);
            await this.upgradePlan(org.id, plan);
        } else {
            await this.upgradePlan(user.organization.id, plan);
        }
    }
}
