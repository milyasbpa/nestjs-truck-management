import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'cp_entrance_type' })
export class CpEntranceType {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', nullable: false })
  type: string;
}
