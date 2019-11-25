const express = require('express')
const router = express.Router()
const passport = require('passport')
const Community = require('./model')

// Create Community
router.post('/', passport.authenticate('jwt', {
  session: false
}), (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(401).json()

  let newCommunity = new Community(req.body)

  Community.createCommunity(newCommunity, (err, community) => {
    if (err) {
      return res.status(400).json({
        msg: err
      })
    } else {
      return res.status(201).json(community)
    }
  })
})

// Get Community by id
router.get('/:communityId', passport.authenticate('jwt', {
  session: false
}), (req, res, next) => {
  Community.getCommunityById(req.params.communityId, (err, community) => {
    if (err) {
      return res.status(400).json({
        msg: err.toString()
      })
    }

    if (!community) {
      return res.status(404).json({
        msg: 'Community not found'
      })
    }

    return res.status(200).json(community)
  })
})

// List Communities
router.get('/', passport.authenticate('jwt', {
  session: false
}), (req, res, next) => {
  Community.listCommunities(req.query, (err, communities) => {
    if (err) {
      return res.status(400).json({
        msg: err.toString()
      })
    }

    if (!communities) {
      return res.status(404).json({
        msg: 'Community not found'
      })
    }
    return res.status(200).json(communities)
  })
})

// Update Community
router.put('/:communityId', passport.authenticate('jwt', {
  session: false
}), (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(401).json()

  Community.updateCommunity(req.params.communityId, req.body, (err, updatedCommunity) => {
    if (err) {
      return res.status(400).json({
        msg: err.toString()
      })
    }

    if (!updatedCommunity) {
      return res.status(400).json({
        msg: 'Community not updated!'
      })
    }
    return res.status(200).json(updatedCommunity)
  })
})

// Delete Community
router.delete('/:communityId', passport.authenticate('jwt', {
  session: false
}), (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(401).json()

  Community.updateCommunity(req.params.communityId, {
    deleted_at: new Date()
  }, (err, deletedCommunity) => {
    if (err) {
      return res.status(400).json({
        msg: err.toString()
      })
    }

    if (!deletedCommunity) {
      return res.status(400).json({
        msg: 'Community not deleted!'
      })
    }
    return res.status(204).json()
  })
})

module.exports = router