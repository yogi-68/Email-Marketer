import { IsString, IsEmail, IsArray, ValidateNested, IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class RecipientDto {
    @IsEmail()
    email: string;

    @IsOptional()
    personalizations?: Record<string, string>;
}

export class BulkEmailDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => RecipientDto)
    recipients: RecipientDto[];

    @IsEmail()
    from: string;

    @IsString()
    subject: string;

    @IsString()
    htmlBody: string;

    @IsString()
    @IsOptional()
    textBody?: string;

    @IsBoolean()
    @IsOptional()
    useSTO?: boolean;

    @IsString()
    @IsOptional()
    campaignId?: string;

    @IsString()
    @IsOptional()
    scheduledFor?: string;
}
