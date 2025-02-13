import { Cps } from 'src/jobs/entities/cps.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('cp_detail_geofence', { schema: 'public' })
export class CpDetailGeofence {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ type: 'int', nullable: true })
  cp_id: number | null;

  @Column({ type: 'varchar', nullable: true })
  description: string | null;

  @Column({ type: 'bigint' })
  geofence_id: number;

  @Column({ type: 'varchar' })
  geofence_name: string;

  @ManyToOne(() => Cps, (cp) => cp.cp_geofences)
  @JoinColumn({ name: 'cp_id', referencedColumnName: 'cp_id' })
  cp_geofences: Cps;
}
