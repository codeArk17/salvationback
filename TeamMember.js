const mongoose = require('mongoose');

const TeamMemberSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  role:     { type: String, default: '' },
  bio:      { type: String, default: '' },
  category: { type: String, enum: ['Leadership', 'Field Team', 'Volunteers', 'Board'], default: 'Leadership' },
  photoUrl: { type: String, default: '' },
  order:    { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('TeamMember', TeamMemberSchema);
