const express = require('express');
const router = express.Router();
const PrivateEventInquiry = require('../models/PrivateEventInquiry');
const { sendPrivateEventFollowup } = require('../utils/emailService');

router.post('/inquiries', async (req, res) => {
  try {
    const inquiry = new PrivateEventInquiry(req.body);
    await inquiry.save();
    res.status(201).json(inquiry);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get('/inquiries', async (_req, res) => {
  try {
    const inquiries = await PrivateEventInquiry.find().sort({ createdAt: -1 });
    res.json(inquiries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/inquiries/:id', async (req, res) => {
  try {
    const inquiry = await PrivateEventInquiry.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!inquiry) {
      return res.status(404).json({ message: 'Inquiry not found' });
    }
    res.json(inquiry);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/inquiries/:id/contact', async (req, res) => {
  try {
    const inquiry = await PrivateEventInquiry.findById(req.params.id);
    if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });
    const { subject, body, staffName } = req.body;
    if (!body) return res.status(400).json({ message: 'Message body is required' });
    const success = await sendPrivateEventFollowup(inquiry.email, inquiry.name, staffName || 'Savoria Bistro', body);
    if (!success) return res.status(500).json({ message: 'Failed to send email' });
    inquiry.status = 'contacted';
    inquiry.contactHistory = inquiry.contactHistory || [];
    inquiry.contactHistory.push({
      staffName: staffName || 'Savoria Bistro Team',
      subject: subject || 'Follow-up on your private event inquiry',
      body,
      sentAt: new Date()
    });
    await inquiry.save();
    res.json(inquiry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
