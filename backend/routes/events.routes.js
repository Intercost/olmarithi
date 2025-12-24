const express = require('express');
const router = express.Router();
const Event = require('../models/event.model');
const { authenticateAdmin } = require('../middleware/authMiddleware'); // your auth middleware

// GET /api/events  -> public
router.get('/', async (req, res) => {
  try {
    const events = await Event.find({ dateTime: { $gte: new Date() } }).sort({ dateTime: 1 }).exec();
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/events  -> admin only
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const { title, location, dateTime, notes, host } = req.body;
    if (!title || !location || !dateTime) return res.status(400).json({ message: 'Missing required fields' });

    const ev = new Event({ title, location, dateTime: new Date(dateTime), notes, host });
    await ev.save();
    // Optionally broadcast via websocket / SSE here for real-time push
    res.status(201).json(ev);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/events/:id  -> admin only
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const ev = await Event.findByIdAndDelete(id);
    if (!ev) return res.status(404).json({ message: 'Event not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
