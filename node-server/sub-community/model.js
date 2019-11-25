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
    color: {
      type: String,
      required: true
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
