const mongoose = require('mongoose')
const util = require('util')

// Event Schema
const EventSchema = mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  cover_image: {
    type: String
  },
  premise_name: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  community_id: {
    type: String,
    required: true
  },
  organizer_id: {
    type: String
  },
  dating_at: {
    type: Date,
    required: true
  },
  attendance: {
    type: [String],
    default: []
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

const Event = module.exports = mongoose.model('Event', EventSchema)

// Get Event by id
module.exports.getEventById = function (id, callback) {
  Event.findById(id, callback)
}

// Get Event by name
module.exports.getEventByName = function (eventName, callback) {
  const query = {
    name: eventName
  }
  Event.findOne(query, callback)
}

// List Events
module.exports.listEvents = function (filter, callback) {
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

  if (filter.name) {
    query['name'] = {
      '$regex': util.format('.*%s.*', filter.name),
      '$options': 'i'
    }
  }

  if (filter.premise_name) {
    query['name'] = {
      '$regex': util.format('.*%s.*', filter.name),
      '$options': 'i'
    }
  }

  if (filter.community_id) {
    query['community_id'] = filter.community_id
  }

  if (filter.event_id) {
    query['event_id'] = filter.event_id
  }

  if (filter.organizer_id) {
    query['organizer_id'] = filter.organizer_id
  }

  if (filter.attendances) {
    query['attendances'] = { '$in': JSON.parse(filter.attendances) }
  }

  if (filter.noneattendances) {
    query['attendances'] = { '$nin': JSON.parse(filter.noneattendances) }
  }

  if (filter.start_dating_at || filter.end_dating_at) {
    var datingAtQuery = {}
    if (filter.start_dating_at) { datingAtQuery['$gt'] = filter.start_dating_at }
    if (filter.end_dating_at) { datingAtQuery['$lt'] = filter.end_dating_at }
    query['dating_at'] = datingAtQuery
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

  Event.find(query, callback).skip(pageNumber > 0 ? ((pageNumber - 1) * perPage) : 0).limit(perPage).sort(sort)
}

// Update Event
module.exports.updateEvent = function (id, updateEvent, callback) {
  Event.findById(id, function (err, event) {
    if (err) callback(new Error(err))
    updateEvent.updated_at = new Date()
    event.set(updateEvent)
    event.save(callback)
  })
}

// Create Event
module.exports.createEvent = function (newEvent, callback) {
  newEvent.save(callback)
}
