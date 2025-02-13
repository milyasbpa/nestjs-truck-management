import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'rfid_reader_out'})
export class RfidReaderOut {
  @PrimaryGeneratedColumn('increment')
  rfid_reader_out_id: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  rfid_code: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  device_id: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int', nullable: true })
  geofence_id: number;

  @Column({ type: 'boolean', default: true })
  status: boolean;

  @Column({ type: 'int', nullable : true })
  created_by: number;

  @Column({ type: 'int', nullable: true })
  updated_by: number;

  @Column({ type: 'varchar', nullable: true })
  photo_url: string;

  @Column({ type: 'int', nullable : true })
  cp_detail_id: number;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  auditupdate: Date;
}