const express = require('express')
const router = express.Router()
const passport = require('passport')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const sendMail = require('../kitbag/mailer')
const config = require('../config')
const detector = require('../kitbag/detector')
const pusher = require('../kitbag/pusher')
const upload = require('../kitbag/filer').upload
const deleteStorageItem = require('../kitbag/filer').deleteItem
const User = require('./model')
const Request = require('../request/model')

const singleUpload = upload.single('file_item')

// Create User
router.post('/', (req, res, next) => {
  let newUser = new User(req.body)

  User.createUser(newUser, (err, user) => {
    if (err) {
      return res.status(400).json({
        msg: err.toString()
      })
    }

    return res.status(201).json(user)
  })
})

// Clone User
router.post('/:userId/clone', passport.authenticate('jwt', {
  session: false
}), (req, res, next) => {
  User.getUserById(req.params.userId, (err, user) => {
    if (err) {
      return res.status(400).json({
        msg: err.toString()
      })
    }

    if (!user) {
      return res.status(404).json({
        msg: 'User not found'
      })
    }

    let newCloneUser = new User(req.body)
    newCloneUser.connected_profile_id = user._id
    newCloneUser.email = '-'
    newCloneUser.password = '-'

    User.createUser(newCloneUser, (err, cloneUser) => {
      if (err) {
        return res.status(400).json({
          msg: err.toString()
        })
      }

      User.updateUser(req.params.userId, req.user._id, { 'secret_profile_id': cloneUser._id }, (err, updatedUser) => {
        if (err) {
          return res.status(400).json({
            msg: err.toString()
          })
        }
      })

      return res.status(201).json(cloneUser)
    })
  })
})

// Near Users
router.get('/near', passport.authenticate('jwt', {
  session: false
}), (req, res, next) => {
  User.nearUsers(req.query, (err, users) => {
    if (err) {
      return res.status(400).json({
        msg: err.toString()
      })
    }

    if (!users) {
      return res.status(404).json({
        msg: 'User not found'
      })
    }
    return res.status(200).json(users)
  })
})

// Activate User
router.get('/:userId/verify/:email_activation_key', (req, res, next) => {
  User.getUserById(req.params.userId, (err, user) => {
    if (err) {
      return res.status(400).json({
        msg: err.toString()
      })
    }

    if (!user) {
      return res.status(404).json({
        msg: 'User not found'
      })
    }

    if (user.email_activation_key === req.params.email_activation_key) {
      User.updateUser(req.params.userId, req.params.userId, {
        verified: true
      }, (err, updatedUser) => {
        if (err) {
          return res.status(400).json({
            msg: err.toString()
          })
        }

        if (!updatedUser) {
          return res.status(400).json({
            msg: 'User not updated!'
          })
        }
        return res.status(200).json({
          msg: 'Successfuly verified'
        })
      })
    }
  })
})

// Get User
router.get('/:userId', passport.authenticate('jwt', {
  session: false
}), (req, res, next) => {
  User.getUserById(req.params.userId, (err, user) => {
    if (err) {
      return res.status(400).json({
        msg: err.toString()
      })
    }

    if (!user) {
      return res.status(404).json({
        msg: 'User not found'
      })
    }

    if (req.param.userId !== req.user.id) {
      user = user.toObject()
      user.is_follow = user.followers.includes(req.user.id.toString())
      user.is_followed = user.following.includes(user._id.toString())
    }

    return res.status(200).json(user)
  })
})

// List Users
router.get('/', passport.authenticate('jwt', {
  session: false
}), (req, res, next) => {
  User.listUsers(req.query, (err, users) => {
    if (err) {
      return res.status(400).json({
        msg: err.toString()
      })
    }

    if (!users) {
      return res.status(404).json({
        msg: 'User not found'
      })
    }
    return res.status(200).json(users)
  })
})

// Update User
router.put('/:userId', passport.authenticate('jwt', {
  session: false
}), (req, res, next) => {
  User.updateUser(req.params.userId, detector.getId(req.headers.who, req.user), req.body, (err, updatedUser) => {
    if (err) {
      return res.status(400).json({
        msg: err.toString()
      })
    }

    if (!updatedUser) {
      return res.status(400).json({
        msg: 'User not updated!'
      })
    }
    return res.status(200).json(updatedUser)
  })
})

