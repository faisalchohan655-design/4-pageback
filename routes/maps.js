// backend/routes/maps.js
import express from 'express';
import axios from 'axios';

const router = express.Router();

router.post('/search', async (req, res) => {
  try {
    const { query, location = 'New York, New York, United States', limit = 20 } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const params = {
      api_key: process.env.SERPAPI_KEY,
      engine: 'google_maps',
      q: query,
      ll: '@40.7455096,-74.0083012,14z',
      gl: 'us',
      hl: 'en'
    };

    const response = await axios.get('https://serpapi.com/search.json', { params });
    const data = response.data;

    const results = (data.local_results || [])
      .filter(place => place.title && place.address)
      .slice(0, limit)
      .map(place => ({
        name: place.title || 'Unknown',
        address: place.address || '',
        phone: place.phone || '',
        rating: place.rating || 0,
        reviews: place.reviews || 0,
        website: place.website || '',
        placeId: place.place_id || '',
        coordinates: {
          lat: place.gps_coordinates?.latitude || null,
          lng: place.gps_coordinates?.longitude || null
        },
        categories: place.types || [],
        source: 'google_maps'
      }));

    res.json({
      success: true,
      count: results.length,
      results: results,
      location: location,
      query: query
    });

  } catch (error) {
    console.error('Maps search error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
