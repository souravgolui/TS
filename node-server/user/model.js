const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const util = require('util')
const sendMail = require('../kitbag/mailer')
const config = require('../config')

// User Schema
const UserSchema = mongoose.Schema({
  first_name: {
    type: String,
    required: true
  },
  last_name: {
    type: String,
    required: true
  },
  username: {
    type: String,
    unique: true,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String
  },
  secret_profile_id: {
    type: String
  },
  connected_profile_id: {
    type: String
  },
  profile_image: {
    type: String
  },
  cover_image: {
    type: String
  },
  verified: {
    type: Boolean,
    default: false
  },
  birthday: {
    type: Date
  },
  followers: {
    type: [String]
  },
  following: {
    type: [String]
  },
  communities: {
    type: [String]
  },
  events: {
    type: [String]
  },
  therapists: {
    type: [String]
  },
  email_activation_key: {
    type: String
  },
  forgot_password_token: {
    type: String
  },
  privacy_profile: {
    type: Boolean,
    default: false
  },
  fcm_token: {
    type: String
  },
  black_list: {
    type: [String],
    default: []
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  },
  deleted_at: {
    type: Date
  }
})

const User = module.exports = mongoose.model('User', UserSchema)
UserSchema.index({ location: '2dsphere' })

module.exports.getUserById = function (id, callback) {
  User.findById(id, callback)
}

module.exports.getUserByUsername = function (username, callback) {
  const query = {
    username: username
  }
  User.findOne(query, callback)
}

module.exports.getUserByEmail = function (email, callback) {
  const query = {
    email: email
  }
  User.findOne(query, callback)
}

module.exports.listUsers = function (filter, callback) {
  var perPage = 25
  if (filter.per_page) { perPage = parseInt(filter.per_page, 10) }
  var pageNumber = 0
  if (filter.page_number) { pageNumber = parseInt(filter.page_number, 10) }

  var sort = {}
  if (filter.sort_field) {
    if (filter.sort_type) {
      sort[filter.sort_field] = parseInt(filter.sort_type, 10)
    } else {
      sort[filter.sort_field] = -1
    }
  } else {
    sort['created_at'] = -1
  }

  var query = {
    deleted_at: null,
    connected_profile_id: {'$exists': false}
  }

  if (filter.nin) {
    query['_id'] = { '$nin': filter.nin }
  }

  if (filter.first_name) {
    query['first_name'] = {
      '$regex': util.format('.*%s.*', filter.first_name),
      '$options': 'i'
    }
  }

  if (filter.last_name) {
    query['last_name'] = {
      '$regex': util.format('.*%s.*', filter.last_name),
      '$options': 'i'
    }
  }

  if (filter.username) {
    query['username'] = {
      '$regex': util.format('.*%s.*', filter.username),
      '$options': 'i'
    }
  }

  if (filter.email) {
    query['email'] = {
      '$regex': util.format('.*%s.*', filter.email),
      '$options': 'i'
    }
  }

  if (filter.role) {
    query['role'] = filter.role
  }

  if (filter.secret_profile_id) {
    query['secret_profile_id'] = filter.secret_profile_id
  }

  if (filter.connected_profile_id) {
    query['connected_profile_id'] = filter.connected_profile_id
  }

  if (filter.verified === 'true') {
    query['verified'] = true
  } else if (filter.verified === 'false') {
    query['verified'] = false
  }

  if (filter.privacy_profile === 'true') {
    query['privacy_profile'] = true
  } else if (filter.privacy_profile === 'false') {
    query['privacy_profile'] = false
  }

  if (filter.followers) {
    query['followers'] = { '$in': JSON.parse(filter.followers) }
  }

  if (filter.following) {
    query['following'] = { '$in': JSON.parse(filter.following) }
  }

  if (filter.communities) {
    query['communities'] = { '$in': JSON.parse(filter.communities) }
  }

  if (filter.events) {
    query['events'] = { '$in': JSON.parse(filter.events) }
  }

  if (filter.therapists) {
    query['therapists'] = { '$in': JSON.parse(filter.therapists) }
  }

  if (filter.start_birthday_at || filter.end_birthday_at) {
    var birthdayQuery = {}
    if (filter.start_birthday_at) { birthdayQuery['$gt'] = filter.start_birthday_at }
    if (filter.end_birthday_at) { birthdayQuery['$lt'] = filter.end_birthday_at }
    query['birthday'] = birthdayQuery
  }

  if (filter.start_created_at || filter.end_created_at) {
    var createdAtQuery = {}
    if (filter.start_created_at) { createdAtQuery['$gt'] = filter.start_created_at }
    if (filter.end_created_at) { createdAtQuery['$lt'] = filter.end_created_at }
    query['created_at'] = createdAtQuery
  }

  if (filter.start_updated_at || filter.end_updated_at) {
    var updatedAtQuery = {}
    if (filter.start_updated_at) { updatedAtQuery['$gt'] = filter.start_updated_at }
    if (filter.end_updated_at) { updatedAtQuery['$lt'] = filter.end_updated_at }
    query['updated_at'] = updatedAtQuery
  }

  User.find(query, callback).skip(pageNumber > 0 ? ((pageNumber - 1) * perPage) : 0).limit(perPage).sort(sort)
}

