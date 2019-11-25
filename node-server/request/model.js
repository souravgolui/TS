const mongoose = require('mongoose')

// Request Schema
const RequestSchema = mongoose.Schema({
  type: {
    type: String,
    required: true
  },
  from_user_id: {
    type: String,
    required: true
  },
  to_user_id: {
    type: String,
    required: true
  },
  status: {
    type: String,
    default: 'waiting'
  },
  post_id: {
    type: String
  },
  comment_id: {
    type: String
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

const Request = module.exports = mongoose.model('Request', RequestSchema)

// Get Request by id
module.exports.getRequestById = function (id, callback) {
  Request.findById(id, callback)
}

// List Requests
module.exports.listRequests = function (filter, callback) {
  var perPage = 25
  if (filter.per_page) {
    perPage = parseInt(filter.per_page, 10)
  }
  var pageNumber = 0
  if (filter.page_number) {
    pageNumber = parseInt(filter.page_number, 10)
  }

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

  if (filter.from_user_id) {
    query['from_user_id'] = filter.from_user_id
  }

  if (filter.to_user_id) {
    query['to_user_id'] = filter.to_user_id
  }

  if (filter.type) {
    query['type'] = filter.type
  }

  if (filter.status) {
    query['status'] = filter.status
  }

  if (filter.start_created_at || filter.end_created_at) {
    var createdAtQuery = {}
    if (filter.start_created_at) {
      createdAtQuery['$gt'] = filter.start_created_at
    }
    if (filter.end_created_at) {
      createdAtQuery['$lt'] = filter.end_created_at
    }
    query['created_at'] = createdAtQuery
  }

  if (filter.start_updated_at || filter.end_updated_at) {
    var updatedAtQuery = {}
    if (filter.start_updated_at) {
      updatedAtQuery['$gt'] = filter.start_updated_at
    }
    if (filter.end_updated_at) {
      updatedAtQuery['$lt'] = filter.end_updated_at
    }
    query['updated_at'] = updatedAtQuery
  }

  Request.find(query, callback).skip(pageNumber > 0 ? ((pageNumber - 1) * perPage) : 0).limit(perPage).sort(sort)
}

// Update Request
module.exports.updateRequest = function (id, userIdForCheck, updateRequest, callback) {
  Request.findById(id, function (err, request) {
    if (err) callback(new Error(err))
    if (userIdForCheck.toString() !== request.from_user_id) callback(new Error('you can only update your own request'))

    updateRequest.updated_at = new Date()
    request.set(updateRequest)
    request.save(callback)
  })
}

// Create Request
module.exports.createRequest = function (newRequest, callback) {
  var query = {
    'type': newRequest.type,
    'from_user_id': newRequest.from_user_id,
    'to_user_id': newRequest.from_user_id,
    'status': 'awaiting'
  }

  if (newRequest.type === 'report_post') {
    query.post_id = newRequest.post_id
  } else if (newRequest.type === 'report_comment') {
    query.comment_id = newRequest.comment_id
  }

  Request.find(query, function (err, requests) {
    if (err) callback(new Error(err))

    if (requests.length > 0) {
      return callback(null, requests[0])
    }

    newRequest.save(callback)
  })
}