const express = require('express')
const router = express.Router()
const passport = require('passport')
const detector = require('../kitbag/detector')
const pusher = require('../kitbag/pusher')
const User = require('../user/model')
const Post = require('../post/model')
const Comment = require('./model')

// Create Comment
router.post('/', passport.authenticate('jwt', {
  session: false
}), (req, res, next) => {
  let newComment = new Comment(req.body)
  newComment.user_id = detector.getId(req.headers.who, req.user)

  Comment.createComment(newComment, (err, comment) => {
    if (err) {
      return res.status(400).json({
        msg: err
      })
    }

    Post.getPostById(comment.post_id, (err, post) => {
      if (err) {
        return res.status(400).json({
          msg: err.toString()
        })
      }
      User.getUserById(post.user_id, (err, postUser) => {
        if (err) {
          return res.status(400).json({
            msg: err
          })
        } else if (postUser.fcm_token) {
          User.getUserById(comment.user_id, (err, commentUser) => {
            if (err) {
              return res.status(400).json({
                msg: err
              })
            }
            pusher.pushNotification(postUser.fcm_token,
              'You have a new comment for your post!',
              commentUser.first_name + ' ' + commentUser.last_name +
              ' sent comment your post.')
          })
        }
      })
    })
    return res.status(201).json(comment)
  })
})

// Get Comment by id
router.get('/:commentId', passport.authenticate('jwt', {
  session: false
}), (req, res, next) => {
  Comment.getCommentById(req.params.commentId, (err, comment) => {
    if (err) {
      return res.status(400).json({
        msg: err.toString()
      })
    }

    if (!comment) {
      return res.status(404).json({
        msg: 'Comment not found'
      })
    }

    return res.status(200).json(comment)
  })
})

// List Comments
router.get('/', passport.authenticate('jwt', {
  session: false
}), (req, res, next) => {
  Comment.listComments(req.query, (err, comments) => {
    if (err) {
      return res.status(400).json({
        msg: err.toString()
      })
    }

    if (!comments) {
      return res.status(404).json({
        msg: 'Comment not found'
      })
    }

    Comment.countComments(req.query, (err, count) => {
      if (err) {
        return res.status(400).json({
          msg: err.toString()
        })
      }
      res.setHeader('count', count)
      return res.status(200).json(comments)
    })
  })
})

// Update Comment
router.put('/:commentId', passport.authenticate('jwt', {
  session: false
}), (req, res, next) => {
  Comment.updateComment(req.params.commentId, detector.getId(req.headers.who, req.user), req.body, (err, updatedComment) => {
    if (err) {
      return res.status(400).json({
        msg: err.toString()
      })
    }

    if (!updatedComment) {
      return res.status(400).json({
        msg: 'Comment not updated!'
      })
    }
    return res.status(200).json(updatedComment)
  })
})

// Delete Comment
router.delete('/:commentId', passport.authenticate('jwt', {
  session: false
}), (req, res, next) => {
  Comment.updateComment(req.params.commentId, detector.getId(req.headers.who, req.user), {
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
    return res.status(204)
  })
})

module.exports = router