import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { VidiotronCommand } from './vidiotron-command.entity';

@Entity({name: 'vidiotron_command_detail'})
export class VidiotronCommandDetail {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({name: 'line_id', type: 'int'})
  line_id: number;

  @Column({name: 'tipe', type: 'varchar'})
  tipe: string;

  @Column({name: 'text', type: 'varchar'})
  text: string;

  @Column({name: 'pos_x', type: 'int'})
  pos_x: number;

  @Column({name: 'pos_y', type: 'int'})
  pos_y: number;

  @Column({name: 'absolute', type: 'boolean'})
  absolute: boolean;

  @Column({name: 'align', type: 'varchar'})
  align: string;

  @Column({name: 'size', type: 'int'})
  size: number;

  @Column({name: 'color', type: 'varchar'})
  color: string;

  @Column({name: 'speed', type: 'int'})
  speed: number;

  @Column({name: 'image', type: 'varchar'})
  image: string;

  @Column({name: 'padding', type: 'int'})
  padding: number;

  @Column({name: 'line_height', type: 'int'})
  line_height: number;

  @Column({name: 'width', type: 'int'})
  width: number;

  @Column({name: 'font', type: 'int'})
  font: number;

  @Column({name: 'style', type: 'varchar'})
  style: string;

  @ManyToOne(() => VidiotronCommand, (vidiotronCommand) => vidiotronCommand.detail)
  @JoinColumn({ name: 'vidiotron_command_id' })
  vidiotronCommand: VidiotronCommand;

  @Column({ type: 'int' })
  created_by: number;

  @Column({ type: 'int' })
  updated_by: number;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  auditupdate: Date;
}