const express = require('express');
const auth = require('../middleware/authMiddleware');
const router = express.Router();
const multer = require('../middleware/multer-config')


const bookCtrl = require('../controllers/bookControllers');

router.get('/', bookCtrl.getAllBook);
router.get('/bestrating', bookCtrl.getBestRating);
router.post('/', auth, multer, bookCtrl.createBook);
router.get('/:id', bookCtrl.getOneBook);
router.post('/:id/rating', auth, bookCtrl.createRating);
router.put('/:id',  auth, multer, bookCtrl.modifyBook);
router.delete('/:id', auth, bookCtrl.deleteBook);

module.exports = router;