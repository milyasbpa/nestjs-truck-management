import { Cps } from 'src/jobs/entities/cps.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('cp_entrance_detail', { schema: 'public' })
export class CpEntranceDetail {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ type: 'int' })
  cp_id: number;

  @Column({ type: 'int' })
  cp_entrance_id: number;

  @Column({ type: 'varchar' })
  cp_entrance_type_name: string;

  @ManyToOne(() => Cps, (cp) => cp.cp_entrance_details)
  @JoinColumn({ name: 'cp_id', referencedColumnName: 'cp_id' })
  cp_entrance_details: Cps;
}
