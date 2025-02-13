import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'rfid_anomaly'})
export class RfidAnomaly {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  desc: string;

  @Column({ type: 'varchar', nullable: true })
  type_anomaly: string;

  @Column({ type: 'int', nullable: true })
  rfid_transaction_id: number;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  deleted_at: Date;
}