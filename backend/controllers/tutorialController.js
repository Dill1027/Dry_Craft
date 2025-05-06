const Tutorial = require('../models/Tutorial');

exports.createTutorial = async (req, res) => {
  try {
    const {
      title,
      description,
      steps,
      materials,
      craftType,  // Add this
      userId
    } = req.body;

    // Validate required fields
    if (!title || !description || !steps || !materials || !craftType) {
      return res.status(400).json({ message: 'Please fill all required fields' });
    }

    const tutorial = new Tutorial({
      title,
      description,
      steps,
      materials,
      craftType,  // Add this
      author: userId,
    });

    await tutorial.save();
    res.status(201).json(tutorial);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.updateTutorial = async (req, res) => {
  try {
    const {
      title,
      description,
      steps,
      materials,
      craftType  // Add this
    } = req.body;

    // Validate required fields
    if (!title || !description || !steps || !materials || !craftType) {
      return res.status(400).json({ message: 'Please fill all required fields' });
    }

    const tutorial = await Tutorial.findById(req.params.id);
    if (!tutorial) {
      return res.status(404).json({ message: 'Tutorial not found' });
    }

    tutorial.title = title;
    tutorial.description = description;
    tutorial.steps = steps;
    tutorial.materials = materials;
    tutorial.craftType = craftType;  // Add this

    await tutorial.save();
    res.status(200).json(tutorial);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};