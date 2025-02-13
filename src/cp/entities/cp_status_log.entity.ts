import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { Cps } from 'src/jobs/entities/cps.entity';

@Entity({ name: 'cp_status_log' })
export class CpStatusLog {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'int', precision: 4, scale: 2 })
  cp_id: number;

  @ManyToOne(() => Cps, (cp) => cp.cp_status_log)
  @JoinColumn({ name: 'cp_id' })
  cp: Cps;

  @Column({ type: 'boolean' })
  status: boolean;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'varchar' })
  updated_by: string;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  auditupdate: Date;
}
