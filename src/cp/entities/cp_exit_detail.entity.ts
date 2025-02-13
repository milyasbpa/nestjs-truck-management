import { Cps } from 'src/jobs/entities/cps.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('cp_exit_detail', { schema: 'public' })
export class CpExitDetail {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ type: 'int' })
  cp_id: number;

  @Column({ type: 'int' })
  cp_exit_id: number;

  @Column({ type: 'varchar' })
  cp_exit_type_name: string;

  @ManyToOne(() => Cps, (cp) => cp.cp_exit_details)
  @JoinColumn({ name: 'cp_id', referencedColumnName: 'cp_id' })
  cp_exit_details: Cps;
}
