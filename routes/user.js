const express = require("express");
const encBase64 = require("crypto-js/enc-base64");
const SHA256 = require("crypto-js/sha256");
const uid2 = require("uid2");
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;

const convertToBase64 = require("../utils/convertToBase64");
const User = require("../models/User");

const router = express.Router();

router.post("/user/signup", fileUpload(), async (req, res) => {
  try {
    console.log("req.body", req.body);
    if (!req.body.username) {
      return res.status(400).json({ message: "please check username" });
    }

    const existingUser = await User.findOne({ email: req.body.email });

    if (existingUser) {
      return res
        .status(400)
        .json({ message: "you are already registered, please login" });
    }

    const pictureToUpload = req.files.picture;
    let avatar; // picture uploaded to cloudinary if provided

    if (pictureToUpload) {
      avatar = await cloudinary.uploader.upload(
        convertToBase64(pictureToUpload),
        { folder: "vinted/avatars" }
      );
    }

    const password = req.body.password;
    const salt = uid2(16);
    const hash = SHA256(password + salt).toString(encBase64);
    const token = uid2(16);

    const newUser = new User({
      email: req.body.email,
      account: {
        username: req.body.username,
        avatar: avatar,
      },
      newsletter: req.body.newsletter,
      token: token,
      hash: hash,
      salt: salt,
    });

    await newUser.save();

    res.status(201).json({
      _id: newUser._id,
      token: newUser.token,
      account: {
        username: newUser.account.username,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/user/login", async (req, res) => {
  try {
    const signingUser = await User.findOne({ email: req.body.email });
    if (!signingUser) {
      return res.status(400).json({ message: "email or Password not correct" });
    }

    const password = req.body.password;
    const salt = signingUser.salt;
    const hash = SHA256(password + salt).toString(encBase64);

    if (hash !== signingUser.hash) {
      return res.status(400).json({ message: "email or Password not correct" });
    }
    return res.status(200).json({
      _id: signingUser._id,
      token: signingUser.token,
      account: {
        username: signingUser.account.username,
        avatar: signingUser.account.avatar,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
