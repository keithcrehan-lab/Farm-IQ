import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsPositive } from 'class-validator';

export class JoinGroupBuyOfferDto {
  @ApiProperty({
    required: false,
    example: 8,
    description:
      "Required when the offer has no fertiliserProductCategory (no automatic requirement available). Optional otherwise — omit to use the amount from the farm's current fertiliser plan.",
  })
  @IsOptional()
  @IsPositive()
  quantityTonnes?: number;
}
