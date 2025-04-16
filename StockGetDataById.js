










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
    const filters = req.query;
    const { id } = req.params; 

    console.log("ee", id)

    let query = `
      SELECT * FROM StockData2025 WHERE Id = ?
    `;
    const params = [
         id
    ];

    
    

    pool.query(query, params, (err, result) => {
      if (err) {
        console.error('SQL error', err);
        return res.status(500).send({ message: 'Error fetching data', error: err.message || err });
      }

      if (!result || !result.length) {
        console.warn('No data found in StockData2025 table');
        return res.status(404).send({ message: 'No data found' });
      }

     
      const formattedData = result.map(item => ({
        Id: item.Id,
        ShortType: item.ShortType || '',
        Symbol: item.Symbol || '',
        Date: formatDate(item.Date), 
        MarketCap: item.MarketCap || 0,
        Float: item.Float || 0,
        PreMarketVolume: item.PreMarketVolume || 0,
        OpenHourVolume: item.OpenHourVolume || 0,
        OpenPrice: item.OpenPrice || 0,
        HighPrice: item.HighPrice || 0,
        NeutralizeArea: item.NeutralizeArea || 0,
        DollarBlock: item.DollarBlock || 0,
        Description: item.Description || '',
        ImageUrl: item.ImageUrl || '',
        Gap: item.Gap || 0,
        EstimateVolumePercentage: item.EstimateVolumePercentage || 0,
        PriceOpenPercentage: item.PriceOpenPercentage || 0,
        PL: item.PL || 0,
        Short: item.Short === true ? 1 : 0,
      }));

      res.status(200).json(formattedData);
    });
  } catch (err) {
    console.error('SQL error', err);
    res.status(500).send({ message: 'Error fetching data', error: err.message });
  }
});

module.exports = router;