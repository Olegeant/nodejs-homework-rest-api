const jwt = require('jsonwebtoken');
const path = require('path');
const mkdirp = require('mkdirp');
const crypto = require('crypto');

const Users = require('../repository/users');

const UploadService = require('../services/file-upload');
const EmailService = require('../services/email/service');
const {
  CreateSenderSendGrid,
  // CreateSenderNodemailer,
} = require('../services/email/sender');

const CustomError = require('../helpers/customError');
const { HttpCode, ResponseStatus } = require('../config/constants');

require('dotenv').config();
const SECRET_KEY = process.env.JWT_SECRET_KEY;

const signup = async (req, res) => {
  const { name, email, password, subscription } = req.body;
  const user = await Users.findByEmail(email);

  if (user) {
    throw new CustomError(HttpCode.CONFLICT, 'Email in use');
  }

  const newUser = await Users.create({
    name,
    email,
    password,
    subscription,
    verifyToken: crypto.randomUUID(),
  });

  const emailService = new EmailService(
    process.env.NODE_ENV,
    new CreateSenderSendGrid(),
  );

  const statusEmail = await emailService.sendVerifyEmail(
    newUser.email,
    newUser.name,
    newUser.verifyToken,
  );

  return res.status(HttpCode.CREATED).json({
    status: ResponseStatus.SUCCESS,
    code: HttpCode.CREATED,
    data: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      subscription: newUser.subscription,
      avatar: newUser.avatar,
      successEmail: statusEmail,
    },
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await Users.findByEmail(email);
  const isValidPassword = await user?.isValidPassword(password);

  if (!user || !isValidPassword) {
    throw new CustomError(HttpCode.UNAUTHORIZED, 'Email or password is wrong');
  }

  if (!user?.verify) {
    throw new CustomError(HttpCode.UNAUTHORIZED, 'User email not verified yet');
  }

  const { _id: id, subscription } = user;
  const payload = { id };
  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '1h' });
  await Users.updateToken(id, token);

  return res.status(HttpCode.OK).json({
    status: ResponseStatus.SUCCESS,
    code: HttpCode.OK,
    data: {
      token,
      user: {
        email,
        subscription,
      },
    },
  });
};

const logout = async (req, res) => {
  const id = req.user._id;
  await Users.updateToken(id, null);

  return res.status(HttpCode.NO_CONTENT).json({});
};

const getCurrentUser = async (req, res) => {
  const { name, email, subscription } = req.user;

  return res.status(HttpCode.OK).json({
    status: ResponseStatus.SUCCESS,
    code: HttpCode.OK,
    data: {
      name,
      email,
      subscription,
    },
  });
};

const updateSubscription = async (req, res) => {
  const userId = req.user._id;
  const user = await Users.updateSubscription(userId, req.body);

  if (user) {
    return res.status(HttpCode.OK).json({
      status: ResponseStatus.SUCCESS,
      code: HttpCode.OK,
      data: {
        id: user.userId,
        email: user.email,
        subscription: user.subscription,
      },
    });
  }

  throw new CustomError(HttpCode.NOT_FOUND, 'Not found');
};

const uploadAvatar = async (req, res) => {
  const id = String(req.user._id);
  const file = req.file;

  const USERS_AVATARS = process.env.USERS_AVATARS;
  const destination = path.join(USERS_AVATARS, id);
  await mkdirp(destination);

  const uploadService = new UploadService(destination);
  const avatarUrl = await uploadService.save(file, id);
  await Users.updateAvatar(id, avatarUrl);

  return res.status(HttpCode.OK).json({
    status: ResponseStatus.SUCCESS,
    code: HttpCode.OK,
    data: {
      avatar: avatarUrl,
    },
  });
};

const verifyUser = async (req, res) => {
  const user = await Users.findByVerifyToken(req.params.verificationToken);

  if (!user) {
    throw new CustomError(HttpCode.NOT_FOUND, 'Not found');
  }

  await Users.updateVerifyToken(user._id, true, null);

  return res.status(HttpCode.OK).json({
    status: ResponseStatus.SUCCESS,
    code: HttpCode.OK,
    data: { message: 'Verification successful' },
  });
};

const repeatEmailForVerifyUser = async (req, res) => {
  const { email } = req.body;
  const user = await Users.findByEmail(email);

  if (!user) {
    throw new CustomError(HttpCode.NOT_FOUND, 'Not found');
  }

  if (user?.verify) {
    throw new CustomError(
      HttpCode.BAD_REQUEST,
      'Verification has already been passed',
    );
  }

  const { name, verifyToken } = user;
  const emailService = new EmailService(
    process.env.NODE_ENV,
    new CreateSenderSendGrid(),
    // new CreateSenderNodemailer(),
  );

  const statusEmail = await emailService.sendVerifyEmail(
    email,
    name,
    verifyToken,
  );

  return res.status(HttpCode.OK).json({
    status: ResponseStatus.SUCCESS,
    code: HttpCode.OK,
    data: {
      message: 'Verification email sent',
    },
  });
};

module.exports = {
  signup,
  login,
  logout,
  getCurrentUser,
  updateSubscription,
  uploadAvatar,
  verifyUser,
  repeatEmailForVerifyUser,
};
