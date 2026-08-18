import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Field } from '../fields/field.entity';

export enum FarmType {
  SUCKLER = 'suckler',
  DAIRY = 'dairy',
  SHEEP = 'sheep',
  TILLAGE = 'tillage',
  MIXED = 'mixed',
  OTHER = 'other',
}

@Entity('farms')
export class Farm {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'varchar', nullable: true })
  county: string | null;

  @Column({ type: 'varchar', name: 'herd_number', nullable: true })
  herdNumber: string | null;

  @Column({ type: 'enum', enum: FarmType, name: 'farm_type', default: FarmType.MIXED })
  farmType: FarmType;

  @ManyToOne(() => User, (user) => user.farms, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column({ name: 'owner_id' })
  ownerId: string;

  @OneToMany(() => Field, (field) => field.farm)
  fields: Field[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
