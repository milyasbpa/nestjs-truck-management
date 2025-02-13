import { Entity, Column, CreateDateColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: 'last_truck_movement' })
export class LastTruckMovement {
  @PrimaryColumn()
  truck_id: number;

  @Column({ type: 'varchar' })
  nomor_lambung: string;

  @Column({ type: 'varchar', length: 20 })
  contractor: string;

  @Column({
    name: 'lat',
    type: 'double precision',
    nullable: true,
  })
  lat: number;

  @Column({
    name: 'lng',
    type: 'double precision',
    nullable: true,
  })
  lng: number;

  @Column({ type: 'string' })
  geofence: string;

  @Column({ type: 'timestamptz' })
  gps_time: Date;
}
