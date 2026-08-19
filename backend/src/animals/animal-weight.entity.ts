import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Animal } from './animal.entity';

/** One weighing — spec section 18. History is retained, never overwritten. */
@Entity('animal_weights')
@Index(['animalId', 'weighDate'])
export class AnimalWeight {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Animal, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'animal_id' })
  animal: Animal;

  @Column({ name: 'animal_id' })
  animalId: string;

  @Column({ type: 'date', name: 'weigh_date' })
  weighDate: string;

  @Column({ type: 'numeric', precision: 6, scale: 1, name: 'weight_kg' })
  weightKg: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
