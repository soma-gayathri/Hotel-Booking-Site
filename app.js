const express = require('express');
const app = express();
const ejsMate = require('ejs-mate');
const methodOverride = require('method-override');

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', 'views');
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/majorproject')
  .then(() => console.log('Connected to MongoDB...'))
  .catch(err => console.error('Could not connect to MongoDB...', err));
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user.js');
const Listing = require('./models/listings.js');
const Review = require('./models/review.js');
const Joi = require('joi');

const listingSchema = Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    image: Joi.object({
        url: Joi.string().allow('', null)
    }),
    price: Joi.number().required().min(0),
    location: Joi.string().required(),
    country: Joi.string().required()
}).required();

const validateListing = (req, res, next) => {
    const { error } = listingSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',');
        // In a real application, you would render an error page or send a JSON error response
        // For now, we'll just log the error and send a 400 status
        console.log(msg);
        return res.status(400).send(msg);
    } else {
        next();
    }
};

const sessionOptions = { secret: 'mysupersecretcode', resave: false, saveUninitialized: true };

app.use(session(sessionOptions));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    next();
});

app.use(methodOverride('_method'));
app.use(express.urlencoded({ extended: true }));

app.get('/register', (req, res) => {
    res.render('users/register');
});

app.post('/register', async (req, res) => {
    try {
        const { email, username, password } = req.body;
        const newUser = new User({ email, username });
        const registeredUser = await User.register(newUser, password);
        req.login(registeredUser, (err) => {
            if (err) return next(err);
            res.redirect('/listings');
        });
    } catch (e) {
        res.redirect('/register');
    }
});

app.get('/login', (req, res) => {
    res.render('users/login');
});

app.post('/login', passport.authenticate('local', { failureRedirect: '/login' }), (req, res) => {
    res.redirect('/listings');
});

app.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) { return next(err); }
        res.redirect('/listings');
    });
});

app.post('/listings', validateListing, async (req, res) => {
  const newListing = new Listing(req.body);
  await newListing.save();
  res.redirect('/listings');
});

app.get('/listings/:id/edit', async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  res.render('edit', { listing });
});

app.put('/listings/:id', async (req, res) => {
  const { id } = req.params;
  await Listing.findByIdAndUpdate(id, req.body, { runValidators: true, new: true });
  res.redirect(`/listings/${id}`);
});

app.delete('/listings/:id', async (req, res) => {
  const { id } = req.params;
  await Listing.findByIdAndDelete(id);
  res.redirect('/listings');
});

app.get('/', (req, res) => {
  res.redirect('/listings');
});

app.get('/listings', async (req, res) => {
  const listings = await Listing.find({});
  listings.sort((a, b) => a.title.localeCompare(b.title));
  console.log("Sorted Listings:", listings.map(l => l.title));
  res.render('index', { listings });
});

  app.get('/listings/:id', async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id).populate('reviews');
  if (!listing) {
    return res.redirect('/listings');
  }
  if (!Array.isArray(listing.reviews)) {
    listing.reviews = [];
  }
  res.render('show', { listing });
});

app.post('/listings/:id/reviews', async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  const review = new Review(req.body.review);
  listing.reviews.push(review);
  review.listing = listing._id; // Associate review with listing
  review.author = req.user._id; // Associate review with current user
  await review.save();
  await listing.save();
  res.redirect(`/listings/${listing._id}`);
});

app.listen(8080, () => {
  console.log(`Server running on port 8080`);
});