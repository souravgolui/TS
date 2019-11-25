const express = require('express')
const router = express.Router()
const passport = require('passport')
const detector = require('../kitbag/detector')
const Request = require('./model')
const User = require('../user/model')
const Post = require('../post/model')
const Comment = require('../comment/model')

// Create Request
router.post('/', passport.authenticate('jwt', {
  session: false
}), (req, res, next) => {
  let newRequest = new Request(req.body)
  newRequest.from_user_id = detector.getId(req.headers.who, req.user)

  Request.createRequest(newRequest, (err, request) => {
    if (err) {
      return res.status(400).json({
        msg: err
      })
    } else {
      return res.status(201).json(request)
    }
  })
})

// Get Request by id
router.get('/:requestId', passport.authenticate('jwt', {
  session: false
}), (req, res, next) => {
  Request.getRequestById(req.params.requestId, (err, request) => {
    if (err) {
      return res.status(400).json({
        msg: err.toString()
      })
    }

    if (!request) {
      return res.status(404).json({
        msg: 'Request not found'
      })
    }

    return res.status(200).json(request)
  })
})

// List Requests
router.get('/', passport.authenticate('jwt', {
  session: false
}), (req, res, next) => {
  Request.listRequests(req.query, (err, requests) => {
    if (err) {
      return res.status(400).json({
        msg: err.toString()
      })
    }

    if (!requests) {
      return res.status(404).json({
        msg: 'Request not found'
      })
    }
    return res.status(200).json(requests)
  })
})

// Update Request
router.put('/:requestId', passport.authenticate('jwt', {
  session: false
}), (req, res, next) => {
  Request.updateRequest(req.params.requestId, detector.getId(req.headers.who, req.user), req.body, (err, updatedRequest) => {
    if (err) {
      return res.status(400).json({
        msg: err.toString()
      })
    }

    if (!updatedRequest) {
      return res.status(400).json({
        msg: 'Request not updated!'
      })
    }
    return res.status(200).json(updatedRequest)
  })
})

// Approve Request
router.get('/:requestId/approve', passport.authenticate('jwt', {
  session: false
}), (req, res, next) => {
  Request.getRequestById(req.params.requestId, (err, request) => {
    if (err) {
      return res.status(400).json({
        msg: err.toString()
      })
    }

    if (request.to_user_id !== detector.getId(req.headers.who, req.user) && req.user.role !== 'admin') {
      return res.status(401).json({
        msg: 'you can only update your own request'
      })
    }

    if (!request) {
      return res.status(404).json({
        msg: 'Request not found'
      })
    }

    if (request.type === 'follow') {
      User.followUser(request.from_user_id, detector.getId(req.headers.who, req.user), (err, updatedUser) => {
        if (err) {
          return res.status(400).json({
            msg: err.toString()
          })
        }

        if (!updatedUser) {
          return res.status(400).json({
            msg: 'Friend Not Added'
          })
        }

        Request.updateRequest(req.params.requestId, request.from_user_id, {
          'status': 'approved'
        }, (err, updatedRequest) => {
          if (err) {
            return res.status(400).json({
              msg: err.toString()
            })
          }

          if (!updatedRequest) {
            return res.status(400).json({
              msg: 'Request not updated!'
            })
          }
        })

        return res.status(200).json(updatedUser)
      })
    } else if (request.type === 'therapist') {
      User.addTherapist(detector.getId(req.headers.who, req.user), request.to_user_id.toString(), (err, updatedUser) => {
        if (err) {
          return res.status(400).json({
            msg: err.toString()
          })
        }

        if (!updatedUser) {
          return res.status(400).json({
            msg: 'Therapist Not Added'
          })
        }

        Request.updateRequest(req.params.requestId, request.from_user_id, {
          'status': 'approved'
        }, (err, updatedRequest) => {
          if (err) {
            return res.status(400).json({
              msg: err.toString()
            })
          }

          if (!updatedRequest) {
            return res.status(400).json({
              msg: 'Request not updated!'
            })
          }
        })

        return res.status(200).json(updatedUser)
      })
    } else if (request.type === 'report_post') {
      if (req.user.role !== 'admin') {
        return res.status(401).json()
      }

      Post.updatePost(req.params.postId, request.to_user_id.toString(), {
        deleted_at: new Date()
      }, (err, deletedPost) => {
        if (err) {
          return res.status(400).json({
            msg: err.toString()
          })
        }

        if (!deletedPost) {
          return res.status(400).json({
            msg: 'Post not deleted!'
          })
        }

        Request.updateRequest(req.params.requestId, request.from_user_id, {
          'status': 'approved'
        }, (err, updatedRequest) => {
          if (err) {
            return res.status(400).json({
              msg: err.toString()
            })
          }

          if (!updatedRequest) {
            return res.status(400).json({
              msg: 'Request not updated!'
            })
          }

          return res.status(204).json()
        })
      })
    } else if (request.type === 'report_comment') {
      if (req.user.role !== 'admin') {
        return res.status(401).json()
      }

      Comment.updateComment(req.params.commentId, request.to_user_id.toString(), {
        deleted_at: new Date()
      }, (err, deletedComment) => {
        if (err) {
          return res.status(400).json({
            msg: err.toString()
          })
        }

        if (!deletedComment) {
          return res.status(400).json({
            msg: 'Comment not deleted!'
          })
        }

        Request.updateRequest(req.params.requestId, request.from_user_id, {
          'status': 'approved'
        }, (err, updatedRequest) => {
          if (err) {
            return res.status(400).json({
              msg: err.toString()
            })
          }

          if (!updatedRequest) {
            return res.status(400).json({
              msg: 'Request not updated!'
            })
          }

          return res.status(204).json()
        })
      })
    } else if (request.type === 'report_user') {
      if (req.user.role !== 'admin') {
        return res.status(401).json()
      }

      Comment.updateUser(req.params.commentId, request.to_user_id.toString(), {
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

        Request.updateRequest(req.params.requestId, request.from_user_id, {
          'status': 'approved'
        }, (err, updatedRequest) => {
          if (err) {
            return res.status(400).json({
              msg: err.toString()
            })
          }

          if (!updatedRequest) {
            return res.status(400).json({
              msg: 'Request not updated!'
            })
          }

          return res.status(204).json()
        })
      })
    }

    return res.status(400)
  })
})

// Delete Request
router.delete('/:requestId', passport.authenticate('jwt', {
  session: false
}), (req, res, next) => {
  Request.updateRequest(req.params.requestId, detector.getId(req.headers.who, req.user), {
    'status': 'disapproved',
    deleted_at: new Date()
  }, (err, deletedRequest) => {
    if (err) {
      return res.status(400).json({
        msg: err.toString()
      })
    }

    if (!deletedRequest) {
      return res.status(400).json({
        msg: 'Request not deleted!'
      })
    }
    return res.status(204).json()
  })
})

module.exports = router