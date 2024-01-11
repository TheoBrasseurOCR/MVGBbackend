const express = require('express');
const auth = require('../middleware/authMiddleware');
const router = express.Router();

const bookCtrl = require('../controllers/bookControllers');

router.get('/', bookCtrl.getAllBook);
router.post('/', auth, bookCtrl.createBook);
router.get('/:id', bookCtrl.getOneBook);
router.put('/:id', auth, bookCtrl.modifyBook);
router.delete('/:id', auth, bookCtrl.deleteBook);

module.exports = router;