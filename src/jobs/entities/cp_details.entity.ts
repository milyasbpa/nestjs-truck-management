import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Cps } from './cps.entity';

@Entity({ name: 'cp_detail' })
export class CpDetail {
  @PrimaryGeneratedColumn('increment')
  cp_detail_id: number;

  @Column({ type: 'integer', nullable: false })
  cp_id: number;

  @Column({ type: 'varchar', nullable: false })
  desc: string;

  @Column({ type: 'varchar', nullable: false })
  device_id: string;

  @ManyToOne(() => Cps, (cp) => cp.cp_details)
  @JoinColumn({ name: 'cp_id', referencedColumnName: 'cp_id' })
  cp_details: Cps;
}
