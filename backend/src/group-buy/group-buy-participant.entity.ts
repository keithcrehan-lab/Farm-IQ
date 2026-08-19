import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { GroupBuyOffer } from './group-buy-offer.entity';
import { Farm } from '../farms/farm.entity';

/**
 * One farm's commitment to an offer. `quantityTonnes` is a SNAPSHOT taken at
 * join time (auto-filled from the farm's fertiliser plan where the offer
 * supports that, or supplied by the farmer otherwise) — it deliberately does
 * not track the farm's live plan afterwards, the same way a real order
 * commitment wouldn't silently change after the farmer confirms it.
 */
@Entity('group_buy_participants')
@Index(['offerId', 'farmId'], { unique: true })
export class GroupBuyParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => GroupBuyOffer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'offer_id' })
  offer: GroupBuyOffer;

  @Column({ name: 'offer_id' })
  offerId: string;

  @ManyToOne(() => Farm, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'farm_id' })
  farm: Farm;

  @Column({ name: 'farm_id' })
  farmId: string;

  @Column({ type: 'numeric', precision: 8, scale: 2, name: 'quantity_tonnes' })
  quantityTonnes: number;

  @CreateDateColumn({ name: 'joined_at' })
  joinedAt: Date;
}