// Follow User
router.post('/:userId/follow', passport.authenticate('jwt', {
  session: false
}), (req, res, next) => {
  if (detector.getId(req.headers.who, req.user) !== req.params.userId) {
    return res.status(401).json({
      msg: 'you can only update your own user'
    })
  }

  User.getUserById(req.body.follow_user_id, (err, willBeFollowingUser) => {
    if (err) {
      return res.status(400).json({
        msg: err.toString()
      })
    }

    if (!willBeFollowingUser) {
      return res.status(404).json({
        msg: 'User not found'
      })
    }

    if (willBeFollowingUser.privacy_profile) {
      Request.createRequest(new Request({
        'type': 'follow',
        'from_user_id': req.user._id,
        'to_user_id': req.body.follow_user_id
      }), (err, request) => {
        if (err) {
          return res.status(400).json({
            msg: err
          })
        }

        if (willBeFollowingUser.fcm_token) {
          pusher.pushNotification(willBeFollowingUser.fcm_token,
            'You have new follow request',
            willBeFollowingUser.first_name + ' ' + willBeFollowingUser.last_name + ' has sent you a request')
        }
        return res.status(201).json(request)
      })
    } else {
      User.followUser(req.params.userId, req.body.follow_user_id, (err, updatedUser) => {
        if (err) {
          return res.status(400).json({
            msg: err.toString()
          })
        }

        if (!updatedUser) {
          return res.status(400).json({
            msg: 'User Not Added'
          })
        }

        if (willBeFollowingUser.fcm_token) {
          pusher.pushNotification(willBeFollowingUser.fcm_token,
            'You have new follower',
            willBeFollowingUser.first_name + ' ' + willBeFollowingUser.last_name + ' is your new follower')
        }
        return res.status(200).json(updatedUser)
      })
    }
  })
})

// Unfollow User
router.delete('/:userId/unfollow', passport.authenticate('jwt', {
  session: false
}), (req, res, next) => {
  if (detector.getId(req.headers.who, req.user) !== req.params.userId) {
    return res.status(401).json({
      msg: 'you can only update your own user'
    })
  }

  User.unfollowUser(req.params.userId, req.body.unfollow_user_id, (err, updatedUser) => {
    if (err) {
      return res.status(400).json({
        msg: err.toString()
      })
    }

    if (!updatedUser) {
      return res.status(400).json({
        msg: 'User Not Removed'
      })
    }
    return res.status(200).json(updatedUser)
  })
})

// Join Community
router.post('/:userId/community', passport.authenticate('jwt', {
  session: false
}), (req, res, next) => {
  if (detector.getId(req.headers.who, req.user) !== req.params.userId) {
    return res.status(401).json({
      msg: 'you can only update your own user'
    })
  }

  User.joinCommunity(req.params.userId, req.body.community_id, (err, updatedUser) => {
    if (err) {
      return res.status(400).json({
        msg: err.toString()
      })
    }

    if (!updatedUser) {
      return res.status(400).json({
        msg: 'Community Not Joined'
      })
    }
    return res.status(200).json(updatedUser)
  })
})

// Remove Community
router.delete('/:userId/community', passport.authenticate('jwt', {
  session: false
}), (req, res, next) => {
  if (detector.getId(req.headers.who, req.user) !== req.params.userId) {
    return res.status(401).json({
      msg: 'you can only update your own user'
    })
  }

  User.leftCommunity(req.params.userId, req.body.community_id, (err, updatedUser) => {
    if (err) {
      return res.status(400).json({
        msg: err.toString()
      })
    }

    if (!updatedUser) {
      return res.status(400).json({
        msg: 'Community Not Lefted'
      })
    }
    return res.status(200).json(updatedUser)
  })
})

// Join Event
router.post('/:userId/event', passport.authenticate('jwt', {
  session: false
}), (req, res, next) => {
  if (detector.getId(req.headers.who, req.user) !== req.params.userId) {
    return res.status(401).json({
      msg: 'you can only update your own user'
    })
  }

  User.joinEvent(req.params.userId, req.body.event_id, (err, updatedUser) => {
    if (err) {
      return res.status(400).json({
        msg: err.toString()
      })
    }

    if (!updatedUser) {
      return res.status(400).json({
        msg: 'Event Not Joined'
      })
    }
    return res.status(200).json(updatedUser)
  })
})

// Remove Event
router.delete('/:userId/event', passport.authenticate('jwt', {
  session: false
}), (req, res, next) => {
  if (detector.getId(req.headers.who, req.user) !== req.params.userId) {
    return res.status(401).json({
      msg: 'you can only update your own user'
    })
  }

  User.leftEvent(req.params.userId, req.body.event_id, (err, updatedUser) => {
    if (err) {
      return res.status(400).json({
        msg: err.toString()
      })
    }

    if (!updatedUser) {
      return res.status(400).json({
        msg: 'Event Not Lefted'
      })
    }
    return res.status(200).json(updatedUser)
  })
})

