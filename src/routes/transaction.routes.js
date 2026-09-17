// transaction.routes.js
const router = require('express').Router();
const { authenticate } = require('../middlewares/auth.middleware');
const controller = require('../controllers/transaction.controller');
router.use(authenticate);
router.get('/', controller.listTransactions);
router.get('/stats', controller.getStats);
module.exports = router;
