import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  Index, 
  CreateDateColumn, 
  UpdateDateColumn 
} from "typeorm";

@Entity({ name: "geofences", schema: "public" })
export class Geofence {
  @PrimaryGeneratedColumn("increment", { name: "geofence_id" })
  geofenceId: number;

  @Column({ name: "name", type: "varchar", length: 50, nullable: true })
  @Index("idx_geofences_name", { unique: false })
  name: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz", default: () => "now()", nullable: true })
  createdAt: Date | null;

  @Column({ name: "created_by", type: "bigint", nullable: true })
  createdBy: number | null;

  @UpdateDateColumn({ name: "auditupdate", type: "timestamptz", default: () => "now()", nullable: true })
  auditUpdate: Date | null;

  @Column({ name: "updated_by", type: "bigint", nullable: true })
  updatedBy: number | null;

  @Column({ name: "geotype", type: "varchar", length: 255, nullable: true })
  geoType: string | null;

  @Column({ name: "area", type: "geometry", nullable: true })
  area: string | null;
}
