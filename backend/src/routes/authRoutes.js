import express from 'express';
import { register, login, getMe, updateProfile } from '../controllers/authController.js';
import { requireAuth } from '../middlewares/auth.js';

const router = express.Router();

router.post('/signup', register);
router.post('/login', login);
router.get('/me', requireAuth, getMe);
router.put('/update', requireAuth, updateProfile);

export default router;
