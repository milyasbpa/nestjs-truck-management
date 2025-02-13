import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Lanes } from './lane.entity';

export enum LanesActivityLogStatus {
  OPERATIONAL = 'OPERATIONAL',
  NON_OPERATIONAL = 'NON_OPERATIONAL',
  DELETED = 'DELETED',
}

@Entity({ name: 'lanes_activity_log' })
export class LanesActivityLog {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ type: 'bigint' })
  lane_id: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  previous_lane_name: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  current_lane_name: string | null;

  @Column({
    type: 'enum',
    enum: LanesActivityLogStatus,
    nullable: true,
  })
  previous_status?: LanesActivityLogStatus | null;

  @Column({
    type: 'enum',
    enum: LanesActivityLogStatus,
    nullable: true,
  })
  current_status?: LanesActivityLogStatus | null;

  @Column({ type: 'int', nullable: true })
  previous_positioning: number | null;

  @Column({ type: 'int', nullable: true })
  current_positioning: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reason: string | null;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  auditupdate: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  updated_by?: string;

  @ManyToOne(() => Lanes, (l) => l.logs)
  @JoinColumn({ name: 'lane_id', referencedColumnName: 'id' })
  logs: Lanes;
}
