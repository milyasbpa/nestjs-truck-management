
import { Trucks } from 'src/trucks/entities/trucks.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';

@Entity('ucan') // Matches the table name in the database
@Unique('ucan_nomor_lambung_key', ['nomorLambung']) // Matches the unique index
export class Ucan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'nomor_lambung', type: 'varchar' })
  nomorLambung: string;

  @Column({
    name: 'closing_ritase_timestamp',
    type: 'timestamp',
  })
  closingRitaseTimestamp: Date;

  @Column({ name: 'net_weight', type: 'numeric', precision: 10, scale: 2 })
  netWeight: number;

  @Column({ name: 'tare_weight', type: 'numeric', precision: 10, scale: 2 })
  tareWeight: number;

  @Column({ name: 'gross_weight', type: 'numeric', precision: 10, scale: 2 })
  grossWeight: number;

  // Define the relationship with the `trucks` table
  @ManyToOne(() => Trucks, (truck) => truck.nomor_lambung, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'nomor_lambung' }) // Foreign key column
  truck: Trucks;
}
