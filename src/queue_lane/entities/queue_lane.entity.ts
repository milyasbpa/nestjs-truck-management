import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  DeleteDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { QueueLaneRules } from './queue_lane_rule.entity';
import { RuleLaneCp } from 'src/cp/entities/cp_rule_lane.entity';
import { VidiotronLane } from 'src/vidiotron-notif/entities/vidiotron-lane.entity';
import { RulesLaneQueueLane } from './rule_lane_queue_lane.entity';
import { QueueLanesActivityLog } from './queue_lanes_activity_log.entity';

@Entity({ name: 'queue_lane' })
export class QueueLane {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 100, nullable: false })
  lane_name: string;

  @Column({ type: 'integer', nullable: false })
  positioning: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  reason_off: string;

  @Column({ type: 'int', nullable: true })
  max_capacity: number;

  @Column({ type: 'boolean', default: true, nullable: false })
  status: boolean;

  @Column({ type: 'varchar', length: 20, nullable: false })
  allow_unit: string;

  @Column({ type: 'varchar', length: 20, nullable: false })
  lane_code: string;

  @Column({ type: 'varchar' })
  geofence_kode: string;

  @Column({ type: 'int', nullable: true })
  created_by: number;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'int', nullable: true })
  updated_by: number;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  audit_update: Date;

  @DeleteDateColumn({ nullable: true })
  deleted_at: Date | null; // Soft delete timestamp

  @Column({ nullable: true })
  deleted_by: string | null; // User who soft-deleted the record

  @OneToMany(() => QueueLaneRules, (rule) => rule.queueLane)
  rules: QueueLaneRules[];

  @OneToMany(() => RuleLaneCp, (rule) => rule.queue_lane)
  rules_lane_cp: RuleLaneCp[];

  @OneToOne(() => VidiotronLane, (vl) => vl.lanes)
  @JoinColumn({ name: 'id', referencedColumnName: 'lane_id' })
  vidiotron_lane: VidiotronLane;

  @OneToMany(() => RulesLaneQueueLane, (rule) => rule.rules_lane_queue_lane)
  rules_lane_queue_lane: RulesLaneQueueLane[];

  @OneToMany(() => QueueLanesActivityLog, (l) => l.logs)
  @JoinColumn({ name: 'id', referencedColumnName: 'id' })
  logs: QueueLanesActivityLog[];
}
