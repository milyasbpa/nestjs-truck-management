import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'cp_exit_type' })
export class CpExitType {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', nullable: false })
  type: string;
}
