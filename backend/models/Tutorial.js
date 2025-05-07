const mongoose = require('mongoose');

const tutorialSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required']
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  craftType: {
    type: String,
    required: [true, 'Craft type is required'],
    enum: [
      'Paper Craft',
      'Wood Craft', 
      'Textile Craft',
      'Pottery',
      'Jewelry Making',
      'Metal Craft',
      'Glass Craft',
      'Leather Craft',
      'Mixed Media',
      'Other'
    ]
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Author is required']
  },
  steps: {
    type: [String],
    required: [true, 'Steps are required']
  },
  materials: {
    type: [String],
    required: [true, 'Materials are required']
  },
  images: {
    type: [String]
  },
  videos: {
    type: [String]
  }
}, { timestamps: true });

module.exports = mongoose.model('Tutorial', tutorialSchema);