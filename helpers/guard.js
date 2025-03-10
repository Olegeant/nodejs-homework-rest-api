const passport = require('passport');
require('../config/passport');

const { HttpCode } = require('../config/constants');
const CustomError = require('../helpers/customError');

const guard = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    const token = req.get('Authorization')?.split(' ')[1];
    let errorMessage = '';

    if (!user || err || token !== user.token) {
      return res.status(HttpCode.UNAUTHORIZED).json({
        status: 'error',
        code: HttpCode.UNAUTHORIZED,
        message: 'Not authorized',
      });
    }

    if (!user?.verify) {
      errorMessage = 'User email not verified yet';
    }

    req.user = user;
    return next();
  })(req, res, next);
};

module.exports = guard;
