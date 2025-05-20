import { ValidationError } from 'class-validator';

export const parseValidationErrors = (validationErrors: ValidationError[]) => {
  return validationErrors.map((e) => ({
    fieldName: e.property,
    constraints: e.constraints || (e.children && parseChildren(e.children)),
  }));
};

// Parse validation error children recursively
const parseChildren = (children: ValidationError[]) => {
  return children.reduce((prevError, currError) => {
    return {
      ...prevError,
      [currError.property]: currError.constraints || (currError.children && parseChildren(currError.children)),
    };
  }, {});
};
