const Joi = require('joi');

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);

    if (error) {
      const messages = error.details.map(detail => detail.message);
      return res.status(400).json({ errors: messages });
    }

    req.validated = value;
    next();
  };
};

module.exports = { validateRequest };
