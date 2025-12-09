const express = require('express');
const router = express.Router();
const Reservation = require('../models/Reservation');
const nodemailer = require('nodemailer');

// Generate unique confirmation code
const generateConfirmationCode = () => {
  return 'RES' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 5).toUpperCase();
};

// Configure email service
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'noreply@savoria.com',
    pass: process.env.EMAIL_PASSWORD || 'default_password'
  }
});

// Send confirmation email
const sendConfirmationEmail = async (reservation) => {
  const mailOptions = {
    from: 'Savoria Bistro <noreply@savoria.com>',
    to: reservation.email,
    subject: `Reservation Confirmed - ${reservation.confirmationCode}`,
    html: `
      <h2>Your Reservation is Confirmed!</h2>
      <p>Dear ${reservation.name},</p>
      <p>Thank you for booking with us at Savoria Bistro.</p>
      <div style="background: #f0f0f0; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>Reservation Details</h3>
        <p><strong>Confirmation Code:</strong> ${reservation.confirmationCode}</p>
        <p><strong>Date:</strong> ${reservation.date}</p>
        <p><strong>Time:</strong> ${reservation.time}</p>
        <p><strong>Party Size:</strong> ${reservation.guests} ${reservation.guests === 1 ? 'guest' : 'guests'}</p>
        <p><strong>Duration:</strong> ${reservation.duration} minutes</p>
      </div>
      <p>Please arrive 5-10 minutes early. If you need to modify or cancel, please call us at (555) 123-4567 or reply to this email with your confirmation code.</p>
      <p>Looking forward to serving you!</p>
      <p>Savoria Bistro Team</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Confirmation email sent to', reservation.email);
  } catch (err) {
    console.error('Failed to send email:', err);
    // Don't fail the reservation if email fails
  }
};

// Check restaurant capacity for a specific time slot
const checkAvailability = async (date, time, excludeId = null) => {
  const Settings = require('../models/Settings');
  
  // Get max capacity from settings, default to 50
  let settings = await Settings.findOne();
  if (!settings) {
    settings = new Settings();
    await settings.save();
  }
  const maxCapacity = settings.maxTableCapacity || 50;
  
  const query = {
    date: date,
    time: time,
    status: { $in: ['Confirmed', 'Pending'] }
  };
  
  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const reservations = await Reservation.find(query);
  const totalGuests = reservations.reduce((sum, res) => sum + res.guests, 0);
  
  return {
    available: totalGuests < maxCapacity,
    bookedGuests: totalGuests,
    availableSlots: maxCapacity - totalGuests,
    maxCapacity: maxCapacity
  };
};

// Get all reservations (for staff)
router.get('/', async (req, res) => {
  try {
    const filter = req.query.email ? { email: req.query.email } : {};
    const reservations = await Reservation.find(filter).sort({ date: 1, time: 1 });
    res.json(reservations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get user's reservations (for customers)
router.get('/user/:userId', async (req, res) => {
  try {
    const reservations = await Reservation.find({ userId: req.params.userId }).sort({ date: -1 });
    res.json(reservations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get availability for a specific date and time
router.get('/check-availability/:date/:time', async (req, res) => {
  try {
    const availability = await checkAvailability(req.params.date, req.params.time);
    res.json(availability);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new reservation
router.post('/', async (req, res) => {
  try {
    const { date, time, guests, ...otherData } = req.body;
    
    // Validate date is not in the past
    const reservationDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (reservationDate < today) {
      return res.status(400).json({ message: 'Cannot book a reservation for a past date' });
    }

    // Validate minimum party size (1 guest minimum)
    if (guests < 1) {
      return res.status(400).json({ message: 'Party size must be at least 1 guest' });
    }

    // Check availability
    const availability = await checkAvailability(date, time);
    if (!availability.available) {
      return res.status(400).json({ 
        message: `Unfortunately, we cannot accommodate ${guests} guest(s) at this time. Available slots: ${availability.availableSlots}` 
      });
    }

    // Generate confirmation code
    let confirmationCode;
    let codeExists = true;
    while (codeExists) {
      confirmationCode = generateConfirmationCode();
      const existing = await Reservation.findOne({ confirmationCode });
      codeExists = !!existing;
    }

    const reservation = new Reservation({
      ...otherData,
      date,
      time,
      guests,
      confirmationCode,
      status: 'Confirmed',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // Auto-expire in 24 hours if not marked complete
    });

    await reservation.save();

    // Send confirmation email
    await sendConfirmationEmail(reservation);

    // Log activity
    const { requesterEmail } = req.body;
    if (requesterEmail) {
      try {
        const { logActivity } = require('./auth');
        await logActivity(requesterEmail, 'Add Reservation', `Created reservation ${confirmationCode} for: ${reservation.name}`);
      } catch (err) {
        console.error('Failed to log activity:', err);
      }
    }

    res.status(201).json({ 
      message: 'Reservation confirmed', 
      reservation,
      confirmationCode: reservation.confirmationCode
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update reservation (by customer or staff)
router.put('/:id', async (req, res) => {
  try {
    const { date, time, guests } = req.body;
    
    // If changing date/time, check availability (excluding current reservation)
    if (date || time) {
      const newDate = date || (await Reservation.findById(req.params.id)).date;
      const newTime = time || (await Reservation.findById(req.params.id)).time;
      const availability = await checkAvailability(newDate, newTime, req.params.id);
      if (!availability.available) {
        return res.status(400).json({ message: 'This time slot is not available' });
      }
    }

    const reservation = await Reservation.findByIdAndUpdate(
      req.params.id,
      { ...req.body, status: 'Confirmed' },
      { new: true }
    );

    if (!reservation) return res.status(404).json({ message: 'Reservation not found' });
    
    res.json({ message: 'Reservation updated', reservation });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update reservation status (complete/cancel - staff only)
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
    
    // Log activity
    const { requesterEmail } = req.body;
    if (requesterEmail) {
      try {
        const { logActivity } = require('./auth');
        await logActivity(requesterEmail, 'Update Reservation', `Reservation ${reservation.confirmationCode} status changed to ${status}`);
      } catch (err) {
        console.error('Failed to log activity:', err);
      }
    }
    
    res.json({ message: 'Reservation updated', reservation });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Cancel reservation (by customer using confirmation code)
router.delete('/:confirmationCode', async (req, res) => {
  try {
    const reservation = await Reservation.findOneAndUpdate(
      { confirmationCode: req.params.confirmationCode },
      { status: 'Cancelled' },
      { new: true }
    );

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found. Please check your confirmation code.' });
    }

    // Send cancellation email
    const mailOptions = {
      from: 'Savoria Bistro <noreply@savoria.com>',
      to: reservation.email,
      subject: `Reservation Cancelled - ${reservation.confirmationCode}`,
      html: `
        <h2>Your Reservation has been Cancelled</h2>
        <p>Dear ${reservation.name},</p>
        <p>Your reservation with confirmation code <strong>${reservation.confirmationCode}</strong> has been successfully cancelled.</p>
        <p>If you didn't cancel this, please contact us immediately at (555) 123-4567.</p>
        <p>We hope to see you soon at Savoria Bistro!</p>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (err) {
      console.error('Failed to send cancellation email:', err);
    }

    res.json({ message: 'Reservation cancelled successfully', reservation });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;