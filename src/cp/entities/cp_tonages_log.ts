import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'cp_tonages_log' })
export class CpTonagesLog {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  device_id: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  device_name: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  item_id: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  item_name: string;

  @Column({ type: 'int' })
  value: number;

  @Column({ type: 'boolean' })
  connection: boolean;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  auditupdate: Date;
}
