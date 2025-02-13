import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'reroute_plans' })
export class ReroutePlan {
  @PrimaryGeneratedColumn('increment')
  reroute_id: number;

  @Column({ type: 'int', nullable: false })
  truck_id: number;

  @Column({ type: 'int', nullable: false })
  original_route_id: number;

  @Column({ type: 'int', nullable: true })
  identity_new_route_id: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  reason: string;

  @Column({ type: 'timestamptz', nullable: false })
  reroute_time: Date;
}
