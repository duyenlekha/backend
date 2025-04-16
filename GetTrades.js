const express = require('express');
const { sql, poolPromise } = require('./db');
const path = require('path');
const router = express.Router();

// Serve static files for images
router.use('/images', express.static(path.join(__dirname, 'public', 'images')));

// Utility function to format dates in UTC
function formatDate(date) {
  if (!date) return null;
  const d = new Date(date);
  return d.toISOString().split('T')[0]; // Convert to YYYY-MM-DD
}

// Fetch trade data with dynamic filters
router.get('/get', async (req, res) => {
  try {
    const pool = await poolPromise;
    const filters = req.query;

    let query = `SELECT * FROM Trades`;
    let conditions = [];

    // Fields that can be filtered
    const filterableFields = [
      'Shares', 'InAvg', 'OutAvg', 'PL', 'Percentage', 'NetGainLoss'
    ];

    // Process filters dynamically
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
        console.warn('No data found in Trades table');
        return res.status(404).send({ message: 'No data found' });
      }

      // Map the result data, formatting dates and handling missing fields
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
