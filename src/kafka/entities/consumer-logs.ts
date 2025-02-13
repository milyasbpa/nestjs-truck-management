import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('consumer_logs')
export class ConsumerLogs {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  topic_name: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  source: string;

  @Column({ type: 'text', nullable: true })
  payload: string;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}