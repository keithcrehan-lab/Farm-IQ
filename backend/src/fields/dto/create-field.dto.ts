import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { GeoJsonPolygon, LandUse, SoilType } from '../field.entity';
import { IsGeoJsonPolygon } from '../validators/is-geojson-polygon.validator';

export class CreateFieldDto {
  @ApiProperty({ example: 'Field 04' })
  @IsString()
  @MaxLength(60)
  name: string;

  @ApiProperty({
    description: 'Field boundary as a closed GeoJSON Polygon in WGS84 (lng, lat).',
    example: {
      type: 'Polygon',
      coordinates: [
        [
          [-8.9711, 53.271],
          [-8.9688, 53.271],
          [-8.9688, 53.2726],
          [-8.9711, 53.2726],
          [-8.9711, 53.271],
        ],
      ],
    },
  })
  @IsGeoJsonPolygon()
  boundary: GeoJsonPolygon;

  @ApiProperty({ enum: SoilType, required: false })
  @IsOptional()
  @IsEnum(SoilType)
  soilType?: SoilType;

  @ApiProperty({ enum: LandUse, required: false })
  @IsOptional()
  @IsEnum(LandUse)
  landUse?: LandUse;
}
