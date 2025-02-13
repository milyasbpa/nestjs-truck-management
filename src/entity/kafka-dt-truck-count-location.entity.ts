import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { AbstractEntity } from './abstract.entity';

@Entity({ name: 'kafka_dt_truck_count_location' })
export class kafkaDTTruckCountLocation {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: "int" })
  total_muatan: number;

  @Column({ type: "int" })
  total_kosongan: number;

  @Column({ type: "json", nullable: true })
  groups!: any;

  @Column({ type: "timestamptz", nullable: true })
  created_at!: Date;
}
