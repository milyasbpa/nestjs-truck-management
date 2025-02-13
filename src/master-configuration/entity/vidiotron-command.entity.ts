import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { VidiotronCommandDetail } from './vidiotron-command-detail.entity';

@Entity({ name: 'vidiotron_command' })
export class VidiotronCommand {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'code', type: 'varchar' })
  code: string;

  @Column({ name: 'command_name', type: 'text' })
  command_name: string;

  @Column({ name: 'description', type: 'varchar' })
  description: string;

  @OneToMany(
    () => VidiotronCommandDetail,
    (detail) => detail.vidiotronCommand,
    { cascade: true },
  )
  detail: VidiotronCommandDetail[];

  @Column({ type: 'int' })
  created_by: number;

  @Column({ type: 'int' })
  updated_by: number;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  auditupdate: Date;
}