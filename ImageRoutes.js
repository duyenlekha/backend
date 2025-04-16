const express = require('express');
const { sql, poolPromise } = require('./db');
const path = require('path');
const fs = require('fs');
const router = express.Router();


router.get('/image/:id', async (req, res) => {
  try {
    const pool = await poolPromise;
    const { id } = req.params;

 
    const query = 'SELECT ImageUrl FROM FinancialData WHERE ID = ?';
    

    pool.query(query, [id], (err, result) => {
      if (err) {
        console.error('SQL error', err);
        return res.status(500).send({ message: 'Internal Server Error', error: err.message });
      }

      if (!result || result.length === 0) {
        return res.status(404).send({ message: 'Image not found' });
      }

      const imageUrl = result[0].ImageUrl;

      if (!imageUrl) {
        return res.status(404).send({ message: 'Image not found' });
      }

    
      const imagePath = path.join(__dirname, imageUrl);

 
      if (!fs.existsSync(imagePath)) {
        return res.status(404).send({ message: 'Image file not found on server' });
      }

 
      const ext = path.extname(imagePath).toLowerCase();
      const mimeTypes = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif'
      };

      const contentType = mimeTypes[ext] || 'application/octet-stream';
      res.setHeader('Content-Type', contentType);

 
      const readStream = fs.createReadStream(imagePath);
      readStream.pipe(res);
    });

  } catch (err) {
    console.error('Error fetching image:', err);
    res.status(500).send({ message: 'Internal Server Error', error: err.message });
  }
});

module.exports = router;