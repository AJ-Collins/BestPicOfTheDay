const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Post = require('../models/Post');
const { ensureAuthenticated } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb('Error: Images Only!');
    }
  }
});

router.get('/new', ensureAuthenticated, (req, res) => {
  res.render('post', { message: null });
});

router.post('/', ensureAuthenticated, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.render('post', { message: 'Please upload an image.' });
    }

    const newPost = new Post({
      imageUrl: `/uploads/${req.file.filename}`,
      caption: req.body.caption,
      user: req.session.userId
    });

    await newPost.save();
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.render('post', { message: 'An error occurred while saving the post.' });
  }
});

router.post('/:id/like', ensureAuthenticated, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const userId = req.session.userId;
    const likeIndex = post.likes.indexOf(userId);

    if (likeIndex === -1) {
      post.likes.push(userId);
    } else {
      post.likes.splice(likeIndex, 1);
    }

    await post.save();
    res.json({ likes: post.likes.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/comment', ensureAuthenticated, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const newComment = {
      user: req.session.userId,
      content: req.body.content
    };

    post.comments.push(newComment);
    await post.save();

    const populatedComment = await Post.populate(post, {
      path: 'comments.user',
      select: 'email profilePicture'
    });

    res.json(populatedComment.comments[populatedComment.comments.length - 1]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;