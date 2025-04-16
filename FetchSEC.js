// const axios = require('axios');
// const nodemailer = require('nodemailer');
// const { sql, poolPromise } = require('./db');
// const TICKERS_URL = 'https://www.sec.gov/files/company_tickers.json';
// const SEC_API_BASE_URL = 'https://data.sec.gov/submissions/';
// const headers = {
//   'User-Agent': 'MyTradingApp/1.0 (duyenlekha@gmail.com)',
//   'Accept-Encoding': 'gzip, deflate, br',
//   'Accept': 'application/json',
//   'Connection': 'keep-alive',
// };

// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: 'getdataandsendemail1997@gmail.com', 
//     pass: 'nqfgdexfbcrflgiz', 
//   },
// });


// function padCIK(cik) {
//   const cikString = String(cik);
//   return ('0000000000' + cikString).slice(-10);
// }


// function isTodayOrYesterday(dateString) {
//   const filingDate = new Date(dateString);
//   const today = new Date();
//   const yesterday = new Date(today);
//   yesterday.setDate(today.getDate() - 1);

//   return (
//     filingDate.toDateString() === today.toDateString() ||
//     filingDate.toDateString() === yesterday.toDateString()
//   );
// }

// const formsAffectingStockPrice = [
//   '8-K',
//   '10-K',
//   '10-K/A',
//   '10-Q',
//   '424B2',
//   '6-K',
//   'SD',
//   'SC 13D/A',
//   'FWP',
//   'S-3/A',
//   'SC 13G'
// ];

// async function fetchTickersWithRecentFilings() {
//   console.log('Fetching tickers data...');
//   const tickersWithRecentFilings = [];

//   try {
    
//     const tickersResponse = await axios.get(TICKERS_URL, { headers });
//     const tickersData = tickersResponse.data;
   
//     console.log(`Fetched ${Object.keys(tickersData).length} tickers.`);



   
//     for (const key in tickersData) {
//       if (tickersData.hasOwnProperty(key)) {
//         const { cik_str, ticker } = tickersData[key];
//         const paddedCIK = padCIK(cik_str);
//         const url = `${SEC_API_BASE_URL}CIK${paddedCIK}.json`;

//         try {
          
//           const response = await axios.get(url, { headers });
//           const filingsData = response.data;

          
//           if (filingsData.filings && filingsData.filings.recent && filingsData.exchanges &&
//             Array.isArray(filingsData.exchanges) && 
//             filingsData.exchanges.some(
//               (exchange) =>
//                 exchange !== null && 
//                 typeof exchange === 'string' &&
//                 exchange.toLowerCase() === 'nasdaq' 
//             )) {
//             const filingDates = filingsData.filings.recent.filingDate;
//             const filingForms = filingsData.filings.recent.form;

           
//             if (filingDates.length > 0 && isTodayOrYesterday(filingDates[0])) {
              

             
//               filingDates.slice(0, 10).forEach((filingDate, index) => {
//                 if (isTodayOrYesterday(filingDate) && formsAffectingStockPrice.includes(filingForms[index])) {
//                   tickersWithRecentFilings.push({
//                     ticker: ticker,
//                     filingDate: filingDate,
//                     form: filingForms[index], 
//                     cik: paddedCIK,
//                   });
//                   console.log(
//                     `Ticker: ${ticker}, Filing Date: ${filingDate}, Form: ${filingForms[index]}`
//                   );
//                 }
//               });
//             } 
//           } else {
            
//           }
//         } catch (error) {
//           console.error(`Failed to fetch data for CIK${paddedCIK}:`, error.message);
//         }
//       }
//     }

   
//     if (tickersWithRecentFilings.length > 0) {
//       await insertRecentFilings(tickersWithRecentFilings);
//       sendEmail(tickersWithRecentFilings);
//     } else {
      
      
//     }
//   } catch (error) {
//     console.error('Failed to fetch tickers data:', error.message);
//   }
// }




// async function insertRecentFilings(tickersWithRecentFilings) {
//   try {

//     const pool = await poolPromise;

//     console.log(tickersWithRecentFilings)
    

//     for (const ticker of tickersWithRecentFilings) {

//       console.log(ticker)

//       const query = `
//       INSERT INTO SECTable (Ticker, FilingDate, Form, CIK) VALUES (
//         ?, ?, ?, ?
//       )
//     `;

