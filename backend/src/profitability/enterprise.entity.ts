import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Farm, FarmType } from '../farms/farm.entity';

/**
 * A distinct business line on a farm — a farm's overall FarmType is one
 * label for the whole operation, but a single farm can run several
 * enterprises side by side (suckler + sheep + tillage). Reuses FarmType's
 * categories rather than inventing a parallel enum.
 */
@Entity('enterprises')
export class Enterprise {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Farm, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'farm_id' })
  farm: Farm;

  @Column({ name: 'farm_id' })
  farmId: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: FarmType })
  type: FarmType;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
