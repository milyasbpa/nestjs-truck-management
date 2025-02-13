import { RulesOfSimpangBayah } from 'src/ruleofsimpangbayahlane/entities/rulesofsimpangbayahlane.entity';
import { VidiotronLane } from 'src/vidiotron-notif/entities/vidiotron-lane.entity';
import { Vidiotron } from 'src/vidiotron-notif/entities/vidiotron.entity';
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
import { LanesActivityLog } from './lanes_activity_log.entity';

@Entity({ name: 'lanes' })
export class Lanes {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 30, nullable: false })
  lane_code: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  lane_name: string;

  @Column({ type: 'int', precision: 4, scale: 2 })
  max_capacity: number;

  @Column({ type: 'decimal', precision: 4, scale: 2 })
  safety_distance: number;

  @Column({ type: 'decimal', precision: 4, scale: 2 })
  ideal_speed: number;

  @Column({ type: 'boolean', default: true })
  status: boolean;

  @Column({ type: 'varchar', length: 255, nullable: false })
  reason_off: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  travel_point_time: number;

  @Column({ type: 'int' })
  created_by: number;

  @Column({ type: 'varchar' })
  updated_by: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  auditupdate: Date;

  @Column({ type: 'int' })
  positioning: number;

  @DeleteDateColumn({ nullable: true })
  deleted_at: Date | null; // Soft delete timestamp

  @Column({ nullable: true })
  deleted_by: string | null; // User who soft-deleted the record

  @OneToMany(() => RulesOfSimpangBayah, (rule) => rule.lanes)
  rules: RulesOfSimpangBayah[];

  @OneToOne(() => VidiotronLane, (vl) => vl.lanes)
  @JoinColumn({ name: 'id', referencedColumnName: 'lane_id' })
  vidiotron_lane: VidiotronLane;

  @OneToMany(() => LanesActivityLog, (l) => l.logs)
  @JoinColumn({ name: 'id', referencedColumnName: 'id' })
  logs: LanesActivityLog[];
}
