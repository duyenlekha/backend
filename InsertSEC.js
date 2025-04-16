
const express = require('express');
const { sql, poolPromise } = require('./db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

async function insertRecentFilings(tickersWithRecentFilings) {
  try {


    






    const pool = await poolPromise;
    await pool.connect();

   
    for (const ticker of tickersWithRecentFilings) {
      const query = `
        INSERT INTO SECTable (Ticker, FilingDate, Form)
        VALUES (@Ticker, @FilingDate, @Form)
      `;

      const params = {
        Ticker: ticker.ticker,
        FilingDate: ticker.filingDate,
        Form: ticker.form,
        CIK: ticker.cik,
      };

      // Execute the query
      await pool.request()
        .input('Ticker', sql.VarChar, params.Ticker)
        .input('FilingDate', sql.Date, params.FilingDate)
        .input('Form', sql.VarChar, params.Form)
        .input('CIK', sql.VarChar, params.CIK)
        .query(query);

      console.log(`Inserted ${ticker.ticker} filing on ${ticker.filingDate}`);
    }

    console.log('All data inserted successfully!');
  } catch (err) {
    console.error('SQL error', err);
  } finally {
    pool.close(); 
  }
}