import { Lanes } from 'src/lane/entities/lane.entity';
import { Column, Entity, OneToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { Vidiotron } from './vidiotron.entity';
import { QueueLane } from 'src/queue_lane/entities/queue_lane.entity';

@Entity('vidiotron_lane')
export class VidiotronLane {
  @PrimaryColumn({ type: 'int8', nullable: false })
  vidiotron_id: number;
  @PrimaryColumn({ type: 'int8', nullable: false })
  lane_id: number;

  @OneToOne(() => Lanes, (lane) => lane.vidiotron_lane)
  @JoinColumn({ name: 'lane_id', referencedColumnName: 'id' })
  lanes: Lanes;

  @OneToOne(() => QueueLane, (queue_lane) => queue_lane.vidiotron_lane)
  @JoinColumn({ name: 'lane_id', referencedColumnName: 'id' })
  queue_lane: QueueLane;

  @OneToOne(() => Vidiotron, (vidiotron) => vidiotron.vidiotron_lane)
  @JoinColumn({ name: 'vidiotron_id', referencedColumnName: 'id' })
  vidiotron: Vidiotron;
}
