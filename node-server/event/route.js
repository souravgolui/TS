const express = require('express')
const router = express.Router()
const passport = require('passport')
const upload = require('../kitbag/filer').upload
const deleteStorageItem = require('../kitbag/filer').deleteItem
const Event = require('./model')

const singleUpload = upload.single('file_item')

// Create Event
router.post('/', passport.authenticate('jwt', {
  session: false
}), (req, res, next) => {
  let newEvent = new Event(req.body)

  Event.createEvent(newEvent, (err, event) => {
    if (err) {
      return res.status(400).json({
        msg: err
      })
    } else {
      return res.status(201).json(event)
    }
  })
})

// Get Event by id
router.get('/:eventId', passport.authenticate('jwt', {
  session: false
}), (req, res, next) => {
  Event.getEventById(req.params.eventId, (err, event) => {
    if (err) {
      return res.status(400).json({
        msg: err.toString()
      })
    }

    if (!event) {
      return res.status(404).json({
        msg: 'Event not found'
      })
    }

    return res.status(200).json(event)
  })
})

// List Events
router.get('/', passport.authenticate('jwt', {
  session: false
}), (req, res, next) => {
  Event.listEvents(req.query, (err, events) => {
    if (err) {
      return res.status(400).json({
        msg: err.toString()
      })
    }

    if (!events) {
      return res.status(404).json({
        msg: 'Event not found'
      })
    }
    return res.status(200).json(events)
  })
})

// Update Event
router.put('/:eventId', passport.authenticate('jwt', {
  session: false
}), (req, res, next) => {
  Event.updateEvent(req.params.eventId, req.body, (err, updatedEvent) => {
    if (err) {
      return res.status(400).json({
        msg: err.toString()
      })
    }

    if (!updatedEvent) {
      return res.status(400).json({
        msg: 'Event not updated!'
      })
    }
    return res.status(200).json(updatedEvent)
  })
})

// Delete Event
router.delete('/:eventId', passport.authenticate('jwt', {
  session: false
}), (req, res, next) => {
  Event.updateEvent(req.params.eventId, {
    deleted_at: new Date()
  }, (err, deletedEvent) => {
    if (err) {
      return res.status(400).json({
        msg: err.toString()
      })
    }

    if (!deletedEvent) {
      return res.status(400).json({
        msg: 'Event not deleted!'
      })
    }
    return res.status(204).json()
  })
})

// Add Event Cover Image
router.post('/:eventId/cover_image', passport.authenticate('jwt', {
  session: false }), function (req, res, next) {
  req.file_path = 'events/' + req.params.eventId + '/cover_image/' + Date.now().toString() + '/'

  Event.getEventById(req.params.eventId, (err, event) => {
    if (err) {
      return res.status(400).json({ msg: err.toString() })
    }

    singleUpload(req, res, function (err, some) {
      if (err) {
        return res.status(400).json()
      }

      Event.updateEvent(req.params.eventId,
        { 'cover_image': req.file.location }, (err, updatedEvent) => {
          if (err) {
            return res.status(400).json({ msg: err.toString() })
          }

          deleteStorageItem(event.cover_image, (err, deleted) => {
            if (err) {
              return res.status(400).json({ msg: err.toString() })
            }

            return res.status(200).json(updatedEvent)
          })
        })
    })
  })
})

module.exports = router
