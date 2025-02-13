import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'streets' })
export class Streets {
  @PrimaryGeneratedColumn({ name: 'street_id' })
  streetId: number;

  @Column({ name: 'street_user', type: 'integer' })
  streetUser: number;

  @Column({ name: 'street_name', type: 'varchar', length: 255, nullable: true })
  streetName: string;

  @Column({
    name: 'street_alias',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  streetAlias: string;

  @Column({
    name: 'street_polygon',
    type: 'geometry',
    spatialFeatureType: 'Polygon',
    srid: 4326,
    nullable: true,
  })
  StreetPolygon: string;

  @Column({ name: 'street_type', type: 'integer', nullable: true })
  StreetType: number;

  @Column({ name: 'street_group', type: 'integer', nullable: true })
  StreetGroup: number;

  @Column({ name: 'street_company', type: 'integer', nullable: true })
  StreetCompany: number;

  @Column({ name: 'street_order', type: 'integer', nullable: true })
  StreetOrder: number;

  @Column({ name: 'street_created', type: 'timestamp', nullable: true })
  StreetCreated: Date;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'auditupdate',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  auditUpdate: Date;
}
