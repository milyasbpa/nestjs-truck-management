import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TrafficStatusEnum } from 'src/utils/enums';

@Entity({ name: 'Routes' })
export class Routes {
  @PrimaryGeneratedColumn('increment')
  route_id: number;

  @Column({ type: 'int' })
  lane_id: number;

  @Column({ type: 'jsonb', nullable: true })
  start_location: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  end_location: Record<string, any>;

  @Column({ type: 'int', nullable: false })
  estimated_time: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: false })
  distance_km: number;

  @Column({
    type: 'enum',
    enum: TrafficStatusEnum,
    default: TrafficStatusEnum.CLEAR,
  })
  traffic_status: TrafficStatusEnum;

  @Column({ type: 'int', nullable: true })
  cctv_id: number;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdat: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  auditupdate: Date;
}
