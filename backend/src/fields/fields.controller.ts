import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FieldsService } from './fields.service';
import { CreateFieldDto } from './dto/create-field.dto';
import { UpdateFieldDto } from './dto/update-field.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';

@ApiTags('fields')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('farms/:farmId/fields')
export class FieldsController {
  constructor(private readonly fieldsService: FieldsService) {}

  @Post()
  create(
    @CurrentUser() user: User,
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Body() dto: CreateFieldDto,
  ) {
    return this.fieldsService.create(farmId, user.id, dto);
  }

  @Get()
  findAll(@CurrentUser() user: User, @Param('farmId', ParseUUIDPipe) farmId: string) {
    return this.fieldsService.findAllForFarm(farmId, user.id);
  }

  @Get(':fieldId')
  findOne(
    @CurrentUser() user: User,
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Param('fieldId', ParseUUIDPipe) fieldId: string,
  ) {
    return this.fieldsService.findOneOwned(farmId, fieldId, user.id);
  }

  @Patch(':fieldId')
  update(
    @CurrentUser() user: User,
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Param('fieldId', ParseUUIDPipe) fieldId: string,
    @Body() dto: UpdateFieldDto,
  ) {
    return this.fieldsService.update(farmId, fieldId, user.id, dto);
  }

  @Delete(':fieldId')
  remove(
    @CurrentUser() user: User,
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Param('fieldId', ParseUUIDPipe) fieldId: string,
  ) {
    return this.fieldsService.remove(farmId, fieldId, user.id);
  }
}
