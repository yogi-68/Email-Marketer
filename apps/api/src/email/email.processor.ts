import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { SesService } from './ses.service';
import { EmailJobData } from './email.service';

/**
 * BullMQ Worker/Consumer for processing email jobs
 */
@Processor('email')
export class EmailProcessor extends WorkerHost {
    private readonly logger = new Logger(EmailProcessor.name);

    constructor(private sesService: SesService) {
        super();
    }

    async process(job: Job<EmailJobData>): Promise<{ messageId: string }> {
        this.logger.log(`Processing email job ${job.id} for recipient: ${job.data.to}`);

        try {
            const messageId = await this.sesService.sendEmail({
                to: [job.data.to],
                from: job.data.from,
                subject: job.data.subject,
                htmlBody: job.data.htmlBody,
                textBody: job.data.textBody,
                configurationSetName: 'email-marketer-events', // For event tracking
            });

            this.logger.log(`Email sent successfully. Job: ${job.id}, MessageId: ${messageId}`);

            return { messageId };
        } catch (error) {
            this.logger.error(`Failed to send email for job ${job.id}`, error);
            throw error; // BullMQ will handle retry logic
        }
    }
}
