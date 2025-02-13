import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity('cp_queue_assignments', { schema: 'public' })
@Index('cpqueueassignments_status', ['status'])
@Index('idx_assignment_id_truck_id_auditupdate', [
  'assignment_id',
  'truck_id',
  'auditupdate',
])
@Index('idx_cp_queue_assignments_exit_time', ['exit_time'])
@Index('idx_cp_queue_assignments_lane_id', ['lane_id'])
@Index('idx_cp_queue_assignments_position', ['cp_queue_id', 'position'])
@Index('idx_cp_queue_assignments_truck_id', ['truck_id'])
@Index('idx_cp_queue_assignments_truck_type', ['truck_type'])
@Index('idx_entrance_time', ['entrance_time'])
@Index('idxkeylocked', ['keylocked'])
export class CpQueueAssignmentsEntity {
  @PrimaryGeneratedColumn('increment', {
    type: 'bigint',
    name: 'assignment_id',
  })
  assignmentId: number;

  @Column('bigint', { nullable: true, name: 'truck_id' })
  truckId: number;

  @Column('bigint', { nullable: true, name: 'cp_queue_id' })
  cpQueueId: number;

  @Column('int', { nullable: true, name: 'position' })
  position: number;

  @Column('int', { nullable: true, name: 'estimated_wait_time' })
  estimatedWaitTime: number;

  @Column('bigint', { nullable: true, name: 'entry_rfid_event_id' })
  entryRfidEventId: number;

  @Column('bigint', { nullable: true, name: 'entry_cctv_event_id' })
  entryCctvEventId: number;

  @Column('bigint', { nullable: true, name: 'exit_rfid_event_id' })
  exitRfidEventId: number;

  @Column('bigint', { nullable: true, name: 'exit_cctv_event_id' })
  exitCctvEventId: number;

  @Column('timestamptz', {
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP',
    name: 'created_at',
  })
  createdAt: Date;

  @Column('bigint', { nullable: true, name: 'created_by' })
  createdBy: number;

  @Column('timestamptz', {
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP',
    name: 'auditupdate',
  })
  auditupdate: Date;

  @Column('bigint', { nullable: true, name: 'updated_by' })
  updatedBy: number;

  @Column('int', { nullable: true, name: 'lane_id' })
  laneId: number;

  @Column('timestamptz', {
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP',
    name: 'entrance_time',
  })
  entranceTime: Date;

  @Column('timestamptz', { nullable: true, name: 'exit_time' })
  exitTime: Date;

  @Column('varchar', { length: 5, nullable: true, name: 'truck_type' })
  truckType: string;

  @Column('timestamptz', { nullable: true, name: 'exit_cp_time' })
  exitCpTime: Date;

  @Column('varchar', { length: 255, nullable: true, name: 'driver_name' })
  driverName: string;

  @Column('bool', { default: false, nullable: true, name: 'back_to_queue' })
  backToQueue: boolean;

  @Column('varchar', { length: 20, nullable: true, name: 'nomor_lambung' })
  nomorLambung: string;

  @Column('varchar', {
    length: 255,
    nullable: true,
    unique: true,
    name: 'keylocked',
  })
  keylocked: string;

  @Column('enum', {
    enum: ['IN-SB', 'WAITING', 'ASSIGNED_TO_CP', 'ARRIVED', 'COMPLETED'], // Assuming "queue_status_enum" contains these values
    default: 'IN-SB',
    nullable: true,
    name: 'status',
  })
  status: 'IN-SB' | 'WAITING' | 'ASSIGNED_TO_CP' | 'ARRIVED' | 'COMPLETED';

  @Column('enum', {
    enum: ['GEOFENCE', 'UCAN', 'RFID'], // Assuming "completed_by_enum" contains these values
    nullable: true,
    name: 'completed_by',
  })
  completedBy: 'GEOFENCE' | 'UCAN' | 'RFID';
}
