const express = require('express');
const { poolPromise } = require('./db'); 
const axios = require('axios');
const { format, subDays, addDays } = require('date-fns');

const router = express.Router();

const API_KEY = 'GC6WS6C7z33Dny1Dqtalur9jXjoVjgF3';
const FLOAT_API_URL = 'https://financialmodelingprep.com/api/v4/historical/shares_float';
const MARKETCAP_API_URL = 'https://financialmodelingprep.com/api/v3/historical-market-capitalization';

const fetchDataForRangeDays = async (symbol, formattedDate, apiUrl, apiKey, range = 10) => {
  let foundData = null;
 
  for (let i = 0; i < range; i++) {
    const previousDate = subDays(new Date(formattedDate), i);
    const previousDateString = format(previousDate, 'yyyy-MM-dd');
    console.log(`No data for ${symbol} on ${formattedDate}. Trying for day ${previousDateString} (backwards)`);

    try {
      const apiResponse = await axios.get(`${apiUrl}?symbol=${symbol}&apikey=${apiKey}`);
      foundData = apiResponse.data.find(item => item.date === previousDateString);
      
      if (foundData) {
        console.log(`Found data for ${symbol} on ${previousDateString}`);
        break;
      }
    } catch (error) {
      console.error(`Error fetching data for ${symbol} on ${previousDateString}:`, error.message || error);
    }
  }

  if (!foundData) {
    for (let i = 1; i <= range; i++) {
      const nextDate = addDays(new Date(formattedDate), i); 
      const nextDateString = format(nextDate, 'yyyy-MM-dd');
      console.log(`No data for ${symbol} on ${formattedDate}. Trying for day ${nextDateString} (forwards)`);

      try {
        const apiResponse = await axios.get(`${apiUrl}?symbol=${symbol}&apikey=${apiKey}`);
        foundData = apiResponse.data.find(item => item.date === nextDateString);
        
        if (foundData) {
          console.log(`Found data for ${symbol} on ${nextDateString}`);
          break; 
        }
      } catch (error) {
        console.error(`Error fetching data for ${symbol} on ${nextDateString}:`, error.message || error);
      }
    }
  }

  return foundData;
};


const fetchDataForRangeDaysMarketCap = async (symbol, formattedDate, apiUrl, apiKey, range = 20) => {
  let foundData = null;
 
  for (let i = 0; i < range; i++) {
    const previousDate = subDays(new Date(formattedDate), i); // Subtract i days
    const previousDateString = format(previousDate, 'yyyy-MM-dd');
    console.log(`No data for ${symbol} on ${formattedDate}. Trying for day ${previousDateString} (backwards)`);
    const fromDate = format(subDays(formattedDate, 40), 'yyyy-MM-dd');

    const toDate = format(addDays(formattedDate, 40), 'yyyy-MM-dd');

    try {
      const apiResponse = await axios.get(`${apiUrl}/${symbol}?limit=100&from=${fromDate}&to=${toDate}&apikey=${apiKey}`);
      foundData = apiResponse.data.find(item => item.date === previousDateString);
      
      if (foundData) {
        console.log(`Found data for ${symbol} on ${previousDateString}`);
        break; 
      }
    } catch (error) {
      console.error(`Error fetching data for ${symbol} on ${previousDateString}:`, error.message || error);
    }
  }


  if (!foundData) {
    for (let i = 1; i <= range; i++) {
      const nextDate = addDays(new Date(formattedDate), i); 
      const nextDateString = format(nextDate, 'yyyy-MM-dd');
      console.log(`No data for ${symbol} on ${formattedDate}. Trying for day ${nextDateString} (forwards)`);

      try {
        const apiResponse = await axios.get(`${apiUrl}/${symbol}?limit=100&from=${fromDate}&to=${toDate}&apikey=${apiKey}`);
        foundData = apiResponse.data.find(item => item.date === nextDateString);
        
        if (foundData) {
          console.log(`Found data for ${symbol} on ${nextDateString}`);
          break; 
        }
      } catch (error) {
        console.error(`Error fetching data for ${symbol} on ${nextDateString}:`, error.message || error);
      }
    }
  }

  return foundData;
};

router.get('/updateMarketData', async (req, res) => {
  try {
    const pool = await poolPromise;

    console.log('Starting to fetch data from the database...');
    const query = 'SELECT Id, Symbol, Date FROM GapData';
    pool.query(query, async (err, result) => {
      if (err) {
        console.error('SQL error:', err);
        return res.status(500).send({ message: 'Error fetching data', error: err.message || err });
      }

      if (!result || !result.length) {
        console.warn('No data found in GapData table');
        return res.status(404).send({ message: 'No data found' });
      }

      console.log(`Fetched ${result.length} rows from the database`);

      for (const row of result) {
        const { Id, Symbol, Date } = row;
        console.log(`Processing Id: ${Id}, Symbol: ${Symbol}, Date: ${Date}`);
        const formattDate = format(Date, 'yyyy-MM-dd');
        const formattedDate = format(addDays(formattDate, 2), 'yyyy-MM-dd');

        try {
        
          console.log(`Calling Float Shares API for symbol: ${Symbol}`);
          const floatApiResponse = await axios.get(`${FLOAT_API_URL}?symbol=${Symbol}&apikey=${API_KEY}`);
          let floatData = floatApiResponse.data.find(item => item.date === formattedDate);

          if (!floatData) {
            floatData = await fetchDataForRangeDays(Symbol, formattedDate, FLOAT_API_URL, API_KEY, 10);
          }

          let floatShares = null;
          if (floatData) {
            floatShares = floatData.floatShares;
            console.log(`Float Shares found for ${Symbol} on ${formattedDate}: ${floatShares}`);
          } else {
            console.log(`No Float Shares data for ${Symbol} on ${formattedDate}`);
          }

       
          console.log(`Calling Market Cap API for symbol: ${Symbol}`);
          const fromDate = format(subDays(formattedDate, 40), 'yyyy-MM-dd');
          const toDate = format(addDays(formattedDate, 40), 'yyyy-MM-dd');

          const marketCapApiResponse = await axios.get(`${MARKETCAP_API_URL}/${Symbol}?limit=100&from=${fromDate}&to=${toDate}&apikey=${API_KEY}`);
          let marketCapData = marketCapApiResponse.data.find(item => item.date === formattedDate);

          if (!marketCapData) {
            marketCapData = await fetchDataForRangeDaysMarketCap(Symbol, formattedDate, MARKETCAP_API_URL, API_KEY, 20);
          }

          let marketCap = null;
          if (marketCapData) {
            marketCap = marketCapData.marketCap;
            console.log(`Market Cap found for ${Symbol} on ${formattedDate}: ${marketCap}`);
          } else {
            console.log(`No Market Cap data for ${Symbol} on ${formattedDate}`);
          }

        
          if (floatShares || marketCap) {
            const updateQuery = 
              `UPDATE GapData 
              SET Float = ?, MarketCap = ? 
              WHERE Id = ?`;

            await pool.query(updateQuery, [floatShares, marketCap, Id]);
            console.log(`Updated GapData for Id ${Id}`);
          } else {
            console.log(`No updates required for Id ${Id}`);
          }
        } catch (apiError) {
          console.error(`Error processing Id ${Id} on ${formattedDate}:`, apiError.message || apiError);
        }
      }

      console.log('Market data update process completed successfully');
      res.status(200).send('Market data updated successfully');
    });
  } catch (error) {
    console.error('Error updating market data:', error);
    res.status(500).send({ message: 'Error updating market data', error: error.message });
  }
});

module.exports = router;





