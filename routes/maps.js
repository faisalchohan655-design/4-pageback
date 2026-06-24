// backend/routes/maps.js
import express from 'express';
import { searchGoogleMaps, saveMapsLeads } from '../controllers/mapsController.js';

const router = express.Router();

// Search Google Maps
router.post('/search', searchGoogleMaps);

// Save leads
router.post('/save', saveMapsLeads);

export default router;
