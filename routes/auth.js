const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const User = require('../models/User');

router.get('/login', (req, res) => {
  res.render('login', { message: null, user: req.session.userId });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.render('login', { message: 'Invalid email or password!', user: req.session.userId });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.render('login', { message: 'Invalid email or password!', user: req.session.userId });
    }

    req.session.userId = user._id;
    res.redirect('/');
  } catch (err) {
    console.log(err);
    res.render('login', { message: 'An error occurred, please try again!', user: req.session.userId });
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.redirect('/');
    }
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
});

router.get('/signup', (req, res) => {
  res.render('signup', { message: null, user: req.session.userId });
});

router.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render('signup', { message: 'Email already exists!', user: req.session.userId });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      email,
      password: hashedPassword,
    });

    await newUser.save();
    res.redirect('/auth/login');
  } catch (err) {
    console.log(err);
    res.render('signup', { message: 'An error occurred, please try again!', user: req.session.userId });
  }
});

module.exports = router;