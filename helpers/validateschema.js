//imports BadRequestError class from module in express error file
const { BadRequestError } = require("../expressError");
const jsonschema = require("jsonschema");

function validateSchema(data, schema) {
  const result = jsonschema.validate(data, schema);
  if (!result.valid) {
    const errs = result.errors.map((e) => e.stack);
    throw new BadRequestError(errs);
  }
}

module.exports = { validateSchema };
