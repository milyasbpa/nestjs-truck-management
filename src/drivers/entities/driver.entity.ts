import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

enum TypeofDrivingLicenseEnum {
  SIM_B1 = 'SIM-B1',
  SIM_B2 = 'SIM-B2',
  OTHERS = 'OTHERS',
};

@Entity({ name: 'drivers' })
export class Driver {
  @PrimaryGeneratedColumn('increment')
  driver_id: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  driver_name: string;

  @Column({
    type: 'enum',
    enum: TypeofDrivingLicenseEnum,
    default: TypeofDrivingLicenseEnum.SIM_B2,
  })
  typeofdriving_license: TypeofDrivingLicenseEnum;

  @Column({ type: 'boolean', default: true })
  is_active?: true;

  @Column({ type: 'bigint' })
  created_by: number;

  @Column({ type: 'bigint' })
  updated_by: number;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  auditupdate: Date;
}
