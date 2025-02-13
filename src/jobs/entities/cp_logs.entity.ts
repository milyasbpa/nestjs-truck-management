import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'cp_logs' })
export class CpLog {
  @PrimaryGeneratedColumn('increment')
  cp_log_id: number;

  @Column({ type: 'bigint', length: 255, nullable: false })
  cp_id: number;

  @Column({ type: 'varchar', nullable: false })
  action: string;

  @Column({ type: 'varchar', nullable: false })
  reason: string;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;  
}
