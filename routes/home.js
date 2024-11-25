const express = require('express');
const router = express.Router();
const Post = require('../models/Post');

router.get('/', async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ date: -1 })
      .populate('user', 'email profilePicture')
      .populate({
        path: 'comments.user',
        select: 'email profilePicture'
      });
    res.render('index', { posts, user: req.session.userId });
  } catch (err) {
    console.error(err);
    res.render('index', { posts: [], user: req.session.userId });
  }
});

module.exports = router;