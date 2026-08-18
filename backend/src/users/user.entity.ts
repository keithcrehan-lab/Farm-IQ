import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Farm } from '../farms/farm.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  // Never selected by default — see UsersService.findByEmailWithPassword.
  @Column({ name: 'password_hash', select: false })
  passwordHash: string;

  @Column({ type: 'varchar', name: 'full_name', nullable: true })
  fullName: string | null;

  @OneToMany(() => Farm, (farm) => farm.owner)
  farms: Farm[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