module.exports.nearUsers = function (filter, callback) {
  var query = {
    deleted_at: null
  }

  if (filter.nin) {
    query['_id'] = { '$nin': filter.nin }
  }

  if (filter.first_name) {
    query['first_name'] = {
      '$regex': util.format('.*%s.*', filter.first_name),
      '$options': 'i'
    }
  }

  if (filter.last_name) {
    query['last_name'] = {
      '$regex': util.format('.*%s.*', filter.last_name),
      '$options': 'i'
    }
  }

  if (filter.email) {
    query['email'] = {
      '$regex': util.format('.*%s.*', filter.email),
      '$options': 'i'
    }
  }

  if (filter.username) {
    query['username'] = {
      '$regex': util.format('.*%s.*', filter.username),
      '$options': 'i'
    }
  }

  if (filter.role) {
    query['role'] = filter.role
  }

  if (filter.secret_profile_id) {
    query['secret_profile_id'] = filter.secret_profile_id
  }

  if (filter.connected_profile_id) {
    query['connected_profile_id'] = filter.connected_profile_id
  }

  if (filter.verified === 'true') {
    query['verified'] = true
  } else if (filter.verified === 'false') {
    query['verified'] = false
  }

  if (filter.privacy_profile === 'true') {
    query['privacy_profile'] = true
  } else if (filter.privacy_profile === 'false') {
    query['privacy_profile'] = false
  }

  if (filter.followers) {
    query['followers'] = { '$in': JSON.parse(filter.followers) }
  }

  if (filter.following) {
    query['following'] = { '$in': JSON.parse(filter.following) }
  }

  if (filter.communities) {
    query['communities'] = { '$in': JSON.parse(filter.communities) }
  }

  if (filter.therapists) {
    query['therapists'] = { '$in': JSON.parse(filter.therapists) }
  }

  if (filter.start_birthday_at || filter.end_birthday_at) {
    var birthdayQuery = {}
    if (filter.start_birthday_at) { birthdayQuery['$gt'] = filter.start_birthday_at }
    if (filter.end_birthday_at) { birthdayQuery['$lt'] = filter.end_birthday_at }
    query['birthday'] = birthdayQuery
  }

  if (filter.start_created_at || filter.end_created_at) {
    var createdAtQuery = {}
    if (filter.start_created_at) { createdAtQuery['$gt'] = filter.start_created_at }
    if (filter.end_created_at) { createdAtQuery['$lt'] = filter.end_created_at }
    query['created_at'] = createdAtQuery
  }

  if (filter.start_updated_at || filter.end_updated_at) {
    var updatedAtQuery = {}
    if (filter.start_updated_at) { updatedAtQuery['$gt'] = filter.start_updated_at }
    if (filter.end_updated_at) { updatedAtQuery['$lt'] = filter.end_updated_at }
    query['updated_at'] = updatedAtQuery
  }

  User.aggregate([{
    $geoNear: {
      near: { type: 'Point', coordinates: JSON.parse(filter.location) },
      limit: parseInt(filter.limit, 10),
      maxDistance: parseInt(filter.max_distance, 10), // meters
      query: query,
      uniqueDocs: true,
      distanceField: 'dist.calculated',
      includeLocs: 'dist.location',
      spherical: true
    }
  }]).exec((err, users) => {
    if (err) { callback(new Error(err)) }
    return callback(null, users)
  })
}

// Create User
module.exports.createUser = function (newUser, callback) {
  if (newUser.connected_profile_id) {
    newUser.save(function (err) {
      if (err) return callback(new Error(err))
      return callback(null, newUser)
    })
  } else {
    bcrypt.genSalt(10, (err, salt) => {
      if (err) { return callback(new Error(err)) }
      bcrypt.hash(newUser.password, salt, (err, hash) => {
        if (err) { return callback(new Error(err)) }
        newUser.password = hash
        newUser.email_activation_key = crypto.randomBytes(20).toString('hex')
        newUser.save(function (err) {
          if (err) return callback(new Error(err))

          var content = '<p>Hi <b>' + newUser.first_name + ' ' +
          newUser.last_name + '</b>,</p>' +
          '<p>Please confirm your email address for new account.</p>' +
          '<p>' + config.APPFULLPATH + '/users/' + newUser._id.toString() +
          '/verify/' + newUser.email_activation_key + '</p>'

          var mailOptions = {
            to: newUser.email,
            subject: 'User Registeration',
            html: content
          }
          sendMail(mailOptions)

          return callback(null, newUser)
        })
      })
    })
  }
}

