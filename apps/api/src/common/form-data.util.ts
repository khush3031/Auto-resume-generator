import { BadRequestException } from '@nestjs/common';

const DISALLOWED_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const CONTROL_CHAR_PATTERN = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;

export const MAX_FORM_DATA_KEYS = 300;
export const MAX_FORM_DATA_KEY_LENGTH = 80;
export const MAX_FORM_DATA_VALUE_LENGTH = 4000;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function normalizeFormDataRecord(
  value: unknown,
  fieldName = 'formData',
): Record<string, string> {
  if (!isPlainObject(value)) {
    throw new BadRequestException(`${fieldName} must be a plain object`);
  }

  const entries = Object.entries(value);
  if (entries.length > MAX_FORM_DATA_KEYS) {
    throw new BadRequestException(
      `${fieldName} cannot contain more than ${MAX_FORM_DATA_KEYS} fields`,
    );
  }

  const normalized: Record<string, string> = {};

  for (const [rawKey, rawValue] of entries) {
    const key = rawKey.trim();
    if (!key) {
      throw new BadRequestException(`${fieldName} contains an empty field name`);
    }
    if (DISALLOWED_KEYS.has(key)) {
      throw new BadRequestException(`${fieldName}.${key} is not allowed`);
    }
    if (key.length > MAX_FORM_DATA_KEY_LENGTH) {
      throw new BadRequestException(
        `${fieldName}.${key} exceeds ${MAX_FORM_DATA_KEY_LENGTH} characters`,
      );
    }
    if (typeof rawValue !== 'string') {
      throw new BadRequestException(`${fieldName}.${key} must be a string`);
    }
    if (rawValue.length > MAX_FORM_DATA_VALUE_LENGTH) {
      throw new BadRequestException(
        `${fieldName}.${key} exceeds ${MAX_FORM_DATA_VALUE_LENGTH} characters`,
      );
    }

    normalized[key] = rawValue.replace(CONTROL_CHAR_PATTERN, '');
  }

  return normalized;
}
