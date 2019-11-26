const express = require('express')
const router = express.Router()
const passport = require('passport')
const SubCommunity = require('./model')

router.post('/', passport.authenticate('jwt', {
    session: false
}), (req, res, next) => {
    if (req.user.role !== 'admin') return res.status(401).json()

    let newSubCommunity = new SubCommunity(req.body)

    SubCommunity.createSubCommunity(newSubCommunity, (err, category) => {
        if (err) {
            return res.status(400).json({
                msg: err
            })
        } else {
            return res.status(201).json(category)
        }
    })
})


router.get('/', passport.authenticate('jwt', {
    session: false
}), (req, res, next) => {
    SubCommunity.listSubCommunities(req.query, (err, communities) => {
        if (err) {
            return res.status(400).json({
                msg: err.toString()
            })
        }

        if (!communities) {
            return res.status(404).json({
                msg: 'Sub Community not found'
            })
        }
        return res.status(200).json(communities)
    })
})


module.exports = router