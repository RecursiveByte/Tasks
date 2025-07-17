import express from 'express';
import {addBook,deleteBook,getAverageRatings, register,login,addReview,editReview,deleteReview, editBook} from '../controller/authController.js';
import { authenticateUser } from '../middlewares/userAuthMiddleWare.js';

const router = express.Router();

router.get('/average-ratings', getAverageRatings);

router.post('/register', register);
router.post('/login', login);

router.post('/addReview',authenticateUser , addReview);
router.patch('/editReview',authenticateUser , editReview);
router.delete('/deleteReview',authenticateUser , deleteReview);

router.post('/addBook',authenticateUser , addBook);
router.patch('/editBook',authenticateUser , editBook);
router.delete('/deleteBook',authenticateUser , deleteBook);

export default router;
