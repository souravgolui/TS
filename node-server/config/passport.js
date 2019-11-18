const JwtStrategy = require('passport-jwt').Strategy
const ExtractJwt = require('passport-jwt').ExtractJwt
const User = require('../user/model')
const config = require('./../config')

module.exports = function (passport) {
  let opts = {}
  opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken()
  opts.secretOrKey = config.SECRET_KEY
  passport.use(new JwtStrategy(opts, (jwtPayload, done) => {
    User.getUserById(jwtPayload.user._id, (err, user) => {
      if (err) {
        return done(err, false)
      }

      if (user) {
        if (user.secret_profile_id) {
          User.getUserById(jwtPayload.user.secret_profile_id, (err, secretUser) => {
            if (err) {
              return done(err, false)
            }

            if (secretUser) {
              user.secret_user = secretUser
              return done(null, user)
            } else {
              return done(null, false)
            }
          })
        } else {
          return done(null, user)
        }
      } else {
        return done(null, false)
      }
    })
  }))
}
