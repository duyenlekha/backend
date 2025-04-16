
const fs = require('fs-extra');
const path = require('path');


const copyAllImagesToPublic = async (sourceDir, destinationDir) => {
  try {
  
    await fs.ensureDir(destinationDir);

  
    const files = await fs.readdir(sourceDir);

  
    const imageFiles = files.filter((file) =>
      /\.(png|jpg|jpeg|gif|bmp)$/i.test(file)
    );

 
    for (const file of imageFiles) {
      const sourcePath = path.join(sourceDir, file);
      const destinationPath = path.join(destinationDir, file);
      await fs.copy(sourcePath, destinationPath);
      console.log(`Copied: ${file}`);
    }

    console.log('All images copied successfully!');
  } catch (error) {
    console.error('Error copying images:', error.message);
  }
};


module.exports = { copyAllImagesToPublic };