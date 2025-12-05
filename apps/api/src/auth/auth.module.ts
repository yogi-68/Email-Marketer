import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { OrgModule } from '../org/org.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([User]),
        PassportModule,
        OrgModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'super-secret-key-change-in-prod',
            signOptions: { expiresIn: '7d' },
        }),
    ],
    providers: [AuthService, JwtStrategy],
    controllers: [AuthController],
    exports: [AuthService],
})
export class AuthModule { }
