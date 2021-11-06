const User = require('../model/user');

const findById = async userId => {
  return await User.findById(userId);
};

const findByEmail = async email => {
  return await User.findOne({ email });
};

const findByVerifyToken = async verifyToken => {
  return await User.findOne({ verifyToken });
};

const create = async credentials => {
  const user = new User(credentials);
  return await user.save();
};

const updateToken = async (userId, token) => {
  return await User.updateOne({ _id: userId }, { token });
};

const updateSubscription = async (userId, body) => {
  return await User.findOneAndUpdate(
    { _id: userId },
    { ...body },
    { new: true },
  );
};

const updateAvatar = async (userId, avatar) => {
  return await User.updateOne({ _id: userId }, { avatar });
};

const updateVerifyToken = async (userId, verify, verifyToken) => {
  return await User.findOneAndUpdate(
    { _id: userId },
    { verify, verifyToken },
    { new: true },
  );
};

module.exports = {
  findById,
  findByEmail,
  create,
  updateToken,
  updateSubscription,
  updateAvatar,
  findByVerifyToken,
  updateVerifyToken,
};
