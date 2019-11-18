const env = require('dotenv')
const config = {}

// Environment Variables
env.config()

config.APPFULLPATH = process.env.APPFULLPATH
config.PORT = process.env.PORT
config.DATABASE_URL = process.env.DATABASE_URL
config.SECRET_KEY = process.env.SECRET_KEY
config.AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY
config.AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID
config.AWS_REGION = process.env.AWS_REGION
config.AWS_BUCKET = process.env.AWS_BUCKET
config.AWS_PATH = 'https://' + config.AWS_BUCKET + '.s3.' + config.AWS_REGION + '.amazonaws.com/'
config.SENDER_MAIL = process.env.SENDER_MAIL
config.SENDER_MAIL_PASSWORD = process.env.SENDER_MAIL_PASSWORD
config.FCM_JSON_PATH = process.env.FCM_JSON_PATH

module.exports = config
