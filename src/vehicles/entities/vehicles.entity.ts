import { Transform } from 'class-transformer';
import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('vehicles')
export class Vehicles {
  @PrimaryColumn({ type: 'bigint' })
  VehicleId: number;

  @Column({ type: 'bigint' })
  VehicleUserId: number;

  @Column({ type: 'varchar', length: 50 })
  VehicleDevice: string;

  @Column({ type: 'varchar', length: 20 })
  VehicleNo: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  VehicleNoBackup: string | null;

  @Column({ type: 'varchar', length: 50 })
  VehicleName: string;

  @Column({ type: 'bigint' })
  @Transform(({ value }) => (isNaN(value) ? null : value))
  VehicleCardNo: string;

  @Column({ type: 'varchar', length: 50 })
  VehicleOperator: string;

  @Column({ type: 'smallint' })
  VehicleStatus: number;

  @Column({ type: 'varchar', length: 50 })
  VehicleImage: string;

  @Column({ type: 'timestamp' })
  VehicleCreatedDate: Date;

  @Column({ type: 'varchar', length: 20 })
  VehicleType: string;

  @Column({ type: 'int' })
  VehicleCompany: number;

  @Column({ type: 'int' })
  VehicleSubCompany: number;

  @Column({ type: 'int' })
  VehicleGroup: number;

  @Column({ type: 'int' })
  VehicleSubGroup: number;

  @Column({ type: 'date' })
  VehicleTanggalPasang: Date;

  @Column({ type: 'bigint' })
  VehicleImei: number;

  @Column({ type: 'bigint' })
  VehicleMV03: number;

  @Column({ type: 'varchar', length: 10 })
  VehicleSensor: string;

  @Column({ type: 'varchar', length: 10 })
  VehicleSOS: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  VehiclePortalRangka: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  VehiclePortalMesin: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  VehiclePortalRfidSPI: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  VehiclePortalRfidWIM: string | null;

  @Column({ type: 'numeric', nullable: true })
  VehiclePortalPortalTare: number | null;

  @Column({ type: 'timestamp', nullable: true })
  VehiclePortTime: Date | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  VehiclePortName: string | null;

  @Column({ type: 'timestamp' })
  VehicleRomTime: Date;

  @Column({ type: 'varchar', length: 50 })
  VehicleRomName: string;
}
