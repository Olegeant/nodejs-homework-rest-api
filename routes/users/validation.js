const Joi = require('joi');

const { Subscription } = require('../../config/constants');

const patterns = {
  name: /^[\w\sа-яА-Я]+$/,
  id: /^[\da-f]{24}$/,
  password: /^[\w~!@#$%^&*()+|\-=\\/{}[\]]{8,}$/,
};

const schemaUserSignup = Joi.object({
  name: Joi.string().min(3).max(30).pattern(patterns.name).optional(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).pattern(patterns.password).required(),
  subscription: Joi.string()
    .valid(Subscription.STARTER, Subscription.PRO, Subscription.BUSINESS)
    .optional(),
});

const schemaUserLogin = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).pattern(patterns.password).required(),
});

const schemaUserSubscriptionPatch = Joi.object({
  subscription: Joi.string()
    .valid(Subscription.STARTER, Subscription.PRO, Subscription.BUSINESS)
    .required(),
});

const schemaRepeatEmailForVerifyUser = Joi.object({
  email: Joi.string().email().required(),
});

const validate = async (schema, obj, res, next) => {
  try {
    await schema.validateAsync(obj);
    next();
  } catch (err) {
    res.status(400).json({
      status: 'error',
      code: 400,
      message: `Error: ${err.message.replace(/"/g, "'")}`,
    });
  }
};

module.exports.validateUserSignup = async (req, res, next) => {
  return await validate(schemaUserSignup, req.body, res, next);
};

module.exports.validateUserLogin = async (req, res, next) => {
  return await validate(schemaUserLogin, req.body, res, next);
};

module.exports.validateUserSubscriptionPatch = async (req, res, next) => {
  return await validate(schemaUserSubscriptionPatch, req.body, res, next);
};

module.exports.validateRepeatEmailForVerifyUser = async (req, res, next) => {
  return await validate(schemaRepeatEmailForVerifyUser, req.body, res, next);
};
