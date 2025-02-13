import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Cps } from 'src/jobs/entities/cps.entity';

@Entity({ name: 'cp_units' })
export class CpUnits {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'int' })
  cp_id: number;

  @Column({ type: 'varchar', length: 120, nullable: false })
  uid: string;
  
  @Column({ type: 'varchar', length: 20, nullable: false })
  name: string;

  @Column({ type: 'boolean' })
  status: boolean;

  @Column({ type: 'boolean' })
  connection: boolean;

  @Column({ type: 'int' })
  created_by: number;

  @Column({ type: 'varchar' })
  updated_by: string;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  auditupdate: Date;
}
