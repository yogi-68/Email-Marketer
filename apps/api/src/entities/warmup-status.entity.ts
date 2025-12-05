import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';

@Entity('warmup_status')
export class WarmupStatus {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'int', default: 1 })
    currentDay: number;

    @Column({ type: 'int', default: 0 })
    sentToday: number;

    @Column({ type: 'date' })
    lastSentDate: string;

    @ManyToOne(() => User, (user) => user.warmupStatus)
    user: User;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
