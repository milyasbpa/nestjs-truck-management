import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { QueueLane } from './queue_lane.entity';

export enum QueueLanesActivityLogStatus {
  OPERATIONAL = 'OPERATIONAL',
  NON_OPERATIONAL = 'NON_OPERATIONAL',
  DELETED = 'DELETED',
}

@Entity({ name: 'queue_lanes_activity_log' })
export class QueueLanesActivityLog {
   @PrimaryGeneratedColumn('increment', { type: 'bigint' })
    id: number;
  
    @Column({ type: 'bigint' })
    queue_lane_id: number;
  
    @Column({ type: 'varchar', length: 255, nullable: true })
    previous_queue_lane_name: string | null;
  
    @Column({ type: 'varchar', length: 255, nullable: true })
    current_queue_lane_name: string | null;
  
    @Column({
      type: 'enum',
      enum: QueueLanesActivityLogStatus,
      nullable: true,
    })
    previous_status?: QueueLanesActivityLogStatus | null;
  
    @Column({
      type: 'enum',
      enum: QueueLanesActivityLogStatus,
      nullable: true,
    })
    current_status?: QueueLanesActivityLogStatus | null;
  
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
  
    @ManyToOne(() => QueueLane, (l) => l.logs)
    @JoinColumn({ name: 'queue_lane_id', referencedColumnName: 'id' })
    logs: QueueLane;
}
