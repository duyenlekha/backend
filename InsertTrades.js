const express = require('express');
const { sql, poolPromise } = require('./db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Configure multer for image upload
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

// Function to calculate percentage and net gain/loss
function calculateTradeValues(inAvg, outAvg, shares, position) {
  if (!inAvg || !outAvg || !shares) return { percentage: 0, netGainLoss: 0 };

  // Calculate percentage gain/loss
  const percentage = parseFloat((((outAvg - inAvg) / inAvg) * 100 * (position === 'Short' ? -1 : 1)).toFixed(2));

  // Calculate net gain/loss
  const netGainLoss = parseFloat(((outAvg - inAvg) * shares * (position === 'Short' ? -1 : 1)).toFixed(2));

  return { percentage, netGainLoss };
}

// Route to insert new trade data
router.post('/insert', upload.single('ImageUrl'), async (req, res) => {
  try {
    const pool = await poolPromise;
    const { Symbol, Exchange, Sector, TradeDate, Position, Shares, InAvg, OutAvg, PL, LocateFee, Setup, Description, ImageUrl} = req.body;

    const { percentage, netGainLoss } = calculateTradeValues(InAvg, OutAvg, Shares, Position);


    const query = `
      INSERT INTO Trades (
        Symbol, Exchange, Sector, TradeDate, Position, Shares, InAvg, OutAvg, PL, LocateFee, 
        Percentage, NetGainLoss, Setup, Description, ImageUrl
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      Symbol, Exchange, Sector, TradeDate, Position, Shares, InAvg, OutAvg, PL, LocateFee,
      percentage, netGainLoss, Setup, Description, ImageUrl
    ];

    pool.query(query, params, (err, result) => {
      if (err) {
        console.error('SQL error', err);
        res.status(500).send({ message: 'Error inserting data', error: err.message || err });
      } else {
        res.status(200).send({ message: 'Trade data inserted successfully!' });
      }
    });
  } catch (err) {
    console.error('SQL error', err);
    res.status(500).send({ message: 'Error inserting data', error: err.message || err });
  }
});


router.put('/update/:id', upload.single('ImageUrl'), async (req, res) => {
  try {
    const pool = await poolPromise;
    const { id } = req.params;
    const { Symbol, Exchange, Sector, TradeDate, Position, Shares, InAvg, OutAvg, PL, LocateFee, Setup, Description, ImageUrl } = req.body;

    const { percentage, netGainLoss } = calculateTradeValues(InAvg, OutAvg, Shares, Position);


    const query = `
      UPDATE Trades SET
        Symbol = ?, Exchange = ?, Sector = ?, TradeDate = ?, Position = ?, Shares = ?, 
        InAvg = ?, OutAvg = ?, PL = ?, LocateFee = ?,  Percentage = ?, NetGainLoss = ?, Setup = ?, Description = ?, ImageUrl = ?
      WHERE TradeID = ?
    `;
    const params = [
      Symbol, Exchange, Sector, TradeDate, Position, Shares, InAvg, OutAvg, PL, LocateFee,
      percentage, netGainLoss, Setup, Description, ImageUrl, id
    ];

    pool.query(query, params, (err, result) => {
      if (err) {
        console.error('SQL error', err);
        res.status(500).send({ message: 'Error updating data', error: err.message || err });
      } else {
        if (result.affectedRows === 0) {
          res.status(404).send({ message: 'Record not found' });
        } else {
          res.status(200).send({ message: 'Trade data updated successfully!' });
        }
      }
    });
  } catch (err) {
    console.error('SQL error', err);
    res.status(500).send({ message: 'Error updating data', error: err.message || err });
  }
});

module.exports = router;
