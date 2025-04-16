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


router.get('/get', async (req, res) => {
  try {
    const pool = await poolPromise;
    const filters = req.query;

    let query = `SELECT * FROM StockData`;
    let conditions = [];

 
    const filterableFields = [
      'OpenPrice', 'HighPrice', 'LowPrice', 'ClosePrice', 'Volume',
      'PremarketVolume', 'Float', 'MarketCap', 'GAPPercent',
      'VolumeToPremarketRatio', 'PriceBeforeGap',
      'EstimatePriceCover50', 'EstimatePriceCover70', 'GapHighPricePercent',
      'VolumeSizeIn'
    ];

 
    filterableFields.forEach(field => {
      const value = filters[field] ? parseFloat(filters[field]) : undefined;
      const comparison = filters[`${field}_comparison`];
      const minValue = filters[`min${field}`] ? parseFloat(filters[`min${field}`]) : undefined;
      const maxValue = filters[`max${field}`] ? parseFloat(filters[`max${field}`]) : undefined;

      if (!isNaN(value) && comparison) {
        if (comparison === 'lt') {
          conditions.push(`${field} < ${value}`);
        } else if (comparison === 'gt') {
          conditions.push(`${field} > ${value}`);
        } else if (comparison === 'eq') {
          conditions.push(`${field} = ${value}`);
        }
      }

      if (!isNaN(minValue) && !isNaN(maxValue)) {
        conditions.push(`${field} BETWEEN ${minValue} AND ${maxValue}`);
      } else if (!isNaN(minValue)) {
        conditions.push(`${field} >= ${minValue}`);
      } else if (!isNaN(maxValue)) {
        conditions.push(`${field} <= ${maxValue}`);
      }
    });

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    console.log(`Executing query: ${query}`);

    pool.query(query, (err, result) => {
      if (err) {
        console.error('SQL error', err);
        return res.status(500).send({ message: 'Error fetching data', error: err.message || err });
      }

      if (!result || !result.length) {
        console.warn('No data found in StockData table');
        return res.status(404).send({ message: 'No data found' });
      }

    
      const formattedData = result.map(item => ({
        Id: item.ID,
        Symbol: item.Symbol || '',
        Exchange: item.Exchange || '',
        Date: formatDate(item.Date),
        OpenPrice: item.OpenPrice || 0,
        HighPrice: item.HighPrice || 0,
        LowPrice: item.LowPrice || 0,
        ClosePrice: item.ClosePrice || 0,
        Volume: item.Volume || 0,
        PremarketVolume: item.PremarketVolume || 0,
        Float: item.Float || 0,
        MarketCap: item.MarketCap || 0,
        GAPPercent: item.GAPPercent || 0,
        VolumeToPremarketRatio: item.VolumeToPremarketRatio || 0,
        Sector: item.Sector || '',
        ShortSqueeze: item.ShortSqueeze || 3,
        PriceBeforeGap: item.PriceBeforeGap || 0,
        EstimatePriceCover50: item.EstimatePriceCover50 || 0,
        EstimatePriceCover70: item.EstimatePriceCover70 || 0,
        GapHighPricePercent: item.GapHighPricePercent || 0,
        ImageUrl: item.ImageUrl || '',
        DesImageUrl: item.DesImageUrl || '',
        VolumeSizeIn: item.VolumeSizeIn || 0
      }));

      res.status(200).json(formattedData);
    });

  } catch (err) {
    console.error('SQL error:', err);
    res.status(500).send({ message: 'Error fetching data', error: err.message });
  }
});

module.exports = router;
