import { Injectable, Logger } from '@nestjs/common';
import { SESClient, SendEmailCommand, GetSendStatisticsCommand } from '@aws-sdk/client-ses';

export interface SendEmailRequest {
    to: string[];
    from: string;
    subject: string;
    htmlBody: string;
    textBody?: string;
    configurationSetName?: string;
}

@Injectable()
export class SesService {
    private readonly logger = new Logger(SesService.name);
    private readonly sesClient: SESClient;

    constructor() {
        this.sesClient = new SESClient({
            region: process.env.AWS_REGION || 'us-east-1',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
            },
        });
    }

    /**
     * Send email via AWS SES
     */
    async sendEmail(request: SendEmailRequest): Promise<string> {
        const command = new SendEmailCommand({
            Source: request.from,
            Destination: {
                ToAddresses: request.to,
            },
            Message: {
                Subject: {
                    Data: request.subject,
                },
                Body: {
                    Html: {
                        Data: request.htmlBody,
                    },
                    ...(request.textBody && {
                        Text: {
                            Data: request.textBody,
                        },
                    }),
                },
            },
            ...(request.configurationSetName && {
                ConfigurationSetName: request.configurationSetName,
            }),
        });

        try {
            const response = await this.sesClient.send(command);
            this.logger.log(`Email sent successfully. MessageId: ${response.MessageId}`);
            return response.MessageId || '';
        } catch (error) {
            this.logger.error('Failed to send email', error);
            throw error;
        }
    }

    /**
     * Get sending statistics from AWS SES
     */
    async getSendStatistics() {
        const command = new GetSendStatisticsCommand({});
        try {
            const response = await this.sesClient.send(command);
            return response.SendDataPoints || [];
        } catch (error) {
            this.logger.error('Failed to get send statistics', error);
            throw error;
        }
    }

    /**
     * Calculate reputation metrics from send statistics
     */
    async getReputationMetrics() {
        const stats = await this.getSendStatistics();

        if (!stats.length) {
            return {
                bounceRate: 0,
                complaintRate: 0,
                deliveryAttempts: 0,
            };
        }

        const totals = stats.reduce(
            (acc, point) => ({
                deliveryAttempts: acc.deliveryAttempts + (point.DeliveryAttempts || 0),
                bounces: acc.bounces + (point.Bounces || 0),
                complaints: acc.complaints + (point.Complaints || 0),
            }),
            { deliveryAttempts: 0, bounces: 0, complaints: 0 }
        );

        return {
            bounceRate: totals.deliveryAttempts > 0
                ? (totals.bounces / totals.deliveryAttempts) * 100
                : 0,
            complaintRate: totals.deliveryAttempts > 0
                ? (totals.complaints / totals.deliveryAttempts) * 100
                : 0,
            deliveryAttempts: totals.deliveryAttempts,
        };
    }
}
