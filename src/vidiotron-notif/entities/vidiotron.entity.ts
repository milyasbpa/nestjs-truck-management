import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { VidiotronLane } from './vidiotron-lane.entity';

@Entity('vidiotron')
export class Vidiotron {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', nullable: true })
  code: string;

  @Column({ type: 'varchar', nullable: true })
  description: string;

  @Column({ type: 'varchar', nullable: true })
  ip: string;

  @Column({ type: 'boolean' })
  status: boolean;

  @Column({ type: 'boolean' })
  is_dynamic: boolean;

  @Column({ type: 'boolean' })
  count_geofence: boolean;

  @Column({ type: 'integer' })
  max_value: number;

  @OneToOne(() => VidiotronLane, (vl) => vl.vidiotron)
  @JoinColumn({ name: 'id', referencedColumnName: 'vidiotron_id' })
  vidiotron_lane: VidiotronLane;

  @Column({ type: 'boolean' })
  is_show_ads: boolean;

  @Column({ type: 'json', nullable : true })
  ads_command: any;
}
