import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum StatusEnum {
  ACTIVE = 'ACTIVE',
  NOT_ACTIVE = 'NOT ACTIVE',
  MAINTENANCE = 'MAINTENANCE',
}

@Entity('cctv')
export class Cctv {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true, nullable: true })
  cctv_id: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  cctv_name: string;

  @Column({ type: 'text', nullable: true })
  location_cctv: string;

  @Column({ type: 'jsonb', nullable: true })
  geo_location: Record<string, any>;

  @Column({ type: 'enum', enum: StatusEnum, default: StatusEnum.ACTIVE })
  status: StatusEnum;

  @Column({ type: 'varchar', length: 255, nullable: true })
  url_stream: string;

  @Column({ type: 'date', nullable: true })
  installation_date: Date;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdat: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  auditupdate: Date;
}
