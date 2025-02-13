import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'rfid_cp_queue'})
export class RfidCpQueue {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'int', nullable: true })
  lane_id: number;

  @Column({ type: 'int', nullable: true })
  truck_id: number;

  @Column({ type: 'varchar', nullable: true })
  device_id: string;

  @Column({ type: 'varchar', nullable: true })
  status: string;

  @Column({ type: 'varchar', nullable: true })
  rfid_tag: string;

  @Column({ type: 'boolean', nullable: true })
  is_valid: boolean;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}