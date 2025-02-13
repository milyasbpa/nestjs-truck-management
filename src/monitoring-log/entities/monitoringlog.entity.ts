import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { ActivityStatusEnum } from 'src/utils/enums';
@Entity({ name: 'monitoring_logs' })
export class MonitoringLog {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  log_id: string;

  @Column({ type: 'int8', nullable: false })
  activity_id: number;

  @Column({ type: 'jsonb', nullable: true })
  geo_location: Record<string, any>;

  @Column({
    type: 'enum',
    enum: ActivityStatusEnum,
    default: ActivityStatusEnum.IDLE,
  })
  status: ActivityStatusEnum;

  @Column({ type: 'jsonb', nullable: true })
  other_info: Record<string, any>;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdat: Date;
}
