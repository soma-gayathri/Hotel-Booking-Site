const mongoose = require('mongoose');
const Listing = require('../models/listings.js');
const { data } = require('./data.js');

async function main() {
  await mongoose.connect('mongodb://localhost:27017/majorproject');
}

main()
  .then(() => {
    console.log('Connected to DB');
  })
  .catch((err) => {
    console.log(err);
  });

const initDB = async () => {
  await Listing.deleteMany({});
  await Listing.insertMany(data);
  console.log('Data was initialized');
};

initDB();