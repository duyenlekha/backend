const express = require('express');
const { sql, poolPromise } = require('./db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });


function calculateValues(openPrice, highPrice, gapPercent, closePrice, volume, premarketVolume) {

  const priceBeforeGap = parseFloat((openPrice / (1 + (gapPercent / 100))).toFixed(2));


  const gapHighPricePercent = parseFloat((((highPrice - openPrice) / openPrice) * 100 + gapPercent).toFixed(2));


  const volumeToPremarketRatio = premarketVolume > 0 
    ? parseFloat((volume / premarketVolume).toFixed(2))
    : null;

  const estimate50 = parseFloat(((highPrice - priceBeforeGap) * 0.5 + priceBeforeGap).toFixed(2));
  const estimate70 = parseFloat(((highPrice - priceBeforeGap) * 0.3 + priceBeforeGap).toFixed(2));


  if (Math.abs(closePrice - estimate50) < Math.abs(closePrice - estimate70)) {
    return { priceBeforeGap, gapHighPricePercent, volumeToPremarketRatio, estimate50, estimate70: null };
  } else {
    return { priceBeforeGap, gapHighPricePercent, volumeToPremarketRatio, estimate50: null, estimate70 };
  }
}


router.post('/insert', upload.fields([{ name: 'ImageUrl' }, { name: 'DesImageUrl' }]), async (req, res) => {
  try {
    const pool = await poolPromise;
    const {
      Symbol, Exchange, OpenPrice, HighPrice, LowPrice, ClosePrice, Volume, Date,
      PremarketVolume, Float, MarketCap, GAPPercent, Sector,
      ShortSqueeze, VolumeSizeIn, ImageUrl, DesImageUrl
    } = req.body;


    const { priceBeforeGap, gapHighPricePercent, volumeToPremarketRatio, estimate50, estimate70 } =
      calculateValues(OpenPrice, HighPrice, GAPPercent, ClosePrice, Volume, PremarketVolume);



    const query = `
      INSERT INTO StockData (
        Symbol, Exchange, OpenPrice, HighPrice, LowPrice, ClosePrice, Volume, Date,
        PremarketVolume, Float, MarketCap, GAPPercent, VolumeToPremarketRatio, Sector,
        ShortSqueeze, PriceBeforeGap, EstimatePriceCover50, EstimatePriceCover70,
        GapHighPricePercent, ImageUrl, DesImageUrl, VolumeSizeIn, ImageUrl, DesImageUrl
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `;
    const params = [
      Symbol, Exchange, OpenPrice, HighPrice, LowPrice, ClosePrice, Volume, Date,
      PremarketVolume, Float, MarketCap, GAPPercent, volumeToPremarketRatio, Sector,
      ShortSqueeze, priceBeforeGap, estimate50, estimate70,
      gapHighPricePercent, ImageUrl, DesImageUrl, VolumeSizeIn, ImageUrl, DesImageUrl
    ];

    pool.query(query, params, (err, result) => {
      if (err) {
        console.error('SQL error', err);
        res.status(500).send({ message: 'Error inserting data', error: err.message || err });
      } else {
        res.status(200).send({ message: 'Stock data inserted successfully!' });
      }
    });

  } catch (err) {
    console.error('SQL error', err);
    res.status(500).send({ message: 'Error inserting data', error: err.message || err });
  }
});


router.put('/update/:id', upload.single('image'), async (req, res) => {
  try {
    const pool = await poolPromise;
    const { id } = req.params;
    const {
      Symbol, Exchange, OpenPrice, HighPrice, LowPrice, ClosePrice, Volume, Date,
      PremarketVolume, Float, MarketCap, GAPPercent, Sector,
      ShortSqueeze, VolumeSizeIn, ImageUrl, DesImageUrl
    } = req.body;

 
    const openPrice = parseFloat(OpenPrice) || 0;
    const highPrice = parseFloat(HighPrice) || 0;
    const lowPrice = parseFloat(LowPrice) || 0;
    const closePrice = parseFloat(ClosePrice) || 0;
    const volume = parseInt(Volume, 10) || 0;
    const premarketVolume = parseInt(PremarketVolume, 10) || 0;
    const floatVal = parseInt(Float, 10) || 0;
    const marketCap = parseFloat(MarketCap) || 0;
    const gapPercent = parseFloat(GAPPercent) || 0;
    const shortSqueeze = parseInt(ShortSqueeze, 10) || 0;


    const { priceBeforeGap, gapHighPricePercent, volumeToPremarketRatio, estimate50, estimate70 } =
      calculateValues(openPrice, highPrice, gapPercent, closePrice, volume, premarketVolume);

    const query = `
      UPDATE StockData SET
        Symbol = ?, Exchange = ?, OpenPrice = ?, HighPrice = ?, LowPrice = ?, ClosePrice = ?, Volume = ?, Date = ?,
        PremarketVolume = ?, Float = ?, MarketCap = ?, GAPPercent = ?, VolumeToPremarketRatio = ?, Sector = ?,
        ShortSqueeze = ?, PriceBeforeGap = ?, EstimatePriceCover50 = ?, EstimatePriceCover70 = ?,
        GapHighPricePercent = ?, ImageUrl = ?, DesImageUrl = ?, VolumeSizeIn = ?
      WHERE ID = ?
    `;

 
    const params = [
      Symbol, Exchange, openPrice, highPrice, lowPrice, closePrice, volume, Date,
      premarketVolume, floatVal, marketCap, gapPercent, volumeToPremarketRatio, Sector,
      shortSqueeze, priceBeforeGap, estimate50, estimate70,
      gapHighPricePercent, ImageUrl, DesImageUrl, VolumeSizeIn, id
    ];

    pool.query(query, params, (err, result) => {
      if (err) {
        console.error('SQL error', err);
        res.status(500).send({ message: 'Error updating data', error: err.message || err });
      } else {
        if (result.affectedRows === 0) {
          res.status(404).send({ message: 'Record not found' });
        } else {
          res.status(200).send({ message: 'Stock data updated successfully!' });
        }
      }
    });

  } catch (err) {
    console.error('SQL error', err);
    res.status(500).send({ message: 'Error updating data', error: err.message || err });
  }
});


module.exports = router;
