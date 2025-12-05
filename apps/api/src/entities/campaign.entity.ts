import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';

@Entity('campaigns')
export class Campaign {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    subject: string;

    @Column({ default: 'draft' })
    status: string; // draft, scheduled, sending, complete

    @Column({ type: 'text', nullable: true })
    htmlBody: string;

    @Column({ type: 'text', nullable: true })
    textBody: string;

    @Column({ default: false })
    useSTO: boolean;

    @Column({ type: 'int', default: 0 })
    recipientsCount: number;

    @Column({ type: 'int', default: 0 })
    sentCount: number;

    @Column({ type: 'int', default: 0 })
    openCount: number;

    @Column({ type: 'int', default: 0 })
    clickCount: number;

    @ManyToOne(() => User, (user) => user.campaigns)
    user: User;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
