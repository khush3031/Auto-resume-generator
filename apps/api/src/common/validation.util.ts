import Joi from 'joi';
import { BadRequestException } from '@nestjs/common';

export function validateSchema<T>(schema: Joi.Schema, payload: any): T {
  const { error, value } = schema.validate(payload, {
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true
  });

  if (error) {
    const details = error.details.map((detail) => ({
      message: detail.message,
      path: detail.path
    }));
    throw new BadRequestException({
      success: false,
      data: null,
      message: 'Validation failed',
      details
    });
  }

  return value as T;
}
