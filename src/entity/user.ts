import { Column, Entity } from 'typeorm';
import { AbstractEntity } from './abstract.entity';

@Entity({ name: 'users' })
export class User extends AbstractEntity {
  @Column({ length: 50 })
  email: string;

  @Column({ length: 200 })
  name: string;

  @Column({ length: 200, nullable: true })
  username!: string;

  @Column({ length: 500, nullable: true })
  avatar!: string;

  @Column({ length: 500, nullable: true })
  passw!: string;

  @Column({ length: 500, nullable: true })
  role_name!: string;

}
