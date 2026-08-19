import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from './conversation.entity';
import { Message, MessageRole } from './message.entity';
import { FarmsService } from '../farms/farms.service';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationsRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private readonly messagesRepository: Repository<Message>,
    private readonly farmsService: FarmsService,
  ) {}

  create(farmId: string): Promise<Conversation> {
    const conversation = this.conversationsRepository.create({ farmId });
    return this.conversationsRepository.save(conversation);
  }

  async findAllForFarm(farmId: string, ownerId: string): Promise<Conversation[]> {
    await this.farmsService.findOneOwned(farmId, ownerId);
    return this.conversationsRepository.find({ where: { farmId }, order: { updatedAt: 'DESC' } });
  }

  async findOneOwned(
    farmId: string,
    conversationId: string,
    ownerId: string,
  ): Promise<Conversation> {
    await this.farmsService.findOneOwned(farmId, ownerId);
    const conversation = await this.conversationsRepository.findOne({
      where: { id: conversationId, farmId },
    });
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    return conversation;
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    return this.messagesRepository.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
    });
  }

  async addMessage(conversationId: string, role: MessageRole, content: string): Promise<Message> {
    const message = this.messagesRepository.create({ conversationId, role, content });
    const saved = await this.messagesRepository.save(message);
    // Explicit bump — this is a plain UPDATE, not a save() of the full entity,
    // so @UpdateDateColumn only fires because we ask for it here.
    await this.conversationsRepository.update(conversationId, { updatedAt: new Date() });
    return saved;
  }

  async remove(farmId: string, conversationId: string, ownerId: string): Promise<void> {
    const conversation = await this.findOneOwned(farmId, conversationId, ownerId);
    await this.conversationsRepository.remove(conversation);
  }
}
