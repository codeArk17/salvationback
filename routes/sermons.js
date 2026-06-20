const express   = require('express');
const router    = express.Router();
const Sermon    = require('../Sermon');
const adminAuth = require('../adminAuth');

// Public: list all sermons
router.get('/', async (req, res) => {
  try {
    const sermons = await Sermon.find().sort({ createdAt: -1 });
    res.json(sermons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: create a sermon
router.post('/', adminAuth, async (req, res) => {
  try {
    const sermon = await Sermon.create(req.body);
    res.status(201).json(sermon);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Admin: update a sermon
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const sermon = await Sermon.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after', runValidators: true });
    if (!sermon) return res.status(404).json({ error: 'Sermon not found.' });
    res.json(sermon);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Admin: delete a sermon
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const sermon = await Sermon.findByIdAndDelete(req.params.id);
    if (!sermon) return res.status(404).json({ error: 'Sermon not found.' });
    res.json({ message: 'Sermon deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
