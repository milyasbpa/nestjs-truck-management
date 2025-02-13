import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'cp_queue_assignments_logs' })
export class CpQueueAssignmentsLogEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'int', nullable: false })
  assignments_id: number;

  @Column({ type: 'int', nullable: true })
  truck_id: number;

  @Column({ type: 'int', nullable: true })
  cp_id: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  nomorlambung: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  flag: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  entrance_by: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  exit_by: string;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  auditupdate: Date;
}
