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

/**
 * A thread of assistant questions and answers for a farm. Created only once
 * a question has been successfully answered — see AssistantService — so an
 * empty conversation never gets left behind by a failed Gemini call.
 */
@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Farm, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'farm_id' })
  farm: Farm;

  @Column({ name: 'farm_id' })
  farmId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /** Bumped explicitly whenever a message is added — see ConversationsService.addMessage. */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
