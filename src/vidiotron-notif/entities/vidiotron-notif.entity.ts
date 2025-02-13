import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { QueueVidiotron } from './vidiotron-queue.entity';

@Entity('vidiotron_notif')
export class VidiotronNotif {
  @PrimaryGeneratedColumn('increment')
  vidiotron_notif_id: number;

  @Column({ type: 'varchar', nullable : true })
  header: string;

  @Column({ type: 'varchar', nullable : true })
  body_description: string;

  @Column({ type: 'varchar', nullable : true })
  total_description: string;

  @Column({ type: 'varchar', nullable : true })
  type_truck_description: string;

  @Column({ type: 'int8', nullable : true })
  lane_id: number;

  @Column({ type: 'int8', nullable : true })
  cp_id: number;

  @Column({ type: 'varchar', nullable : false })
  notif_type: string;

  @Column({ type: 'json', nullable : true })
  command: any;

  @Column({ type: 'boolean', nullable : true })
  status: boolean;

  @Column({ type: 'int8', nullable : true })
  vidiotron_id: number;

  @Column({ type: 'int', nullable : true })
  created_by: number;

  @Column({ type: 'varchar', nullable: true })
  updated_by: number;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  auditupdate: Date;

  @OneToOne(() => QueueVidiotron, (vidiotron) => vidiotron.vidiotron_notif_id)
  @JoinColumn({ name: 'vidiotron_notif_id' })
  queue_vidiotron: QueueVidiotron;
}