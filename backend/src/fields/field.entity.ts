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
import { Farm } from '../farms/farm.entity';
import { SoilTest } from '../soil-tests/soil-test.entity';

export enum SoilType {
  MINERAL = 'mineral',
  PEAT = 'peat',
  GLEY = 'gley',
  UNKNOWN = 'unknown',
}

export enum LandUse {
  GRAZING = 'grazing',
  SILAGE = 'silage',
  TILLAGE = 'tillage',
  ROUGH_GRAZING = 'rough_grazing',
  OTHER = 'other',
}

/** Minimal GeoJSON Polygon shape — a linear ring of [lng, lat] positions per array. */
export interface GeoJsonPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

@Entity('fields')
export class Field {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Farm, (farm) => farm.fields, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'farm_id' })
  farm: Farm;

  @Column({ name: 'farm_id' })
  farmId: string;

  @Column()
  name: string;

  /**
   * Field boundary as a GeoJSON Polygon (WGS84, SRID 4326). TypeORM's postgres
   * driver serializes/deserializes this automatically via ST_GeomFromGeoJSON /
   * ST_AsGeoJSON, so entities read and write plain GeoJSON — no manual WKT handling.
   */
  @Column({
    type: 'geometry',
    spatialFeatureType: 'Polygon',
    srid: 4326,
  })
  boundary: GeoJsonPolygon;

  /** Always server-computed from `boundary` — see FieldsService.computeAreaHa. */
  @Column({ type: 'numeric', precision: 8, scale: 3, name: 'area_ha' })
  areaHa: number;

  @Column({ type: 'enum', enum: SoilType, name: 'soil_type', default: SoilType.UNKNOWN })
  soilType: SoilType;

  @Column({ type: 'enum', enum: LandUse, name: 'land_use', default: LandUse.GRAZING })
  landUse: LandUse;

  @OneToMany(() => SoilTest, (test) => test.field)
  soilTests: SoilTest[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
