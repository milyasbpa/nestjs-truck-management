import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { IsOptional } from 'class-validator';

@Entity('cp_queues')
export class CpQueues {
  @PrimaryGeneratedColumn('increment')
  queue_id: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  queue_name: string;

  @Column({ type: 'bigint', nullable: false })
  max_capacity: number;

  @Column({ type: 'boolean' })
  status: boolean;

  @IsOptional()
  @Column({ type: 'bigint', nullable: true })
  geofence_id: number;

  @Column({ type: 'bigint' })
  updated_by: number;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  auditupdate: Date;

}