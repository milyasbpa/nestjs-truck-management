import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { QueueLane } from './queue_lane.entity';

@Entity('rule_lane_queue_lane')
export class RulesLaneQueueLane {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  lane_id: number;

  @Column({ type: 'varchar', length: 255 })
  lane_name: string;

  @Column({ type: 'int' })
  queue_lane_id: number;

  @Column({ type: 'varchar', length: 255 })
  queue_lane_name: string;

  @Column({ type: 'int', nullable: true })
  created_by: number;

  @Column({ type: 'int', nullable: true })
  updated_by: number;

  @Column({ type: 'timestamp', nullable: true })
  created_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  auditupdate: Date;

  @ManyToOne(() => QueueLane, (queueLane) => queueLane.rules_lane_queue_lane, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'queue_lane_id' })
  rules_lane_queue_lane: QueueLane;
}
