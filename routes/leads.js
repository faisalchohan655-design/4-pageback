// backend/routes/leads.js
import express from 'express';
import Lead from '../models/Lead.js';

const router = express.Router();

// GET all leads
router.get('/', async (req, res) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 });
    console.log('📊 Sending leads:', leads.length);
    res.json(leads);
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST - Bulk save
router.post('/bulk', async (req, res) => {
  try {
    const { leads } = req.body;
    
    console.log('📝 Bulk save request:', leads?.length);

    if (!leads || !leads.length) {
      return res.status(400).json({ error: 'No leads provided' });
    }

    const saved = [];

    for (const lead of leads) {
      // Check duplicate
      const existing = await Lead.findOne({
        $or: [
          { email: lead.email },
          { phone: lead.phone }
        ]
      });

      if (existing) {
        console.log('⏭️ Skipping duplicate:', lead.email || lead.phone);
        continue;
      }

      const newLead = new Lead({
        name: lead.name || 'Unknown',
        email: lead.email || '',
        phone: lead.phone || '',
        address: lead.address || '',
        website: lead.website || '',
        rating: lead.rating || 0,
        reviews: lead.reviews || 0,
        source: lead.source || 'google_maps'
      });

      await newLead.save();
      saved.push(newLead);
      console.log('✅ Saved:', newLead.name);
    }

    console.log('✅ Total saved:', saved.length);
    res.json({ success: true, saved: saved.length, savedLeads: saved });
  } catch (error) {
    console.error('❌ Bulk save error:', error);
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