// Update User
module.exports.updateUser = function (id, userIdForCheck, updateUser, callback) {
  User.findById(id, function (err, user) {
    if (err) callback(new Error(err))
    if (userIdForCheck.toString() !== user._id.toString()) return callback(new Error('you can only update your own user'))
    updateUser.updated_at = new Date()
    user.set(updateUser)
    user.save(callback)
  })
}

// Follow User
module.exports.followUser = function (id, userId, callback) {
  var query = { '_id': id }
  var updateQuery = { '$addToSet': { 'following': userId } }
  User.findOneAndUpdate(query, updateQuery, { 'new': true }, function (err, user) {
    if (err) callback(new Error(err))

    User.findOneAndUpdate({ '_id': userId }, { '$addToSet': { 'followers': id } },
      { 'new': true }, function (err, otherUser) {
        if (err) callback(new Error(err))
      })

    return callback(null, user)
  })
}

// Unfollow User
module.exports.unfollowUser = function (id, userId, callback) {
  var query = { '_id': id }
  var updateQuery = { '$pull': { 'following': userId } }
  User.findOneAndUpdate(query, updateQuery, { 'new': true }, function (err, user) {
    if (err) callback(new Error(err))

    User.findOneAndUpdate({ '_id': userId }, { '$pull': { 'followers': id } },
      { 'new': true }, function (err, otherUser) {
        if (err) callback(new Error(err))
      })

    return callback(null, user)
  })
}

// Join Community
module.exports.joinCommunity = function (id, communityId, callback) {
  var query = { '_id': id }
  var updateQuery = { '$addToSet': { 'communities': communityId } }
  User.findOneAndUpdate(query, updateQuery, { 'new': true }, function (err, user) {
    if (err) callback(new Error(err))
    return callback(null, user)
  })
}

// Left Community
module.exports.leftCommunity = function (id, communityId, callback) {
  var query = { '_id': id }
  var updateQuery = { '$pull': { 'communities': communityId } }
  User.findOneAndUpdate(query, updateQuery, { 'new': true }, function (err, user) {
    if (err) callback(new Error(err))
    return callback(null, user)
  })
}

// Join Event
module.exports.joinEvent = function (id, eventId, callback) {
  var query = { '_id': id }
  var updateQuery = { '$addToSet': { 'events': eventId } }
  User.findOneAndUpdate(query, updateQuery, { 'new': true }, function (err, user) {
    if (err) callback(new Error(err))
    return callback(null, user)
  })
}

// Left Event
module.exports.leftEvent = function (id, eventId, callback) {
  var query = { '_id': id }
  var updateQuery = { '$pull': { 'communities': eventId } }
  User.findOneAndUpdate(query, updateQuery, { 'new': true }, function (err, user) {
    if (err) callback(new Error(err))
    return callback(null, user)
  })
}

// add blacklist
module.exports.addBlackList = function (id, userId, callback) {
  var query = { '_id': id }
  var updateQuery = { '$addToSet': { 'black_list': userId } }
  User.findOneAndUpdate(query, updateQuery, { 'new': true }, function (err, user) {
    if (err) callback(new Error(err))
    return callback(null, user)
  })
}

// remove blacklist
module.exports.removeBlackList = function (id, userId, callback) {
  var query = { '_id': id }
  var updateQuery = { '$pull': { 'black_list': userId } }
  User.findOneAndUpdate(query, updateQuery, { 'new': true }, function (err, user) {
    if (err) callback(new Error(err))
    return callback(null, user)
  })
}

// Add Therapist
module.exports.addTherapist = function (id, therapistId, callback) {
  var query = { '_id': id }
  var updateQuery = { '$addToSet': { 'therapists': therapistId } }
  User.findOneAndUpdate(query, updateQuery, { 'new': true }, function (err, user) {
    if (err) callback(new Error(err))
    return callback(null, user)
  })
}

// Remove Therapist
module.exports.removeTherapist = function (id, therapistId, callback) {
  var query = { '_id': id }
  var updateQuery = { '$pull': { 'therapists': therapistId } }
  User.findOneAndUpdate(query, updateQuery, { 'new': true }, function (err, user) {
    if (err) callback(new Error(err))
    return callback(null, user)
  })
}

// Change User
module.exports.changePassword = function (user, password, callback) {
  bcrypt.genSalt(10, (err, salt) => {
    if (err) { callback(new Error(err)) }
    bcrypt.hash(password, salt, (err, hash) => {
      if (err) { callback(new Error(err)) }
      user.password = hash
      user.forgot_password_token = ''
      user.save(callback)
    })
  })
}

module.exports.comparePassword = function (password, hash, callback) {
  bcrypt.compare(password, hash, (err, isMatch) => {
    if (err) { throw err }

    callback(null, isMatch)
  })
}
