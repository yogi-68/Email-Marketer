import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailService } from './email.service';
import { WarmupService } from './warmup/warmup.service';
import { SesService } from './ses.service';
import { EmailController } from './email.controller';
import { EmailProcessor } from './email.processor';
import { Campaign } from '../entities/campaign.entity';
import { User } from '../entities/user.entity';
import { WarmupStatus } from '../entities/warmup-status.entity';
import { OrgModule } from '../org/org.module';

import { HttpModule } from '@nestjs/axios';

@Module({
    imports: [
        TypeOrmModule.forFeature([Campaign, User, WarmupStatus]),
        BullModule.registerQueue({
            name: 'email',
        }),
        OrgModule,
        HttpModule,
    ],
    controllers: [EmailController],
    providers: [EmailService, WarmupService, SesService, EmailProcessor],
    exports: [EmailService],
})
export class EmailModule { }
