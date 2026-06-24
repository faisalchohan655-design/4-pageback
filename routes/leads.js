// backend/routes/leads.js
import express from 'express';
import Lead from '../models/Lead.js';

const router = express.Router();

// GET all leads
router.get('/', async (req, res) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 });
    res.json(leads);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST - Bulk save
router.post('/bulk', async (req, res) => {
  try {
    const { leads } = req.body;
    if (!leads || !leads.length) {
      return res.status(400).json({ error: 'No leads provided' });
    }

    const saved = [];
    const skipped = [];

    for (const lead of leads) {
      try {
        const existing = await Lead.findOne({
          $or: [
            { email: lead.email },
            { phone: lead.phone }
          ]
        });

        if (existing) {
          skipped.push({ email: lead.email, reason: 'Duplicate' });
          continue;
        }

        const newLead = new Lead({
          name: lead.name || 'Unknown',
          email: lead.email || '',
          phone: lead.phone || '',
          address: lead.address || '',
          company: lead.company || '',
          website: lead.website || '',
          source: lead.source || 'manual',
          platform: lead.platform || '',
          rating: lead.rating || 0,
          reviews: lead.reviews || 0,
          placeId: lead.placeId || '',
          verified: lead.verified || false,
          categories: lead.categories || [],
          coordinates: lead.coordinates || {},
          status: lead.status || 'new'
        });

        await newLead.save();
        saved.push(newLead);
      } catch (err) {
        skipped.push({ email: lead.email, reason: err.message });
      }
    }

    res.json({
      success: true,
      saved: saved.length,
      skipped: skipped.length,
      savedLeads: saved
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE - Single
router.delete('/:id', async (req, res) => {
  try {
    await Lead.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE - Bulk
router.delete('/bulk', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !ids.length) {
      return res.status(400).json({ error: 'No IDs provided' });
    }
    await Lead.deleteMany({ _id: { $in: ids } });
    res.json({ success: true, deleted: ids.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
