const express = require('express')
const router = express.Router()
const passport = require('passport')
const upload = require('../kitbag/filer').upload
const deleteStorageItem = require('../kitbag/filer').deleteItem
const Category = require('./model')

const singleUpload = upload.single('file_item')

// Create Category
router.post('/', passport.authenticate('jwt', {
  session: false
}), (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(401).json()

  let newCategory = new Category(req.body)

  Category.createCategory(newCategory, (err, category) => {
    if (err) {
      return res.status(400).json({
        msg: err
      })
    } else {
      return res.status(201).json(category)
    }
  })
})

// Get Category by id
router.get('/:categoryId', passport.authenticate('jwt', {
  session: false
}), (req, res, next) => {
  Category.getCategoryById(req.params.categoryId, (err, category) => {
    if (err) {
      return res.status(400).json({
        msg: err.toString()
      })
    }

    if (!category) {
      return res.status(404).json({
        msg: 'Category not found'
      })
    }

    return res.status(200).json(category)
  })
})

// List Categories
router.get('/', passport.authenticate('jwt', {
  session: false
}), (req, res, next) => {
  Category.listCategories(req.query, (err, categories) => {
    if (err) {
      return res.status(400).json({
        msg: err.toString()
      })
    }

    if (!categories) {
      return res.status(404).json({
        msg: 'Category not found'
      })
    }
    return res.status(200).json(categories)
  })
})

// Update Category
router.put('/:categoryId', passport.authenticate('jwt', {
  session: false
}), (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(401).json()

  Category.updateCategory(req.params.categoryId, req.body, (err, updatedCategory) => {
    if (err) {
      return res.status(400).json({
        msg: err.toString()
      })
    }

    if (!updatedCategory) {
      return res.status(400).json({
        msg: 'Category not updated!'
      })
    }
    return res.status(200).json(updatedCategory)
  })
})

// Delete Category
router.delete('/:categoryId', passport.authenticate('jwt', {
  session: false
}), (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(401).json()

  Category.updateCategory(req.params.categoryId, {
    deleted_at: new Date()
  }, (err, deletedCategory) => {
    if (err) {
      return res.status(400).json({
        msg: err.toString()
      })
    }

    if (!deletedCategory) {
      return res.status(400).json({
        msg: 'Category not deleted!'
      })
    }
    return res.status(204).json()
  })
})

// Add Category Cover Image
router.post('/:categoryId/cover_image', passport.authenticate('jwt', {
  session: false
}), function (req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(401).json({
      msg: 'only update admin'
    })
  }

  req.file_path = 'categories/' + req.params.categoryId + '/cover_image/' + Date.now().toString() + '/'

  Category.getCategoryById(req.params.categoryId, (err, category) => {
    if (err) {
      return res.status(400).json({
        msg: err.toString()
      })
    }

    singleUpload(req, res, function (err, some) {
      if (err) {
        return res.status(400).json()
      }

      Category.updateCategory(req.params.categoryId, {
        'cover_image': req.file.location
      }, (err, updatedCategory) => {
        if (err) {
          return res.status(400).json({
            msg: err.toString()
          })
        }

        deleteStorageItem(category.cover_image, (err, deleted) => {
          if (err) {
            return res.status(400).json({
              msg: err.toString()
            })
          }

          return res.status(200).json(updatedCategory)
        })
      })
    })
  })
})

module.exports = router