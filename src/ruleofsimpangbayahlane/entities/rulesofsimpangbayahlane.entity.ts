import { Lanes } from 'src/lane/entities/lane.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Check,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('rulesofsimpang_bayah')
@Check(`"truck_type" IN ('SDT', 'DDT', 'DT')`)
@Index('idx_rulesofsimpang_lane_id', ['lane_id'])
export class RulesOfSimpangBayah {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ type: 'bigint', nullable: true })
  lane_id: number;

  @ManyToOne(() => Lanes, (lane) => lane.rules)
  @JoinColumn({ name: 'lane_id' })
  lanes: Lanes;

  @Column({ type: 'varchar', length: 5, nullable: true })
  truck_type: string;

  @Column({ type: 'boolean', default: false })
  is_deleted: boolean;

  @Column({ type: 'integer', nullable: true })
  created_by: number;

  @Column({ type: 'integer', nullable: true })
  updated_by: number;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  auditupdate: Date;
}
