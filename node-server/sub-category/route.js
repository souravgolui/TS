const express = require('express')
const router = express.Router()
const passport = require('passport')

router.get('/', (req, res) => {
    return res.status(201).json({msg: 'working'})
});

module.exports = router