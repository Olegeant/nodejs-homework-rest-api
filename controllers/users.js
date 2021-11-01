const jwt = require('jsonwebtoken');
const Users = require('../repository/users');
const { HttpCode } = require('../config/constants');

require('dotenv').config();
const SECRET_KEY = process.env.JWT_SECRET_KEY;

const signup = async (req, res, next) => {
  const { email, password, subscription } = req.body;

  const user = await Users.findByEmail(email);
  if (user) {
    return res.status(HttpCode.CONFLICT).json({
      status: 'error',
      code: HttpCode.CONFLICT,
      message: 'Email in use',
    });
  }

  try {
    const newUser = await Users.create({ email, password, subscription });
    return res.status(HttpCode.CREATED).json({
      status: 'success',
      code: HttpCode.CREATED,
      data: {
        id: newUser.id,
        email: newUser.email,
        subscription: newUser.subscription,
      },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  const user = await Users.findByEmail(email);
  const isValidPassword = await user?.isValidPassword(password);

  if (!user || !isValidPassword) {
    return res.status(HttpCode.UNAUTHORIZED).json({
      status: 'error',
      code: HttpCode.UNAUTHORIZED,
      message: 'Invalid credentials',
    });
  }

  const { _id: id, subscription } = user;
  const payload = { id };
  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '1h' });
  await Users.updateToken(id, token);

  return res.status(HttpCode.OK).json({
    status: 'success',
    code: HttpCode.OK,
    date: {
      token,
      user: {
        email,
        subscription,
      },
    },
  });
};

const logout = async (req, res, next) => {
  res.json();
};

module.exports = { signup, login, logout };
