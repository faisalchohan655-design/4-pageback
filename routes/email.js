// backend/routes/email.js
import express from 'express';
import { extractEmails, bulkExtractEmails } from '../controllers/emailController.js';

const router = express.Router();

router.post('/extract', extractEmails);
router.post('/bulk-extract', bulkExtractEmails);

export default router;
