import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { VidiotronNotif } from './vidiotron-notif.entity';

@Entity({ name: 'queue_vidiotron' })
export class QueueVidiotron {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'int' })
  lane_id: number;

  @Column({ type: 'int' })
  vidiotron_notif_id: number;

  @Column({ type: 'varchar', length: 120, nullable: false })
  lane_name: string;

  @Column({ type: 'varchar', length: 20, nullable: false })
  nomorlambung: string;

  @Column({ type: 'integer' })
  flag: number;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  auditupdate: Date;

  @OneToOne(() => VidiotronNotif, (vidiotron) => vidiotron.queue_vidiotron)
  @JoinColumn({ name: 'vidiotron_notif_id' })
  vidiotron_notif: VidiotronNotif;
}
