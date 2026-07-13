// src/routes/price.route.js
const express = require('express')
const router = express.Router()
const priceController = require('../controllers/price.controller')
const authMiddleware = require('../middlewares/auth.middleware')

router.use(authMiddleware.verifyToken)

router.get('/', priceController.getAll)         // GET    /api/prices
router.get('/:id', priceController.getById)     // GET    /api/prices/:id
router.post('/', priceController.create)        // POST   /api/prices
router.put('/:id', priceController.update)      // PUT    /api/prices/:id
router.delete('/:id', priceController.remove)   // DELETE /api/prices/:id

module.exports = router

// In app.js, alongside your other route mounts:
// const priceRoutes = require('./routes/price.route')
// app.use('/api/prices', priceRoutes)