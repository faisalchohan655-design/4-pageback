// backend/models/Lead.js
import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  company: { type: String, default: '' },
  website: { type: String, default: '' },
  source: { type: String, default: 'manual' },
  platform: { type: String, default: '' },
  rating: { type: Number, default: 0 },
  reviews: { type: Number, default: 0 },
  placeId: { type: String, default: '' },
  verified: { type: Boolean, default: false },
  status: { 
    type: String, 
    enum: ['new', 'contacted', 'qualified', 'proposal', 'closed'],
    default: 'new'
  },
  categories: { type: [String], default: [] },
  coordinates: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null }
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Lead', leadSchema);
