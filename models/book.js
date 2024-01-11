const mongoose = require('mongoose');

const bookSchema = mongoose.Schema({
  
  userId: { type: String, required: false},
  title: { type: String, required: false },
  author: { type: String, required: false },
  imageUrl: { type: String, required: false },
  year: { type: Number, required: false },
  genre: { type: String, required: false },
  ratings: [
    {
        userId: { type: String },
        grade: { type: Number }
    }
   ],
   averageRating: { type: Number, default: 0 }
})

module.exports = mongoose.model('Book', bookSchema);