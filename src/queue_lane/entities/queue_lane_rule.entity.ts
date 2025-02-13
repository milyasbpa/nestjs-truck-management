import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { QueueLane } from './queue_lane.entity';

@Entity({ name: 'queue_lane_rules' })
export class QueueLaneRules {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'int', nullable: false })
  queue_lane_id: number;

  @Column({ type: 'int', nullable: true })
  max_capacity: number;

  @Column({ type: 'boolean', nullable: false, default: true })
  overload_allowed: boolean;
  
  @Column({ type: 'varchar', length: 50, nullable: true })
  truck_type: string;

  @Column({ type: 'int', nullable: true })
  created_by: number;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'int', nullable: true })
  updated_by: number;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  audit_update: Date;

  @ManyToOne(() => QueueLane, (queueLane) => queueLane.rules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'queue_lane_id' })
  queueLane: QueueLane;
}
