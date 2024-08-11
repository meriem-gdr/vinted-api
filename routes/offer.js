const express = require("express");
const cloudinary = require("cloudinary").v2; // On n'oublie pas le `.v2` à la fin
const fileUpload = require("express-fileupload");

const convertToBase64 = require("../utils/convertToBase64");
const isAuthenticated = require("../middlewares/isAuthenticated");
const Offer = require("../models/Offer");

const router = express.Router();

router.post(
  "/offer/publish",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      const title = req.body.title;
      const description = req.body.description;
      const price = Number(req.body.price);
      const owner = req.user;
      const pictureToUpload = req.files.picture;
      let image; // picture uploaded to cloudinary if provided

      if (title.length > 50) {
        return res.status(400).json({ message: "Title is too long" });
      }

      if (description.length > 500) {
        return res.status(400).json({ message: "Description is too long" });
      }

      if (price > 100000) {
        return res.status(400).json({ message: "Price is too high" });
      }

      if (pictureToUpload) {
        image = await cloudinary.uploader.upload(
          convertToBase64(pictureToUpload),
          { folder: "vinted/offers" }
        );
      }

      // créer une offre avec 4 paramètres : title + description + price + owner ()
      const newOffer = new Offer({
        product_name: title,
        product_description: description,
        product_price: price,
        product_image: image,
        owner: owner,
      });

      await newOffer.save();

      return res.json(newOffer);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

const LIMIT = 1;

router.get("/offers", async (req, res) => {
  try {
    const { title, priceMin, priceMax, sort, page } = req.query;

    const priceMinNumber = Number(priceMin) || 0;
    const priceMaxNumber = Number(priceMax) || 100000;
    const pageNumber = Number(page) || 1;

    const sortPrice = sort === "price-desc" ? "desc" : "asc";
    const sortBy = sort ? { product_price: sortPrice } : {};

    const offers = await Offer.find({
      product_name: new RegExp(title, "i"),
      product_price: { $gte: priceMinNumber, $lte: priceMaxNumber },
    })
      .sort(sortBy)
      .limit(LIMIT)
      .skip((pageNumber - 1) * LIMIT);

    return res.status(400).json({ offers, offersLength: offers.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/offer/:id", async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id).populate({
      path: "owner",
      select: "account",
    });
    res.status(500).json(offer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
