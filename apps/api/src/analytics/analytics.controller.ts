import { Controller, Get, Param, Query, Res, Req } from '@nestjs/common';
import type { Response, Request } from 'express';
import { AnalyticsService } from './analytics.service';

@Controller('track')
export class AnalyticsController {
    constructor(private analyticsService: AnalyticsService) { }

    @Get('open/:campaignId/:recipient')
    async trackOpen(
        @Param('campaignId') campaignId: string,
        @Param('recipient') recipient: string,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const ip = req.ip || '';
        const userAgent = req.headers['user-agent'] || '';

        // Fire and forget - don't wait for DB write to return image
        this.analyticsService.trackOpen(campaignId, recipient, ip, userAgent).catch(console.error);

        // Return 1x1 transparent pixel
        const pixel = Buffer.from(
            'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
            'base64',
        );
        res.writeHead(200, {
            'Content-Type': 'image/gif',
            'Content-Length': pixel.length,
        });
        res.end(pixel);
    }

    @Get('click/:campaignId/:recipient')
    async trackClick(
        @Param('campaignId') campaignId: string,
        @Param('recipient') recipient: string,
        @Query('url') targetUrl: string,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const ip = req.ip || '';
        const userAgent = req.headers['user-agent'] || '';

        await this.analyticsService.trackClick(campaignId, recipient, targetUrl, ip, userAgent).catch(console.error);

        if (targetUrl) {
            res.redirect(targetUrl);
        } else {
            res.status(400).send('Missing target URL');
        }
    }
}
