import { Controller, Post, Body, Get, Param, UseGuards, Request } from '@nestjs/common';
import { OrgService } from './org.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('org')
@UseGuards(AuthGuard('jwt'))
export class OrgController {
    constructor(private orgService: OrgService) { }

    @Post()
    async create(@Body() body: { name: string }, @Request() req: any) {
        return this.orgService.createOrganization(body.name, req.user.userId);
    }

    @Get(':id')
    async get(@Param('id') id: string) {
        return this.orgService.getOrganization(id);
    }

    @Post(':id/users')
    async addUser(@Param('id') id: string, @Body() body: { email: string }) {
        return this.orgService.addUserToOrganization(id, body.email);
    }
}
