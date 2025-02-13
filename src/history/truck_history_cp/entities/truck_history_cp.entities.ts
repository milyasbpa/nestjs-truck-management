import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
} from 'typeorm';

@Entity({ schema: 'logs', name: 'truck_history_cp' }) // Define schema and table name
export class TruckHistoryCpEntity {
  @PrimaryGeneratedColumn({ name: 'history_id', type: 'bigint' })
  historyId: string; // Use string for BigInt compatibility in JavaScript

  @Column({ name: 'assignment_id', type: 'bigint', nullable: true })
  assignmentId?: string;

  @Column({ name: 'truck_id', type: 'bigint', nullable: true })
  truckId?: string;

  @Column({ name: 'status', type: 'varchar', length: 50, nullable: true })
  status?: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt?: Date;

  @Column({
    name: 'created_at_to_date',
    type: 'date',
    default: () => 'CURRENT_DATE',
  })
  createdAtToDate?: string;
}

// Define index for truck_id and created_at
@Index('idx_trucks_id_created_at', ['truckId', 'createdAt'])
export class TruckHistoryCpIndex {}
