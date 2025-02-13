import { Cps } from 'src/jobs/entities/cps.entity';
import { QueueLane } from 'src/queue_lane/entities/queue_lane.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  ManyToOne,
} from 'typeorm';

@Entity('rule_lane_cp')
export class RuleLaneCp {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  cp_id: number;

  @Column({ type: 'int' })
  queue_lane_id: number;

  @Column({ type: 'varchar', length: 255 })
  name_queue_lane: string;

  @Column({ type: 'varchar', length: 255 })
  cp_name: string;

  @Column({ type: 'int', nullable: true })
  created_by: number;

  @Column({ type: 'int', nullable: true })
  updated_by: number;

  @Column({ type: 'timestamp', nullable: true })
  created_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  auditupdate: Date;

  @ManyToOne(() => Cps, (cp) => cp.cp_devices)
  @JoinColumn({ name: 'cp_id' })
  cp: Cps;

  @ManyToOne(() => QueueLane, (ql) => ql.rules_lane_cp)
  @JoinColumn({ name: 'queue_lane_id' })
  queue_lane: QueueLane;
}
