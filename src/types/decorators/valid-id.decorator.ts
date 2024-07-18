import { buildMessage, ValidateBy, ValidationOptions } from 'class-validator';
import { Types } from 'mongoose';

export const IS_VALID_OBJECT_ID = 'isValidObjectId';
export const IS_VALID_OBJECT_ID_ARRAY = 'isValidObjectIdArray';

export function isValidObjectId(id: string | number): boolean {
  return Types.ObjectId.isValid(id);
}

export function IsValidObjectId(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return ValidateBy(
    {
      name: IS_VALID_OBJECT_ID,
      validator: {
        validate: (value): boolean => isValidObjectId(value),
        defaultMessage: buildMessage(
          (eachPrefix) => eachPrefix + '$property must be a valid mongo id',
          validationOptions,
        ),
      },
    },
    validationOptions,
  );
}

export function IsValidObjectIdArray(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return ValidateBy(
    {
      name: IS_VALID_OBJECT_ID_ARRAY,
      validator: {
        validate: (value): boolean =>
          Array.isArray(value) && value.every(isValidObjectId),
        defaultMessage: buildMessage(
          (eachPrefix) => eachPrefix + '$property must be a valid mongo id',
          validationOptions,
        ),
      },
    },
    validationOptions,
  );
}
