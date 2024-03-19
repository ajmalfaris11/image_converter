const express = require('express')
const userRoute = express.Router()
const userController = require('../controllers/userController')
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });




userRoute.get('/',userController.loadPage)
userRoute.post('/image', upload.single('image'),userController.imagePng)



module.exports = userRoute