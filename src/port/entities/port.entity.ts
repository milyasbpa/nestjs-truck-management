import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { TypeOfPortEnum } from "src/utils/enums";

@Entity({ name: "ports" })
export class Port {
  @PrimaryGeneratedColumn("increment")
  id: number;

  @Column({ type: "enum", enum: TypeOfPortEnum, default: TypeOfPortEnum.SEA })
  typeofport: TypeOfPortEnum;

  @Column({ type: "jsonb", nullable: true })
  geo_location: Record<string, any>;

  @Column({ type: "varchar", length: 10, nullable: false })
  port_code: string;

  @Column({ type: "varchar", length: 255, nullable: false })
  port_name: string;

  @Column({ type: "text", nullable: true })
  address: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  image_path: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "int" })
  max_total_capacity: number;

  @Column({ type: "int", default: 0 })
  current_load: number;

  @Column({ type: "boolean", default: true })
  port_status: boolean;

  @CreateDateColumn({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  createdat: Date;

  @UpdateDateColumn({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  auditupdate: Date;
}
