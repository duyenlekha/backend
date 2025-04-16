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

    let query = `
      SELECT * FROM StockData2025
    `;
    let conditions = [];


    const filterableFields = [
      'MarketCap', 'Float', 'PreMarketVolume', 'OpenHourVolume', 
      'OpenPrice', 'HighPrice', 'NeutralizeArea', 
      'DollarBlock', 'Gap', 'EstimateVolumePercentage', 
      'PriceOpenPercentage', 'PL'
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