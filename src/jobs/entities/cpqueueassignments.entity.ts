import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { QueueStatusEnum, TypeOfTruckEnum } from '@utils/enums';

@Entity({ name: 'cp_queue_assignments' })
export class CpQueueAssignment {
  @PrimaryGeneratedColumn('increment', { type: 'int8' })
  assignment_id: number;

  @Column({ type: 'int8', nullable: false })
  truck_id: number;

  @Column({ type: 'int8', nullable: true })
  cp_queue_id: number;

  @Column({ type: 'int8', nullable: true })
  lane_id: number;

  @Column({ type: 'int4', nullable: true })
  position: number;

  @Column({ type: 'int', default: true })
  estimated_wait_time: number;

  @Column({
    name: 'status',
    type: 'enum',
    enum: QueueStatusEnum,
    default: QueueStatusEnum.WAITING,
    nullable: false,
  })
  status: QueueStatusEnum;

  @Column({ type: 'int8', nullable: true })
  entry_rfid_event_id: number;

  @Column({ type: 'int8', nullable: true })
  entry_cctv_event_id: number;

  @Column({ type: 'int8', nullable: true })
  exit_rfid_event_id: number;

  @Column({ type: 'int8', nullable: true })
  exit_cctv_event_id: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  truck_type: string;

  @Column({ type: 'int8', nullable: true })
  created_by: number;

  @Column({ type: 'int8', nullable: true })
  updated_by: number;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  entrance_time: Date;

  @Column({ type: 'timestamptz', default: () => null })
  exit_time: Date;

  @Column({ type: 'timestamptz', default: () => null })
  exit_cp_time: Date;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  auditupdate: Date;

  @Column({ type: 'boolean', default: false })
  back_to_queue: boolean;
}
