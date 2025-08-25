const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Review = require('./review');

const listingSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  price: {
    type: Number,
  },
  image: {
    filename: String,
    url: String,
  },
  location: {
    type: String,
  },
  country: {
    type: String,
  },
  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Review'
    }
  ]
});

listingSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    await Review.deleteMany({ _id: { $in: doc.reviews } });
  }
});

const Listing = mongoose.model('Listing', listingSchema);

module.exports = Listing;