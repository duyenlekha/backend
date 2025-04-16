const express = require('express');
const { sql, poolPromise } = require('./db');
const router = express.Router();

const axios = require('axios');
const fs = require('fs');


const TICKERS_URL = 'https://www.sec.gov/files/company_tickers.json';
const SEC_API_BASE_URL = 'https://data.sec.gov/submissions/';

const headers = {
    'User-Agent': 'MyTradingApp/1.0 (duyenlekha@gmail.com)',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept': 'application/json',
    'Connection': 'keep-alive',
};



async function fetchCompanyTickers() {
    try {
        const response = await axios.get(TICKERS_URL, { headers });
        return response.data;
    } catch (error) {
        console.error('Error fetching company tickers:', error.message);
        return null;
    }
}


function getCIKForTicker(tickersData, ticker) {
    const company = Object.values(tickersData).find(
        (item) => item.ticker.toUpperCase() === ticker.toUpperCase()
    );

    if (company) {
        return padCIK(company.cik_str);
    }

    return null;
}

function padCIK(cik) {
    const cikString = String(cik);
    return ('0000000000' + cikString).slice(-10);
}


async function calculateSharesFloat(cik, specificDate, outstandingShares, id) {
    try {
        const url = `${SEC_API_BASE_URL}CIK${cik}.json`;

        console.log("url:", url)
        const response = await axios.get(url, { headers });
        const filingsData = response.data;



   
        const float = await findFirst10QAfterIndex(filingsData, specificDate, outstandingShares, id);

    
        console.log(`Shares Float: ${float}`);

    

        return float;

    } catch (error) {
        console.error('Error calculating shares float:', error.message);
        return null;
    }
}

function findClosestEarlierDateIndex(dates, targetDate) {
    const target = new Date(targetDate);
    let closestIndex = -1;
    let closestDate = null;
    let minDiff = Infinity;

    for (let i = 0; i < dates.length; i++) {
        const date = new Date(dates[i]);
        const diff = target - date;

        if (diff > 0 && diff < minDiff) {
            closestIndex = i;
            closestDate = dates[i];
            minDiff = diff;
        }
    }

    return closestIndex;
}



function formatDate(date) {
    if (!date) return null;
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
}

async function findFirst10QAfterIndex(filingsData, specificDate, outstandingShares, id) {
    try {
        const startIndex = findClosestEarlierDateIndex(filingsData.filings.recent.filingDate, specificDate);

        console.log(specificDate, "date");
        const recentFilings = filingsData.filings.recent;

        if (!recentFilings || !recentFilings.form || !Array.isArray(recentFilings.form)) {
            console.log('No recent filings found or incorrect data format.');
            return -1;
        }

        for (let i = startIndex + 1; i < recentFilings.form.length; i++) {
            const form = recentFilings.form[i];

            console.log(startIndex, "startIndex")

            if (form.includes('10-Q') || form.includes('20-F') || form.includes('10-K')) {
                let sum = 0;
            
                for (let j = startIndex + 1; j < i; j++) {
                    if (
                        recentFilings.form[j] === '4' || 
                        recentFilings.form[j] === 'FORM 4' ||
                        recentFilings.form[j] === 'FORM 3' ||
                        recentFilings.form[j] === '3' ||
                        recentFilings.form[j] === '5' ||
                        recentFilings.form[j] === 'FORM 4' ||
                        recentFilings.form[j] === '144' || 
                        recentFilings.form[j] === 'FORM 144' ||
                        recentFilings.form[j].includes('13G') 
                    ) {
                        sum += recentFilings.size[j]; 
                    }
                }
            
                const adjustedOutstandingShares = outstandingShares - sum;
                console.log("Found 10-Q at index", i, "Sum of sizes:", sum);
            
                await updateOutstandingSharesInDB(adjustedOutstandingShares, id);
                return adjustedOutstandingShares;
            }
        }

        console.log('No 10-Q filing found after the given start index.');
        return -1;

    } catch (error) {
        console.error('Error finding 10-Q:', error.message);
        return -1;
    }
}
async function updateOutstandingSharesInDB(adjustedOutstandingShares, id) {
    console.log("yaay", adjustedOutstandingShares);
    console.log("id", id);

    try {
        const pool = await poolPromise; 

        
        const result = await pool.query(`
            UPDATE GapData
            SET Float = ${adjustedOutstandingShares}
            WHERE Id = ${id};
        `);

        if (result.rowsAffected && result.rowsAffected[0] > 0) {
            console.log(`Successfully updated OutstandingShares for ${id}.`);
        } else {
            console.log(`No records updated for ${id}.`);
        }
    } catch (err) {
        console.error('SQL error:', err.message);
    }
}
router.get('/', async (req, res) => {
    try {
        const pool = await poolPromise;
        let query = `SELECT Symbol, Date,  Id
FROM GapData
WHERE Float IS NULL
  AND Date >= '2024-12-01'
  AND Date <= '2024-12-31';`;
        const tickersData = await fetchCompanyTickers();

        pool.query(query, async (err, result) => {
            if (err) {
                console.error('SQL error', err);
                return res.status(500).send({ message: 'Error fetching data', error: err.message || err });
            }

            if (!result || !result.length) {
                console.warn('No data found in GapData table');
                return res.status(404).send({ message: 'No data found' });
            }

            for (const item of result) {
                const cik = getCIKForTicker(tickersData, item.Symbol);
                if (cik) {
                    await calculateSharesFloat(cik, formatDate(item.Date), item.OutstandingShares, item.Id);
                    console.log(`Shares float for ${item.Symbol} on ${formatDate(item.Date)}: ${item.OutstandingShares}`);
                } else {
                    console.log(`CIK not found for ${item.Symbol}`);
                }
            }

            res.status(200).json({ message: 'Float calculations completed.' });
        });
    } catch (err) {
        console.error('SQL error', err);
        res.status(500).send({ message: 'Error fetching data', error: err.message });
    }
});

module.exports = router;