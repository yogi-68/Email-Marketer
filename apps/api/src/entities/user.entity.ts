import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne } from 'typeorm';
import { Campaign } from './campaign.entity';
import { WarmupStatus } from './warmup-status.entity';
import { Organization } from './organization.entity';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    email: string;

    @Column({ nullable: true })
    name: string;

    @Column({ select: false, nullable: true }) // Nullable for now to support existing users, select: false for security
    password: string;

    @Column({ default: 'free' })
    plan: string;

    @OneToMany(() => Campaign, (campaign) => campaign.user)
    campaigns: Campaign[];

    @OneToMany(() => WarmupStatus, (warmupStatus) => warmupStatus.user)
    warmupStatus: WarmupStatus[];

    @ManyToOne(() => Organization, (organization) => organization.users, { nullable: true })
    organization: Organization;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
