import { registerDecorator, ValidationOptions } from 'class-validator';
import { GeoJsonPolygon } from '../field.entity';

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isPosition(value: unknown): value is number[] {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    isFiniteNumber(value[0]) &&
    isFiniteNumber(value[1]) &&
    value[0] >= -180 &&
    value[0] <= 180 &&
    value[1] >= -90 &&
    value[1] <= 90
  );
}

function isLinearRing(value: unknown): value is number[][] {
  if (!Array.isArray(value) || value.length < 4 || !value.every(isPosition)) {
    return false;
  }
  const first = value[0];
  const last = value[value.length - 1];
  return first[0] === last[0] && first[1] === last[1];
}

/** Validates a plain object as a closed GeoJSON Polygon with at least an outer ring. */
export function isGeoJsonPolygon(value: unknown): value is GeoJsonPolygon {
  if (typeof value !== 'object' || value === null) return false;
  const polygon = value as Record<string, unknown>;
  return (
    polygon.type === 'Polygon' &&
    Array.isArray(polygon.coordinates) &&
    polygon.coordinates.length >= 1 &&
    polygon.coordinates.every(isLinearRing)
  );
}

export function IsGeoJsonPolygon(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isGeoJsonPolygon',
      target: object.constructor,
      propertyName,
      options: {
        message:
          'boundary must be a closed GeoJSON Polygon: { type: "Polygon", coordinates: [[[lng,lat], ...]] }',
        ...validationOptions,
      },
      validator: {
        validate: (value: unknown) => isGeoJsonPolygon(value),
      },
    });
  };
}
