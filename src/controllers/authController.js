const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const register = async (req, res) => {
  try {
    console.log('Register endpoint hit with body:', req.body);
    const { username, email, password, role } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ 
      username, 
      email: email || `${username}@example.com`, 
      password: hashedPassword, 
      role 
    });

    await newUser.save();
    res
      .status(201)
      .json({ message: `User registered with username: ${username}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const login = async (req, res) => {
  try {
    console.log('Login endpoint hit with body:', req.body);
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Return token and user data (excluding password)
    res.status(200).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        profile: user.profile || {}
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Google OAuth - Check if user exists
const checkGoogleUser = async (req, res) => {
  try {
    const { googleId } = req.params;
    const user = await User.findOne({ googleId });
    
    if (user) {
      res.status(200).json({ 
        exists: true, 
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          name: user.name,
          role: user.role,
          picture: user.picture
        }
      });
    } else {
      res.status(404).json({ exists: false });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Google OAuth - Register new user
const registerGoogleUser = async (req, res) => {
  try {
    console.log('Google register endpoint hit with body:', req.body);
    const { googleId, email, name, picture, role } = req.body;

    // Check if user already exists with this Google ID
    const existingUser = await User.findOne({ googleId });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this Google account" });
    }

    // Check if user exists with this email
    const emailUser = await User.findOne({ email });
    if (emailUser) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    // Create username from email
    const username = email.split('@')[0] + '_' + Math.random().toString(36).substr(2, 4);

    const newUser = new User({
      username,
      email,
      googleId,
      name,
      picture,
      role,
      authProvider: 'google'
    });

    await newUser.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(201).json({
      message: "User registered successfully with Google",
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        picture: newUser.picture
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Google OAuth - Login existing user
const loginGoogleUser = async (req, res) => {
  try {
    console.log('Google login endpoint hit with body:', req.body);
    const { googleId } = req.body;
    
    const user = await User.findOne({ googleId });
    if (!user) {
      return res.status(404).json({ message: "User not found. Please register first." });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(200).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        picture: user.picture
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { register, login, checkGoogleUser, registerGoogleUser, loginGoogleUser };
