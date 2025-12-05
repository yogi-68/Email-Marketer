import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';

@Entity('organizations')
export class Organization {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    stripeCustomerId: string;

    @Column({ default: 'free' })
    plan: 'free' | 'pro' | 'enterprise';

    @Column({ type: 'int', default: 1000 })
    emailLimit: number;

    @Column({ type: 'int', default: 0 })
    emailsSentThisMonth: number;

    @Column({ nullable: true })
    razorpaySubscriptionId: string;

    @OneToMany(() => User, (user) => user.organization)
    users: User[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