//     const params = [
//       ticker.ticker, ticker.filingDate, ticker.form, ticker.cik
//     ];

//     pool.query(query, params, (err, result) => {
//       if (err) {
//         console.error('SQL error', err);
       
//       } else {
//         console.error('Data inserted successfully!', err);
//       }
//     });



      
//     }

//     console.log('All filings inserted successfully!');
//   } catch (err) {
//     console.error('SQL error', err);
//   } 
// }

// async function deleteOldFilings() {
//   try {
//     const pool = await poolPromise;
//     // Get the date 2 days ago
//     const twoDaysAgo = new Date();
//     twoDaysAgo.setDate(twoDaysAgo.getDate() - 3);
//     const formattedDate = twoDaysAgo.toISOString().split('T')[0]; // Format to YYYY-MM-DD

//     const deleteQuery = `
//       DELETE FROM SECTable WHERE FilingDate = ?
//     `;

//     pool.query(deleteQuery, [formattedDate], (err, result) => {
//       if (err) {
//         console.error('SQL error during delete', err);
//       } else {
//         console.log(`Records with FilingDate ${formattedDate} deleted successfully!`);
//       }
//     });
//   } catch (err) {
//     console.error('SQL error', err);
//   }
// }



// function sendEmail(tickers) {
//   const emailBody = tickers
//     .map(
//       (ticker) =>
//         `Ticker: ${ticker.ticker}, Filing Date: ${ticker.filingDate}, Form: ${ticker.form}, CIK: ${ticker.cik}`
//     )
//     .join('\n');

//   const mailOptions = {
//     from: 'getdataandsendemail1997@gmail.com', 
//     to: 'duyenlekha1711@gmail.com',
//     subject: 'Recent SEC Filings for Today or Yesterday',
//     text: `Here are the tickers with recent filings:\n\n${emailBody}`,
//   };

//   transporter.sendMail(mailOptions, (error, info) => {
//     if (error) {
//       console.error('Error sending email:', error);
//     } else {
//       console.log('Email sent successfully:', info.response);
//     }
//   });
// }


// setInterval(fetchTickersWithRecentFilings, 7200000);

// deleteOldFilings();
// fetchTickersWithRecentFilings();






const axios = require('axios');
const nodemailer = require('nodemailer');
const { sql, poolPromise } = require('./db');
const TICKERS_URL = 'https://www.sec.gov/files/company_tickers.json';
const SEC_API_BASE_URL = 'https://data.sec.gov/submissions/';
const headers = {
  'User-Agent': 'MyTradingApp/1.0 (duyenlekha@gmail.com)',
  'Accept-Encoding': 'gzip, deflate, br',
  Accept: 'application/json',
  Connection: 'keep-alive',
};


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'getdataandsendemail1997@gmail.com', 
    pass: 'nqfgdexfbcrflgiz', 
  },
});


function padCIK(cik) {
  const cikString = String(cik);
  return ('0000000000' + cikString).slice(-10);
}


function isTodayOrYesterday(dateString) {
  const filingDate = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  return (
    filingDate.toDateString() === today.toDateString() ||
    filingDate.toDateString() === yesterday.toDateString()
  );
}

const formsAffectingStockPrice = [
  '8-K',
  '10-K',
  '10-K/A',
  '10-Q',
  '424B2',
  '6-K',
  'SD',
  'SC 13D/A',
  'FWP',
  'S-3/A',
  'SC 13G',
];