// Add BlackList
router.post('/:userId/black_list', passport.authenticate('jwt', {
  session: false
}), (req, res, next) => {
  if (detector.getId(req.headers.who, req.user) !== req.params.userId) {
    return res.status(401).json({
      msg: 'you can only update your own user'
    })
  }

  User.addBlackList(req.params.userId, req.body.blacked_user_id, (err, updatedUser) => {
    if (err) {
      return res.status(400).json({
        msg: err.toString()
      })
    }

    if (!updatedUser) {
      return res.status(400).json({
        msg: 'User Not Added BlackList'
      })
    }
    return res.status(200).json(updatedUser)
  })
})

// Remove BlackList
router.delete('/:userId/black_list', passport.authenticate('jwt', {
  session: false
}), (req, res, next) => {
  if (detector.getId(req.headers.who, req.user) !== req.params.userId) {
    return res.status(401).json({
      msg: 'you can only update your own user'
    })
  }

  User.removeBlackList(req.params.userId, req.body.blacked_user_id, (err, updatedUser) => {
    if (err) {
      return res.status(400).json({
        msg: err.toString()
      })
    }

    if (!updatedUser) {
      return res.status(400).json({
        msg: 'User Not Removed BlackList'
      })
    }
    return res.status(200).json(updatedUser)
  })
})

// Add Therapist
router.post('/:userId/therapist', passport.authenticate('jwt', {
  session: false
}), (req, res, next) => {
  if (detector.getId(req.headers.who, req.user) !== req.params.userId) {
    return res.status(401).json({
      msg: 'you can only update your own user'
    })
  }

  User.addTherapist(req.params.userId, req.body.therapist_id, (err, updatedUser) => {
    if (err) {
      return res.status(400).json({
        msg: err.toString()
      })
    }

    if (!updatedUser) {
      return res.status(400).json({
        msg: 'User Not Added BlackList'
      })
    }
    return res.status(200).json(updatedUser)
  })
})

// Remove Therapist
router.delete('/:userId/therapist', passport.authenticate('jwt', {
  session: false
}), (req, res, next) => {
  if (detector.getId(req.headers.who, req.user) !== req.params.userId) {
    return res.status(401).json({
      msg: 'you can only update your own user'
    })
  }

  User.removeTherapist(req.params.userId, req.body.therapist_id, (err, updatedUser) => {
    if (err) {
      return res.status(400).json({
        msg: err.toString()
      })
    }

    if (!updatedUser) {
      return res.status(400).json({
        msg: 'Therapist Not Removed'
      })
    }
    return res.status(200).json(updatedUser)
  })
})

// Delete User
router.delete('/:userId', passport.authenticate('jwt', {
  session: false
}), (req, res, next) => {
  User.updateUser(req.params.userId, detector.getId(req.headers.who, req.user), {
    deleted_at: new Date()
  }, (err, deletedUser) => {
    if (err) {
      return res.status(400).json({
        msg: err.toString()
      })
    }

    if (!deletedUser) {
      return res.status(400).json({
        msg: 'User not deleted!'
      })
    }
    return res.status(204)
  })
})

// Create Forgot Password Request
router.post('/forgot_password/', (req, res, next) => {
  User.getUserByEmail(req.body.email, (err, user) => {
    if (err) {
      return res.status(400).json({
        msg: err.toString()
      })
    }

    if (!user) {
      return res.status(404).json({
        msg: 'User not found'
      })
    }

    let forgotPasswordToken = crypto.randomBytes(20).toString('hex')

    User.updateUser(user.id, user.id,
      { 'forgot_password_token': forgotPasswordToken }, (err, updatedUser) => {
        if (err) {
          return res.status(400).json({ msg: err.toString() })
        }
        let content = '<p>Hi <b>' + user.first_name + ' ' +
          user.last_name + '</b>,</p>' +
          '<p>Please confirm your email address for change password.</p>' +
          '<p>' + config.APPFULLPATH + '/users/forgot_password/' + user.id +
          '/' + forgotPasswordToken + '</p>'

        let mailOptions = {
          to: user.email,
          subject: 'I Forgot Password',
          html: content
        }
        sendMail(mailOptions)
        return res.status(200).json({
          msg: 'Forgot Password token sent via email.'
        })
      })
  })
})

