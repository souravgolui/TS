const mongoose = require('mongoose')
const util = require('util')

// Comment Schema
const CommentSchema = mongoose.Schema({
  user_id: {
    type: String,
    required: true
  },
  post_id: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
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

const Comment = module.exports = mongoose.model('Comment', CommentSchema)

// Get Comment by id
module.exports.getCommentById = function (id, callback) {
  Comment.findById(id, callback)
}

// List Comments
module.exports.listComments = function (filter, callback) {
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
    deleted_at: null
  }

  if (filter.user_id) {
    query['user_id'] = filter.user_id
  }

  if (filter.post_id) {
    query['post_id'] = filter.post_id
  }

  if (filter.text) {
    query['text'] = {
      '$regex': util.format('.*%s.*', filter.text),
      '$options': 'i'
    }
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

  Comment.find(query, callback).skip(pageNumber > 0 ? ((pageNumber - 1) * perPage) : 0).limit(perPage).sort(sort)
}

// Count Comments
module.exports.countComments = function (filter, callback) {
  var query = {
    deleted_at: null
  }

  if (filter.user_id) {
    query['user_id'] = filter.user_id
  }

  if (filter.post_id) {
    query['post_id'] = filter.post_id
  }

  if (filter.text) {
    query['text'] = {
      '$regex': util.format('.*%s.*', filter.text),
      '$options': 'i'
    }
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

  Comment.count(query, callback)
}

// Update Comment
module.exports.updateComment = function (id, userIdForCheck, updateComment, callback) {
  Comment.findById(id, function (err, comment) {
    if (err) callback(new Error(err))
    if (userIdForCheck.toString() !== comment.user_id) callback(new Error('you can only update your own comment'))

    updateComment.updated_at = new Date()
    comment.set(updateComment)
    comment.save(callback)
  })
}

// Create Comment
module.exports.createComment = function (newComment, callback) {
  newComment.save(callback)
}
