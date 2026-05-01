import { BadRequestException } from '@nestjs/common';

const SUPPORTED_SCHEMA_TYPES = ['object', 'array', 'string', 'number', 'integer', 'boolean', 'null'] as const;
const SUPPORTED_SCHEMA_KEYS = new Set([
  'type',
  'properties',
  'required',
  'items',
  'enum',
  'additionalProperties',
  'description',
]);

type SupportedSchemaType = (typeof SUPPORTED_SCHEMA_TYPES)[number];
type JsonRecord = Record<string, unknown>;

export function ensureSchemaDocument(value: unknown, fieldName: string): JsonRecord | null {
  if (value === undefined || value === null) return null;

  if (!isPlainObject(value)) {
    throw new BadRequestException(`${fieldName} must be a JSON object`);
  }

  validateSchemaNode(value, fieldName);

  return value;
}

export function validateValueAgainstSchema(value: unknown, schema: JsonRecord): string[] {
  return collectSchemaErrors(value, schema, '$');
}

export function isPlainObject(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function validateSchemaNode(schema: JsonRecord, path: string) {
  for (const key of Object.keys(schema)) {
    if (!SUPPORTED_SCHEMA_KEYS.has(key)) {
      throw new BadRequestException(`${path}.${key} is not supported in M07 schema validation`);
    }
  }

  if (schema.type !== undefined) {
    if (typeof schema.type !== 'string' || !SUPPORTED_SCHEMA_TYPES.includes(schema.type as SupportedSchemaType)) {
      throw new BadRequestException(`${path}.type must be one of ${SUPPORTED_SCHEMA_TYPES.join(', ')}`);
    }
  }

  if (schema.properties !== undefined) {
    if (!isPlainObject(schema.properties)) {
      throw new BadRequestException(`${path}.properties must be a JSON object`);
    }

    for (const [key, child] of Object.entries(schema.properties)) {
      if (!isPlainObject(child)) {
        throw new BadRequestException(`${path}.properties.${key} must be a JSON object schema`);
      }

      validateSchemaNode(child, `${path}.properties.${key}`);
    }
  }

  if (schema.required !== undefined) {
    if (!Array.isArray(schema.required) || !schema.required.every((item) => typeof item === 'string')) {
      throw new BadRequestException(`${path}.required must be an array of strings`);
    }
  }

  if (schema.items !== undefined) {
    if (!isPlainObject(schema.items)) {
      throw new BadRequestException(`${path}.items must be a JSON object schema`);
    }

    validateSchemaNode(schema.items, `${path}.items`);
  }

  if (schema.enum !== undefined) {
    if (!Array.isArray(schema.enum)) {
      throw new BadRequestException(`${path}.enum must be an array`);
    }
  }

  if (
    schema.additionalProperties !== undefined &&
    typeof schema.additionalProperties !== 'boolean'
  ) {
    throw new BadRequestException(`${path}.additionalProperties must be a boolean in M07`);
  }
}

function collectSchemaErrors(value: unknown, schema: JsonRecord, path: string): string[] {
  const errors: string[] = [];
  const type = typeof schema.type === 'string' ? schema.type : undefined;

  if (schema.enum !== undefined && Array.isArray(schema.enum) && !schema.enum.some((item) => isEqual(item, value))) {
    errors.push(`${path} must match one of the enum values`);
    return errors;
  }

  if (type) {
    if (type === 'object') {
      if (!isPlainObject(value)) {
        errors.push(`${path} must be an object`);
        return errors;
      }

      const properties = isPlainObject(schema.properties) ? schema.properties : {};
      const required = Array.isArray(schema.required) ? schema.required.filter((item): item is string => typeof item === 'string') : [];

      for (const key of required) {
        if (!(key in value)) {
          errors.push(`${path}.${key} is required`);
        }
      }

      for (const [key, propertySchema] of Object.entries(properties)) {
        if (!(key in value)) continue;

        if (!isPlainObject(propertySchema)) {
          errors.push(`${path}.${key} has an invalid schema`);
          continue;
        }

        errors.push(...collectSchemaErrors(value[key], propertySchema, `${path}.${key}`));
      }

      if (schema.additionalProperties === false) {
        for (const key of Object.keys(value)) {
          if (!(key in properties)) {
            errors.push(`${path}.${key} is not allowed`);
          }
        }
      }

      return errors;
    }

    if (type === 'array') {
      if (!Array.isArray(value)) {
        errors.push(`${path} must be an array`);
        return errors;
      }

      if (isPlainObject(schema.items)) {
        value.forEach((item, index) => {
          errors.push(...collectSchemaErrors(item, schema.items as JsonRecord, `${path}[${index}]`));
        });
      }

      return errors;
    }

    if (type === 'string' && typeof value !== 'string') {
      errors.push(`${path} must be a string`);
      return errors;
    }

    if (type === 'number' && (typeof value !== 'number' || Number.isNaN(value))) {
      errors.push(`${path} must be a number`);
      return errors;
    }

    if (type === 'integer' && (!Number.isInteger(value))) {
      errors.push(`${path} must be an integer`);
      return errors;
    }

    if (type === 'boolean' && typeof value !== 'boolean') {
      errors.push(`${path} must be a boolean`);
      return errors;
    }

    if (type === 'null' && value !== null) {
      errors.push(`${path} must be null`);
      return errors;
    }
  }

  return errors;
}

function isEqual(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}
