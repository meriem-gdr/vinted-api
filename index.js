const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
require('dotenv').config(); // Permet d'activer les variables d'environnement qui se trouvent dans le fichier `.env`

mongoose.connect(process.env.MONGODB_URI);

// imports des routes
const userRoutes = require("./routes/user");
const offerRoutes = require("./routes/offer");

// initialisation d'express
const app = express();
app.use(cors());
// connexion à la base de données
mongoose.connect("mongodb://localhost:27017/vinted");

// initialisation de cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY-CLOUDNAME,
  api_key: process.env.CLOUDINARY-APIKEY,
  api_secret: process.env.CLOUDINARY-SECRETAPI,
});

app.use(express.json());

app.use(userRoutes);
app.use(offerRoutes);

app.all("*", (req, res) => {
  res.status(404).json({ message: "This route does not exist" });
});

app.listen(process.env.PORT, () => {
  console.log("Server started");
});
