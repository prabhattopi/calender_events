const mongoose = require('mongoose');

const MappingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mapping: [
    {
      name: { type: String, default: "google_title" },
      position: { type: String, default: "A" }
    },
    {
      name: { type: String, default: "google_start_time" },
      position: { type: String, default: "B" }
    },
    {
      name: { type: String, default: "google_end_time" },
      position: { type: String, default: "C" }
    },
  ],
  is_active:{type:Boolean,default:true}

},
{ timestamps: true });

module.exports = mongoose.model('Mapping', MappingSchema);
