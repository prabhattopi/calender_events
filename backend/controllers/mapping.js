const User = require("../models/Users");
const Mapping = require("../models/Mappings");

/**
 * This function handles the creation of a new mapping for a user.
 * It first sets all previous mappings for the given user to inactive,
 * then creates a new mapping with the provided data and sets it as active.
 *
 * @param {Object} req - The request object containing the user's ID and mapping data.
 * @param {string} req.body.userId - The ID of the user for whom the mapping is being created.
 * @param {Object} req.body.mappingData - The mapping data to be stored.
 * @param {Object} res - The response object to send back to the client.
 *
 * @returns {void}
 */
exports.mappignColumn = async (req, res) => {
  try {
    const { userId, mapping } = req.body;

    // Set all previous mappings for this user to is_active: false
    await Mapping.updateMany(
      { userId, is_active: true },
      { $set: { is_active: false } }
    );

    // Create the new mapping with is_active set to true
    const newMapping = {
      userId,
      mapping,
    };

    await Mapping.create(newMapping);

    res.status(200).json({
      message: "Mapping created successfully",
    });
  } catch (error) {
    console.error("Error during Mapping:", error.message);
    res.status(500).json({
      message: "Mapping failed",
      error: error.message,
    });
  }
};

