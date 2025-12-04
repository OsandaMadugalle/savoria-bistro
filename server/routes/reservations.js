const express = require('express');
const router = express.Router();
const Reservation = require('../models/Reservation');

router.get('/', async (req, res) => {
  try {
    const filter = req.query.email ? { email: req.query.email } : {};
    const reservations = await Reservation.find(filter).sort({ date: 1, time: 1 });
    res.json(reservations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const reservation = new Reservation(req.body);
    await reservation.save();
    res.status(201).json({ message: 'Reservation confirmed', reservation });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update reservation status (complete/cancel)
router.put('/:id/status', async (req, res) => {
  const { action } = req.body;
  if (!['complete', 'cancel'].includes(action)) {
    return res.status(400).json({ message: 'Invalid action' });
  }
  try {
    const status = action === 'complete' ? 'Completed' : 'Cancelled';
    const reservation = await Reservation.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!reservation) return res.status(404).json({ message: 'Reservation not found' });
    res.json({ message: 'Reservation updated', reservation });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;