async function fetchTickersWithRecentFilings() {
  console.log('Fetching tickers data...');
  const tickersWithRecentFilings = [];

  try {
    const tickersResponse = await axios.get(TICKERS_URL, { headers });
    const tickersData = tickersResponse.data;

    console.log(`Fetched ${Object.keys(tickersData).length} tickers.`);

    for (const key in tickersData) {
      if (tickersData.hasOwnProperty(key)) {
        const { cik_str, ticker } = tickersData[key];
        const paddedCIK = padCIK(cik_str);
        const url = `${SEC_API_BASE_URL}CIK${paddedCIK}.json`;

        try {
          const response = await axios.get(url, { headers });
          const filingsData = response.data;

          if (
            filingsData.filings &&
            filingsData.filings.recent &&
            filingsData.exchanges &&
            Array.isArray(filingsData.exchanges) &&
            filingsData.exchanges.some(
              (exchange) =>
                exchange !== null &&
                typeof exchange === 'string' &&
                exchange.toLowerCase() === 'nasdaq'
            )
          ) {
            const filingDates = filingsData.filings.recent.filingDate;
            const filingForms = filingsData.filings.recent.form;

            if (filingDates.length > 0 && isTodayOrYesterday(filingDates[0])) {
              filingDates.forEach((filingDate, index) => {
                if (
                  isTodayOrYesterday(filingDate) &&
                  formsAffectingStockPrice.includes(filingForms[index])
                ) {
                  tickersWithRecentFilings.push({
                    ticker: ticker,
                    filingDate: filingDate,
                    form: filingForms[index],
                    cik: paddedCIK,
                  });
                  console.log(
                    `Ticker: ${ticker}, Filing Date: ${filingDate}, Form: ${filingForms[index]}`
                  );
                }
              });
            }
          }
        } catch (error) {
          console.error(`Failed to fetch data for CIK${paddedCIK}:`, error.message);
        }
      }
    }

    
    const newFilings = await filterExistingFilings(tickersWithRecentFilings);

 
    if (newFilings.length > 0) {
      await sendEmail(newFilings);
      await insertRecentFilings(newFilings); 
      await deleteOldFilings();
    } else {
      console.log('No new filings to process.');
    }
  } catch (error) {
    console.error('Failed to fetch tickers data:', error.message);
  }
}


async function filterExistingFilings(tickersWithRecentFilings) {


  const pool = await poolPromise;
  const newFilings = [];

  for (const filing of tickersWithRecentFilings) {
    try {
      const query = `
        SELECT COUNT(*) AS count FROM SECTable 
        WHERE Ticker = ? AND FilingDate = ?
      `;
      const params = [filing.ticker, filing.filingDate];

     
      const result = await new Promise((resolve, reject) => {
        pool.query(query, params, (err, result) => {
          if (err) {
            console.error('SQL error during query', err);
            reject(err);
          } else {
            resolve(result);
          }
        });
      });


      const count = result[0]?.count || 0;

      


      if (count === 0) {
        newFilings.push(filing);
      }
    } catch (err) {
      console.error('SQL error while checking for existing filings', err);
    }
  }

  return newFilings;





  
}


async function insertRecentFilings(tickersWithRecentFilings) {
  try {
    const pool = await poolPromise;

    for (const ticker of tickersWithRecentFilings) {
      const query = `
        INSERT INTO SECTable (Ticker, FilingDate, Form, CIK) VALUES (?, ?, ?, ?)
      `;
      const params = [ticker.ticker, ticker.filingDate, ticker.form, ticker.cik];

      pool.query(query, params, (err, result) => {
        if (err) {
          console.error('SQL error during insert', err);
        } else {
          console.log('Data inserted successfully!');
        }
      });
    }

    console.log('All filings inserted successfully!');
  } catch (err) {
    console.error('SQL error during insertion', err);
  }
}


async function deleteOldFilings() {
  try {
    const pool = await poolPromise;
   
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const formattedDate = threeDaysAgo.toISOString().split('T')[0]; 

    const deleteQuery = `
      DELETE FROM SECTable WHERE FilingDate = ?
    `;

    pool.query(deleteQuery, [formattedDate], (err, result) => {
      if (err) {
        console.error('SQL error during delete', err);
      } else {
        console.log(`Records with FilingDate ${formattedDate} deleted successfully!`);
      }
    });
  } catch (err) {
    console.error('SQL error', err);
  }
}


function sendEmail(tickers) {
  const emailBody = tickers
    .map(
      (ticker) =>
        `Ticker: ${ticker.ticker}, Filing Date: ${ticker.filingDate}, Form: ${ticker.form}, CIK: ${ticker.cik}`
    )
    .join('\n');

  const mailOptions = {
        from: 'getdataandsendemail1997@gmail.com', 
    to: 'duyenlekha1711@gmail.com',
    subject: 'Recent SEC Filings for Today or Yesterday',
    text: `Here are the tickers with recent filings:\n\n${emailBody}`,
  };

  transporter.sendMail(mailOptions, async (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
    } else {
      console.log('Email sent successfully:', info.response);

      await fetchTickersWithRecentFilings();
    }
  });
}



