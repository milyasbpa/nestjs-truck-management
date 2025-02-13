import { Column, Entity } from 'typeorm';

@Entity('vidiotron_cp')
export class VidiotronCp {
  @Column({ type: 'int8', nullable : false })
  vidiotron_id: number;
  @Column({ type: 'int8', nullable : false })
  cp_id: number;
}