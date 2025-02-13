import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({name: 'text_to_speech_config'})
export class TextToSpeechConfig {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({name: 'code', type: 'varchar'})
  code: string;

  @Column({name: 'text_speech', type: 'varchar'})
  text_speech: string;

  @Column({name: 'description', type: 'varchar'})
  description: string;

  @Column({ type: 'int' })
  created_by: number;

  @Column({ type: 'int' })
  updated_by: number;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  auditupdate: Date;
}