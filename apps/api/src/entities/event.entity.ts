import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { Campaign } from './campaign.entity';

@Entity('events')
export class Event {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    type: 'open' | 'click';

    @Column()
    recipient: string;

    @Column({ nullable: true })
    url: string; // For click events

    @Column({ nullable: true })
    userAgent: string;

    @Column({ nullable: true })
    ip: string;

    @ManyToOne(() => Campaign, { onDelete: 'CASCADE' })
    campaign: Campaign;

    @CreateDateColumn()
    timestamp: Date;
}
