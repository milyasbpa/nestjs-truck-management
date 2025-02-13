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

@Entity({ name: 'cp_tonages' })
export class CpTonages {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'int', precision: 4, scale: 2 })
  cp_id: number;
  
  @ManyToOne(() => Cps, (cp) => cp.cp_tonages)
  @JoinColumn({ name: 'cp_id' })
  cp: Cps;

  @Column({ type: 'varchar', length: 120, nullable: false })
  uid: string;
  
  @Column({ type: 'varchar', length: 20, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  item_name: string;
  
  @Column({ type: 'varchar', length: 120, nullable: true })
  item_id: string;

  @Column({ type: 'integer' })
  value: number;

  @Column({ type: 'boolean' })
  connection: boolean;

  @Column({ type: 'int' })
  created_by: number;

  @Column({ type: 'varchar' })
  updated_by: number;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  auditupdate: Date;
}
