import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { OrgService } from '../org/org.service';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        private jwtService: JwtService,
        private orgService: OrgService,
    ) { }

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.usersRepository.findOne({
            where: { email },
            select: ['id', 'email', 'name', 'password', 'plan'] // Explicitly select password
        });

        if (user && user.password && await bcrypt.compare(pass, user.password)) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }

    async login(user: any) {
        const payload = { email: user.email, sub: user.id, plan: user.plan };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                plan: user.plan
            }
        };
    }

    async register(email: string, pass: string, name: string) {
        const existingUser = await this.usersRepository.findOne({ where: { email } });
        if (existingUser) {
            throw new ConflictException('User already exists');
        }

        const hashedPassword = await bcrypt.hash(pass, 10);
        const newUser = this.usersRepository.create({
            email,
            password: hashedPassword,
            name,
        });

        const savedUser = await this.usersRepository.save(newUser);

        // Create default organization
        await this.orgService.createOrganization(`${name}'s Org`, savedUser.id);

        // Auto-login after register
        return this.login(savedUser);
    }
}
