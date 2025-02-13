import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Cps } from 'src/jobs/entities/cps.entity'; // Adjust the import path if necessary

@Entity({ name: 'rule_of_cp' })
export class RuleOfCp {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'int', nullable: false })
  cp_id: number;

  @ManyToOne(() => Cps, (cp) => cp.rule_truck)
  @JoinColumn({ name: 'cp_id' })
  cp: Cps;

  @Column({ type: 'int', nullable: true })
  max_capacity: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  truck_type: string;

  @Column({ type: 'int', nullable: true })
  created_by: number;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'int', nullable: true })
  updated_by: number;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  auditupdate: Date;
}
