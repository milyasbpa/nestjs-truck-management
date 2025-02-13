import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TypeOfRFIDSubmitionEnum } from '@utils/enums';
import { RfidReaderIn } from './rfid-reader-in.entity';
import { RfidReaderOut } from './rfid-reader-out.entity';

@Entity({ name: 'rfid_transaction_archieve'})
export class RfidTransactionArchieve {
  @PrimaryGeneratedColumn('increment')
  id: number;
  
  @Column({ type: 'int8', nullable: true })
  rfid_transaction_id: number;

  @Column({ type: 'int8', nullable: true })
  cp_assignment_id: number;

  @Column({ type: 'int8', nullable: true })
  truck_id: number;

  @Column({
    name: 'event_type',
    type: 'enum',
    enum: TypeOfRFIDSubmitionEnum,
    default: TypeOfRFIDSubmitionEnum.ONPROCESS,
    nullable: false,
  })
  event_type: TypeOfRFIDSubmitionEnum;

  @Column({ type: 'int8', nullable: true })
  rfid_reader_in_id: number;

  @Column({ type: 'int8', nullable: true })
  rfid_reader_out_id: number;

  @Column({ type: 'varchar', nullable: true })
  device_id: string;

  @Column({ type: 'boolean', nullable: true })
  is_valid_rfid: boolean;

  @Column({ type: 'boolean', default: true })
  is_valid: boolean

  @Column({ type: 'integer', default: true })
  cp_id: number

  @Column({ type: 'timestamptz', nullable: true })
  rfid_transaction_date: Date;

  @Column({ type: 'timestamptz', nullable: true })
  deleted_at: Date;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  auditupdate: Date;

  @ManyToOne(() => RfidReaderIn)
  @JoinColumn({ name: 'rfid_reader_in_id' })
  rfid_reader_in: RfidReaderIn;

  @ManyToOne(() => RfidReaderOut)
  @JoinColumn({ name: 'rfid_reader_out_id' })
  rfid_reader_out: RfidReaderOut;

}