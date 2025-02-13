import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'rfid_threshold'})
export class RfidThreshold {
  @PrimaryGeneratedColumn('increment')
  rfid_threshold_id: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string;


  @Column({ type: 'int', nullable: true })
  min_threshold_in_hours: number;

  @Column({ type: 'int', nullable: true })
  max_threshold_in_hours: number;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}