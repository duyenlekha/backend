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


router.post('/insert', upload.single('image'), async (req, res) => {
  try {
    const pool = await poolPromise;
    const { ShortType, Symbol, Date, Float, MarketCap, Description, ImageUrl, Gap, PL, 
      EstimateVolumePercentage, PriceOpenPercentage,
      OpenPrice, HighPrice, NeutralizeArea, PreMarketVolume, 
      OpenHourVolume, DollarBlock, Short } = req.body;

    const query = `
      INSERT INTO StockData2025 (
        ShortType, Symbol, Date, Float, MarketCap, Description, ImageUrl, Gap, PL,  
        EstimateVolumePercentage, PriceOpenPercentage,
        OpenPrice, HighPrice, NeutralizeArea, PreMarketVolume, 
        OpenHourVolume, DollarBlock, Short
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `;
    const params = [
      ShortType, Symbol, Date, Float, MarketCap, Description, ImageUrl, Gap, PL, 
      EstimateVolumePercentage, PriceOpenPercentage,
      OpenPrice, HighPrice, NeutralizeArea, PreMarketVolume, 
      OpenHourVolume, DollarBlock, Short
    ];

    pool.query(query, params, (err, result) => {
      if (err) {
        console.error('SQL error', err);
        res.status(500).send({ message: 'Error inserting data', error: err.message || err });
      } else {
        res.status(200).send({ message: 'Data inserted successfully!' });
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
    const { ShortType, Symbol, Date, Float, MarketCap, Description, ImageUrl, Gap, PL, 
      EstimateVolumePercentage, PriceOpenPercentage,
      OpenPrice, HighPrice, NeutralizeArea, PreMarketVolume, 
      OpenHourVolume, DollarBlock, Short } = req.body;

    const query = `
      UPDATE StockData2025 SET
        ShortType = ?, Symbol = ?, Date = ?, Float = ?, MarketCap = ?, Description = ?, ImageUrl = ?, Gap = ?, 
        PL = ?, EstimateVolumePercentage = ?, PriceOpenPercentage = ?,
        OpenPrice = ?, HighPrice = ?, NeutralizeArea = ?, PreMarketVolume = ?, 
        OpenHourVolume = ?, DollarBlock = ?, Short = ?
      WHERE Id = ?
    `;
    const params = [
      ShortType, Symbol, Date, Float, MarketCap, Description, ImageUrl, Gap, PL, 
      EstimateVolumePercentage, PriceOpenPercentage,
      OpenPrice, HighPrice, NeutralizeArea, PreMarketVolume, 
      OpenHourVolume, DollarBlock, Short, id
    ];

    pool.query(query, params, (err, result) => {
      if (err) {
        console.error('SQL error', err);
        res.status(500).send({ message: 'Error updating data', error: err.message || err });
      } else {
        if (result.affectedRows === 0) {
          res.status(404).send({ message: 'Record not found' });
        } else {
          res.status(200).send({ message: 'Data updated successfully!' });
        }
      }
    });

  } catch (err) {
    console.error('SQL error', err);
    res.status(500).send({ message: 'Error updating data', error: err.message || err });
  }
});

module.exports = router;