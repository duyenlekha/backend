const express = require('express');
const { sql, poolPromise } = require('./db');
const path = require('path');
const router = express.Router();


router.use('/images', express.static(path.join(__dirname, 'public', 'images')));


function formatDate(date) {
  if (!date) return null;
  const d = new Date(date);
  return d.toISOString().split('T')[0]; 
}


router.get('/get/:id', async (req, res) => {
  try {
    const pool = await poolPromise;
    const { id } = req.params;  

    console.log("Fetching trade data for ID:", id);

    const query = `SELECT * FROM Trades WHERE TradeID = ?`;
    const params = [id];

    pool.query(query, params, (err, result) => {
      if (err) {
        console.error('SQL error:', err);
        return res.status(500).send({ message: 'Error fetching data', error: err.message || err });
      }

      if (!result || !result.length) {
        console.warn('No data found in Trades table');
        return res.status(404).send({ message: 'No data found' });
      }

   
      const formattedData = result.map(item => ({
        TradeID: item.TradeID,
        Symbol: item.Symbol || '',
        Exchange: item.Exchange || '',
        Sector: item.Sector || '',
        TradeDate: formatDate(item.TradeDate),
        Position: item.Position || '',
        Shares: item.Shares || 0,
        InAvg: item.InAvg || 0,
        OutAvg: item.OutAvg || 0,
        PL: item.PL || 0,
        LocateFee: item.LocateFee || 0,
        Percentage: item.Percentage || 0,
        NetGainLoss: item.NetGainLoss || 0,
        Setup: item.Setup || '',
        Description: item.Description || '',
        ImageUrl: item.ImageUrl || ''
      }));

      res.status(200).json(formattedData);
    });

  } catch (err) {
    console.error('SQL error:', err);
    res.status(500).send({ message: 'Error fetching data', error: err.message });
  }
});

module.exports = router;