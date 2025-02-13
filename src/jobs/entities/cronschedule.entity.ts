import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity({ name: 'cron_schedule' })
export class CronSchedule {
  @PrimaryGeneratedColumn('increment', { type: 'int8' })
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  cron_name: string;

  @Column({ type: 'varchar', length: 20, nullable: false })
  schedule: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ name: 'changes_by', type: 'int', nullable: true })
  changes_by: number;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  auditupdate: Date;
}
