const sql = require('msnodesqlv8');

const connectionString = "Driver={ODBC Driver 17 for SQL Server};Server=localhost;Database=Stock;Trusted_Connection=yes;";

const poolPromise = new Promise((resolve, reject) => {
    sql.open(connectionString, (err, conn) => {
      if (err) {
        console.log('Database Connection Failed! Bad Config: ', err);
        reject(err);
      } else {
        console.log('Connected to MSSQL');
        resolve(conn);
      }
    });
  });
  
  module.exports = {
    sql, poolPromise
  };





