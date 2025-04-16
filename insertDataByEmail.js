const Imap = require('imap-simple');
const { poolPromise } = require('./db');


const config = {
  imap: {
    user: 'getdataandsendemail1997@gmail.com',     
    password: 'nqfgdexfbcrflgiz',   
    host: 'imap.gmail.com',            
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false }
  }
};


const targetSubject = "Re: Stock Data Update";


const parseEmailData = (message) => {

  console.log('Raw email body:', message);


  message = message.trim();

  console.log('Parsing email body for data...');
  
  const dataRegex = /\[([a-zA-Z0-9]+),\s*([0-9MK.]+),\s*([0-9MK.]+)\]/g;
  const parsedData = [];
  const uniqueEntries = new Set(); 
  let match;


  while ((match = dataRegex.exec(message)) !== null) {
    let floatValue = match[2];
    let marketCapValue = match[3];
    console.log(`Found data - Ticker: ${match[1]}, Float: ${floatValue}, MarketCap: ${marketCapValue}`);

   
    if (floatValue.endsWith('M')) {
      floatValue = parseFloat(floatValue.replace('M', '')) * 1000000;
    } else if (floatValue.endsWith('K')) {
      floatValue = parseFloat(floatValue.replace('K', '')) * 1000;
    }

    if (marketCapValue.endsWith('M')) {
      marketCapValue = parseFloat(marketCapValue.replace('M', '')) * 1000000;
    } else if (marketCapValue.endsWith('K')) {
      marketCapValue = parseFloat(marketCapValue.replace('K', '')) * 1000;
    }

   
    const key = `${match[1]}-${floatValue}-${marketCapValue}`;
    if (!uniqueEntries.has(key)) {
      uniqueEntries.add(key); 
      parsedData.push({
        ticker: match[1],
        float: floatValue,
        marketCap: marketCapValue
      });
    } else {
      console.log(`Skipping duplicate entry: Ticker=${match[1]}, Float=${floatValue}, MarketCap=${marketCapValue}`);
    }
  }

  console.log('Parsed data:', parsedData);
  return parsedData;
};

const insertDataIntoSQL = async (parsedData) => {
try {
  const pool = await poolPromise;

  for (const { ticker, float, marketCap } of parsedData) {
    const query = `INSERT INTO Short (Symbol, Float, MarketCap, Date) VALUES (?, ?, ?, GETDATE())`;
    const params = [ticker, float, marketCap];

    pool.query(query, params, (err, result) => {
      if (err) {
        console.error('SQL error during insert', err);
      } else {
        console.log('Data inserted successfully!');
      }
    });
  }

} catch (error) {
  console.error('Error inserting data into database:', error);
}
};


const fetchEmails = async () => {
try {
  console.log('Connecting to IMAP server...');
  const connection = await Imap.connect(config);
  await connection.openBox('INBOX');

  console.log('Checking for unread emails...');
  const searchCriteria = ['UNSEEN']; 
  const fetchOptions = {
    bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)', 'TEXT'], 
    markSeen: true,
  };

  const messages = await connection.search(searchCriteria, fetchOptions);
  console.log(`Found ${messages.length} new messages`);

  for (const message of messages) {
   
    const subject = message.parts.filter((part) => part.which === 'HEADER.FIELDS (FROM TO SUBJECT DATE)')[0].body.subject[0];

    console.log(`Email Subject: ${subject}`);

  
    if (subject === targetSubject) {
      console.log('Processing email with matching subject...');
      const text = message.parts.filter((part) => part.which === 'TEXT')[0].body;

    
      const parsedData = parseEmailData(text);
      await insertDataIntoSQL(parsedData);
    } else {
      console.log('Skipping email with non-matching subject.');
    }
  }

  connection.end();
} catch (error) {
  console.error('Error fetching emails:', error);
}
};


setInterval(fetchEmails, 60000);