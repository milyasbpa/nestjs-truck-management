import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'trucks' })
export class Trucks {
  @PrimaryColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 20, nullable: false })
  nomor_lambung: string;

  @Column({ type: 'numeric', precision: 5, scale: 2 })
  capacity_in_tons: number;

  @Column({ type: 'int', nullable: true })
  year_made: number;

  @Column({ type: 'int', nullable: true })
  created_by: number;

  @Column({ type: 'int', nullable: true })
  updated_by: number;

  @Column({
    type: 'boolean',
    transformer: {
      to: (value: boolean): boolean => value,
      from: (value: any): boolean => {
        return value === '1' || value === 'true' || value === true;
      },
    },
    default: true,
  })
  status: boolean;

  @Column({ type: 'varchar', nullable: true })
  model: string;

  @Column({ type: 'varchar', nullable: true })
  brand: string;

  @Column({ type: 'varchar' })
  typeoftruck: string;

  @Column({ type: 'varchar', nullable: true })
  source: string;

  @Column({ type: 'varchar', nullable: true })
  description: string;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  auditupdate: Date;
}
