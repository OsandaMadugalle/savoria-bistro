const express = require('express');
const router = express.Router();
const MenuItem = require('../models/MenuItem');

router.get('/', async (req, res) => {
    try {
      const items = await MenuItem.find();
      res.json(items);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
});

router.post('/', async (req, res) => {
  try {
    const newItem = new MenuItem(req.body);
    await newItem.save();
    res.status(201).json(newItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    // Try to update by custom id, then by MongoDB _id
    let updatedItem = await MenuItem.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    if (!updatedItem) {
      updatedItem = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    }
    if (!updatedItem) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json(updatedItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    // Try to delete by custom id, then by MongoDB _id
    let deleted = await MenuItem.findOneAndDelete({ id: req.params.id });
    if (!deleted) {
      deleted = await MenuItem.findByIdAndDelete(req.params.id);
    }
    if (!deleted) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json({ message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;