// Change Password Via Forgot Password
router.get('/forgot_password/:user_id/:forgot_password_token', (req, res, next) => {
  User.getUserById(req.params.user_id, (err, user) => {
    if (err) {
      return res.status(400).json({
        msg: err.toString()
      })
    }

    if (!user) {
      return res.status(404).json({
        msg: 'User not found!'
      })
    }

    if (req.params.forgot_password_token && user.forgot_password_token) {
      let newPassword = Math.random().toString(36).substring(7)

      User.changePassword(user, newPassword, (err, updatedUser) => {
        if (err) {
          return res.status(400).json({
            msg: err.toString()
          })
        }

        let content = '<p>Hi <b>' + user.first_name + ' ' +
          user.last_name + '</b>,</p>' +
          '<p>This is your new password. Please Login and change password.</p>' +
          '<p><b>New Password :  </b>' + newPassword + '</p>'

        let mailOptions = {
          to: user.email,
          subject: 'User New Password',
          html: content
        }
        sendMail(mailOptions)
        return res.status(200).json({
          msg: 'Your password sent via email.'
        })
      })
    } else {
      return res.status(404).json({
        msg: 'Wrong token, Please try again!'
      })
    }
  })
})

// Change Password
router.put('/:userId/change_password', passport.authenticate('jwt', {
  session: false
}), (req, res, next) => {
  if (req.body.password !== req.body.repeat_password) {
    return res.status(400).json({
      msg: 'Password aren \'t same!'
    })
  }

  User.changePassword(req.user, req.body.password, (err, user) => {
    if (err) {
      return res.status(400).json({
        msg: err.toString()
      })
    }

    return res.status(200).json(user)
  })
})

// Login
router.post('/login', (req, res, next) => {
  const email = req.body.email
  const password = req.body.password

  User.getUserByEmail(email, (err, user) => {
    if (err) {
      return res.status(400).json({
        msg: err.toString()
      })
    }

    if (!user) {
      return res.status(404).json({
        msg: 'User not found'
      })
    }

    if (!user.verified) {
      return res.status(400).json({
        msg: 'User not verified'
      })
    }

    User.comparePassword(password, user.password, (err, isMatch) => {
      if (err) {
        return res.status(400).json({
          msg: err.toString()
        })
      }

      if (isMatch) {
        const token = jwt.sign({
          user: user
        }, config.SECRET_KEY, {
          expiresIn: 33868800 // 1 week
        })

        return res.status(201).json({
          token: token,
          user: user
        })
      } else {
        return res.status(400).json({
          msg: 'Wrong password'
        })
      }
    })
  })
})

// Add User Profile Photo
router.post('/:userId/profile_image', passport.authenticate('jwt', {
  session: false
}), function (req, res, next) {
  if (detector.getId(req.headers.who, req.user).toString() !== req.params.userId) {
    return res.status(401).json({ msg: 'you can only update your own user' })
  }

  req.file_path = 'users/' + detector.getId(req.headers.who, req.user) + '/profile_image/' + Date.now().toString() + '/'

  User.getUserById(req.params.userId, (err, user) => {
    if (err) {
      return res.status(400).json({ msg: err.toString() })
    }

    singleUpload(req, res, function (err, some) {
      if (err) {
        return res.status(400).json()
      }

      User.updateUser(req.params.userId, detector.getId(req.headers.who, req.user),
        { 'profile_image': req.file.location }, (err, updatedUser) => {
          if (err) {
            return res.status(400).json({ msg: err.toString() })
          }

          deleteStorageItem(user.profile_image, (err, deleted) => {
            if (err) {
              return res.status(400).json({ msg: err.toString() })
            }

            return res.status(200).json(updatedUser)
          })
        })
    })
  })
})

// Add User Profile Cover Image
router.post('/:userId/cover_image', passport.authenticate('jwt', {
  session: false
}), function (req, res, next) {
  if (detector.getId(req.headers.who, req.user).toString() !== req.params.userId) {
    return res.status(401).json({ msg: 'you can only update your own user' })
  }

  req.file_path = 'users/' + detector.getId(req.headers.who, req.user) + '/cover_image/' + Date.now().toString() + '/'

  User.getUserById(req.params.userId, (err, user) => {
    if (err) {
      return res.status(400).json({ msg: err.toString() })
    }

    singleUpload(req, res, function (err, some) {
      if (err) {
        return res.status(400).json()
      }

      User.updateUser(req.params.userId, detector.getId(req.headers.who, req.user),
        { 'cover_image': req.file.location }, (err, updatedUser) => {
          if (err) {
            return res.status(400).json({ msg: err.toString() })
          }

          deleteStorageItem(user.cover_image, (err, deleted) => {
            if (err) {
              return res.status(400).json({ msg: err.toString() })
            }

            return res.status(200).json(updatedUser)
          })
        })
    })
  })
})

module.exports = router
