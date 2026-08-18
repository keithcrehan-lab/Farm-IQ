import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Farm } from '../farms/farm.entity';

export enum BuildingType {
  SLATTED = 'slatted',
  CALVING = 'calving',
  LOOSE_HOUSING = 'loose_housing',
  STRAW_BEDDED = 'straw_bedded',
  OTHER = 'other',
}

@Entity('buildings')
export class Building {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Farm, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'farm_id' })
  farm: Farm;

  @Column({ name: 'farm_id' })
  farmId: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: BuildingType })
  type: BuildingType;

  @Column({ type: 'int', name: 'capacity_head' })
  capacityHead: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
