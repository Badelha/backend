const router = require('express').Router();
const UserController = require('../controllers/user.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { isAdmin } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validation.middleware');
const v = require('../validators/user.validator');

router.get('/', authenticate, isAdmin, v.getUsersValidator, validate, UserController.getAllUsers);
router.get('/:id', authenticate, v.getUserByIdValidator, validate, UserController.getUserById);
router.put('/profile', authenticate, v.updateProfileValidator, validate, UserController.updateProfile);
router.patch('/:id/status', authenticate, isAdmin, v.updateUserStatusValidator, validate, UserController.updateUserStatus);
router.delete('/:id', authenticate, isAdmin, v.getUserByIdValidator, validate, UserController.deleteUser);

module.exports = router;
