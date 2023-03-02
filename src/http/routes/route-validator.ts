import Joi from "joi";
import { ApiValidationBadRequestError } from "src/errors/api-validation-bad-request-error";

export abstract class RouteValidator {
  protected validate<Data, Result>(schema: Joi.Schema, data: Data): Result {
    const { error, value } = schema.validate(data, { stripUnknown: true });
    if (error) throw new ApiValidationBadRequestError(error.message);
    return value;
  }
}
