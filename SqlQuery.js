const express = require('express');
const { sql, poolPromise } = require('./db');
const router = express.Router();

router.get('/get', async (req, res) => {
  try {
    const pool = await poolPromise;
    const filters = req.query;

    let query = 'SELECT * FROM FinancialData';
    let conditions = [];


    const filterableFields = [
      'OpenPrice', 'HighPrice', 'LowPrice', 'ClosePrice', 'Volumn',
      'PremarketVolum', 'OutstandingShare', 'MarketCap', 'Float',
      'ResistanceVolume1', 'ResistanceVolume2', 'ResistanceVolume3', 'ResistanceVolume4',
      'ResistancePrice1', 'ResistancePrice2', 'ResistancePrice3', 'ResistancePrice4'
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
    const result = await pool.query(query);

    res.status(200).json(result.recordset);
  } catch (err) {
    console.error('SQL error', err);
    res.status(500).send({ message: 'Error fetching data', error: err.message });
  }
});

module.exports = router;