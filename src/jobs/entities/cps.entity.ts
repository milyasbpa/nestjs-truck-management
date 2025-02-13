import { IsOptional } from 'class-validator';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { CpDevices } from 'src/cp/entities/cp_devices.entity';
import { RuleOfCp } from 'src/cp/entities/cp_rule.entity';
import { RuleLaneCp } from 'src/cp/entities/cp_rule_lane.entity';
import { CpStatusLog } from 'src/cp/entities/cp_status_log.entity';
import { CpTonages } from 'src/cp/entities/cp_tonages';
import { CpDetailGeofence } from 'src/cp/entities/cp_detail_geofence.entity';
import { CpDetail } from './cp_details.entity';
import { CpEntranceDetail } from 'src/cp/entities/cp_entrance_detail.entity';
import { CpExitDetail } from 'src/cp/entities/cp_exit_detail.entity';

@Entity({ name: 'cps' })
export class Cps {
  @PrimaryGeneratedColumn('increment')
  cp_id: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  cp_name: string;

  @Column({ type: 'bigint', nullable: false })
  max_capacity: number;

  @Column({ type: 'bigint', nullable: false })
  current_load: number;

  @Column({ type: 'bigint' })
  created_by: number;

  @Column({ type: 'bigint' })
  positioning: number;

  @Column({ type: 'boolean' })
  status: boolean;

  @Column({ type: 'boolean' })
  in_lane: boolean;

  @Column({ type: 'boolean' })
  out_lane: boolean;

  @Column({ type: 'boolean' })
  dumping_area: boolean;

  @Column({ type: 'varchar', length: 255, nullable: false })
  reason_off: string;

  @Column({ type: 'varchar', length: 20, nullable: false })
  allow_unit: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  reason_in_lane: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  reason_out_lane: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  reason_dumping_area: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  priority_update_status: string;

  @Column({ type: 'varchar' })
  geofence_kode: string;

  @Column({ type: 'varchar' })
  sicantik_code: string;

  @Column({ type: 'varchar' })
  updated_by: string;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  auditupdate: Date;

  @OneToMany(() => CpDevices, (cpDevice) => cpDevice.cp)
  cp_devices: CpDevices[];

  @OneToMany(() => RuleOfCp, (rule) => rule.cp)
  rule_truck: RuleOfCp[];

  @OneToMany(() => RuleLaneCp, (lane) => lane.cp)
  rule_lane_cp: RuleLaneCp[];

  @OneToMany(() => CpStatusLog, (status) => status.cp)
  cp_status_log: CpStatusLog[];

  @OneToMany(() => CpTonages, (tonages) => tonages.cp)
  cp_tonages: CpTonages[];

  @OneToMany(
    () => CpDetailGeofence,
    (cp_geofences) => cp_geofences.cp_geofences,
  )
  cp_geofences: CpDetailGeofence[];

  @OneToMany(() => CpDetail, (cp_details) => cp_details.cp_details)
  cp_details: CpDetail[];

  @OneToMany(
    () => CpEntranceDetail,
    (cp_geofences) => cp_geofences.cp_entrance_details,
  )
  cp_entrance_details: CpEntranceDetail[];

  @OneToMany(() => CpExitDetail, (cp_geofences) => cp_geofences.cp_exit_details)
  cp_exit_details: CpExitDetail[];
}
