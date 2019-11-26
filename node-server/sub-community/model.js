const mongoose = require('mongoose')
const util = require('util')

// Category Schema
const subCommunitySchema = mongoose.Schema({
    name: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ''
    },
    community_id: {
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

const SubCommunity = module.exports = mongoose.model('SubCommunity', subCommunitySchema)


module.exports.listSubCommunities = function (filter, callback) {
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

  if (filter.name) {
    query['name'] = {
      '$regex': util.format('.*%s.*', filter.name),
      '$options': 'i'
    }
  }

  if (filter.color) {
    query['color'] = {
      '$regex': util.format('.*%s.*', filter.color),
      '$options': 'i'
    }
  }

  if (filter.community_id) {
    query['community_id'] = filter.community_id
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

  SubCommunity.find(query, callback)
    .skip(pageNumber > 0 ? ((pageNumber - 1) * perPage) : 0)
    .limit(perPage).sort(sort)
}


module.exports.createSubCommunity = function (newSubCommunity, callback) {
    newSubCommunity.save(callback)
}