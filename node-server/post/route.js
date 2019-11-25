const express = require('express')
const router = express.Router()
const passport = require('passport')
const pusher = require('../kitbag/pusher')
const detector = require('../kitbag/detector')
const upload = require('../kitbag/filer').upload
const deleteStorageItem = require('../kitbag/filer').deleteItem
const User = require('../user/model')
const Post = require('./model')

const singleUpload = upload.single('file_item')

// Create Post
router.post('/', passport.authenticate('jwt', {
  session: false
}), (req, res, next) => {
  let newPost = new Post(req.body)
  newPost.user_id = detector.getId(req.headers.who, req.user)

  Post.createPost(newPost, (err, post) => {
    if (err) {
      return res.status(400).json({
        msg: err
      })
    } else {
      return res.status(201).json(post)
    }
  })
})

// Get Post by id
router.get('/:postId', passport.authenticate('jwt', {
  session: false
}), (req, res, next) => {
  Post.getPostById(req.params.postId, (err, post) => {
    if (err) {
      return res.status(400).json({
        msg: err.toString()
      })
    }

    if (!post) {
      return res.status(404).json({
        msg: 'Post not found'
      })
    }

    return res.status(200).json(post)
  })
})

// List Posts
router.get('/', passport.authenticate('jwt', {
  session: false
}), (req, res, next) => {
  if (req.query.feed) {
    req.query.none_community = true
    req.query.users = req.user.following
    if (req.headers.who === 'dark') {
      req.query.users = req.user.secret_user.following
    }
    req.query.users.push(detector.getId(req.headers.who, req.user))
  }

  if (req.query.community_feed) {
    req.query.communities = req.user.communities
    if (req.headers.who === 'dark') {
      req.query.communities = req.user.secret_user.communities
    }
  }

  if (req.query.article_feed) {
    req.query.article_feed = true
  }

  Post.listPosts(req.query, (err, posts) => {
    if (err) {
      return res.status(400).json({
        msg: err.toString()
      })
    }

    if (!posts) {
      return res.status(404).json({
        msg: 'Post not found'
      })
    }
    return res.status(200).json(posts)
  })
})

// Update Post
router.put('/:postId', passport.authenticate('jwt', {
  session: false
}), (req, res, next) => {
  Post.updatePost(req.params.postId, detector.getId(req.headers.who, req.user), req.body, (err, updatedPost) => {
    if (err) {
      return res.status(400).json({
        msg: err.toString()
      })
    }

    if (!updatedPost) {
      return res.status(400).json({
        msg: 'Post not updated!'
      })
    }
    return res.status(200).json(updatedPost)
  })
})

// Like Post
router.post('/:postId/like', passport.authenticate('jwt', {
  session: false
}), (req, res, next) => {
  Post.like(req.params.postId, detector.getId(req.headers.who, req.user), (err, updatedPost) => {
    if (err) {
      return res.status(400).json({
        msg: err.toString()
      })
    }

    if (!updatedPost) {
      return res.status(400).json({
        msg: 'Post not updated!'
      })
    } else {
      User.getUserById(updatedPost.user_id, (err, user) => {
        if (err) {
          return res.status(400).json({
            msg: err
          })
        } else if (user.fcm_token) {
          pusher.pushNotification(user.fcm_token, 'New Like!',
            'You have a new like.')
        }
      })

      return res.status(200).json(updatedPost)
    }
  })
})

// Unlike Post
router.delete('/:postId/like', passport.authenticate('jwt', {
  session: false
}), (req, res, next) => {
  Post.unlike(req.params.postId, detector.getId(req.headers.who, req.user), (err, updatedPost) => {
    if (err) {
      return res.status(400).json({
        msg: err.toString()
      })
    }

    if (!updatedPost) {
      return res.status(400).json({
        msg: 'Post not updated!'
      })
    }
    return res.status(200).json(updatedPost)
  })
})

// Delete Post
router.delete('/:postId', passport.authenticate('jwt', {
  session: false
}), (req, res, next) => {
  Post.updatePost(req.params.postId, detector.getId(req.headers.who, req.user), {
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
    return res.status(204)
  })
})

// Add Post Image
router.post('/:postId/image', passport.authenticate('jwt', {
  session: false
}), function (req, res, next) {
  req.file_path = 'posts/images/' + detector.getId(req.headers.who, req.user) + '/' + Date.now().toString() + '/'

  Post.getPostById(req.params.postId, (err, post) => {
    if (err) {
      return res.status(400).json({
        msg: err.toString()
      })
    }

    if (!post) {
      return res.status(404).json({
        msg: 'Post not found'
      })
    }

    singleUpload(req, res, function (err, some) {
      if (err) return res.status(400).json()
      Post.addImage(req.params.postId, req.file.location, (err, updatedPost) => {
        if (err) {
          return res.status(400).json({
            msg: err.toString()
          })
        }

        return res.status(200).json(updatedPost)
      })
    })
  })
})

// Delete Post Image
router.delete('/:postId/image', passport.authenticate('jwt', {
  session: false
}), (req, res, next) => {
  Post.getPostById(req.params.postId, (err, post) => {
    if (err) {
      return res.status(400).json({
        msg: err.toString()
      })
    }

    if (!post) {
      return res.status(404).json({
        msg: 'Post not found'
      })
    }

    Post.removeImage(req.params.postId, req.body.file_item, (err, deletedPostImage) => {
      if (err) {
        return res.status(400).json({
          msg: err.toString()
        })
      }

      if (!deletedPostImage) {
        return res.status(400).json({
          msg: 'Post Image not deleted!'
        })
      }

      deleteStorageItem(req.body.file_item, (err, deleted) => {
        if (err) return res.status(400).json({
          msg: err.toString()
        })
        return res.status(204).json()
      })
    })
  })
})

// Add Post Video
router.post('/:postId/video', passport.authenticate('jwt', {
  session: false
}), function (req, res, next) {
  req.file_path = 'posts/videos/' + detector.getId(req.headers.who, req.user) + '/' + Date.now().toString() + '/'

  Post.getPostById(req.params.postId, (err, post) => {
    if (err) {
      return res.status(400).json({
        msg: err.toString()
      })
    }

    if (!post) {
      return res.status(404).json({
        msg: 'Post not found'
      })
    }

    singleUpload(req, res, function (err, some) {
      if (err) {
        return res.status(400).json()
      }

      Post.addVideo(req.params.postId, req.file.location, (err, updatedPost) => {
        if (err) {
          return res.status(400).json({
            msg: err.toString()
          })
        }

        return res.status(200).json(updatedPost)
      })
    })
  })
})

// Delete Post Video
router.delete('/:postId/video', passport.authenticate('jwt', {
  session: false
}), (req, res, next) => {
  Post.getPostById(req.params.postId, (err, post) => {
    if (err) {
      return res.status(400).json({
        msg: err.toString()
      })
    }

    if (!post) {
      return res.status(404).json({
        msg: 'Post not found'
      })
    }

    Post.removeVideo(req.params.postId, req.body.file_item, (err, deletedPostVideo) => {
      if (err) {
        return res.status(400).json({
          msg: err.toString()
        })
      }

      if (!deletedPostVideo) {
        return res.status(400).json({
          msg: 'Post video not deleted!'
        })
      }

      deleteStorageItem(req.body.file_item, (err, deleted) => {
        if (err) {
          return res.status(400).json({
            msg: err.toString()
          })
        }

        return res.status(204).json()
      })
    })
  })
})

module.exports = router