const fs = require('fs');
const { PNG } = require('pngjs');
const jsQR = require('jsqr');

const imgPath = 'C:/Users/anura/.gemini/antigravity-ide/brain/eb2c5727-27aa-4e53-a37a-801d21caa441/.user_uploaded/media_1793093852556.png';

fs.createReadStream(imgPath)
  .pipe(new PNG())
  .on('parsed', function() {
    console.log(`Image loaded: ${this.width}x${this.height}`);
    
    // First try whole image
    let code = jsQR(this.data, this.width, this.height);
    
    if (code) {
      console.log('FOUND ON FULL IMAGE:');
      console.log(code.data);
      process.exit(0);
    }
    
    console.log('Not found on full image, trying sub-crops...');
    
    // Try sub-crops of the image
    // The QR is in the middle of the ICICI standee
    for (let topRatio = 0.20; topRatio <= 0.40; topRatio += 0.02) {
      for (let leftRatio = 0.10; leftRatio <= 0.30; leftRatio += 0.02) {
        for (let widthRatio = 0.50; widthRatio <= 0.75; widthRatio += 0.05) {
          const cropX = Math.floor(this.width * leftRatio);
          const cropY = Math.floor(this.height * topRatio);
          const cropW = Math.floor(this.width * widthRatio);
          const cropH = cropW; // QR is roughly square
          
          if (cropX + cropW > this.width || cropY + cropH > this.height) continue;
          
          const croppedData = new Uint8ClampedArray(cropW * cropH * 4);
          for (let y = 0; y < cropH; y++) {
            for (let x = 0; x < cropW; x++) {
              const srcIdx = ((cropY + y) * this.width + (cropX + x)) * 4;
              const dstIdx = (y * cropW + x) * 4;
              croppedData[dstIdx] = this.data[srcIdx];
              croppedData[dstIdx + 1] = this.data[srcIdx + 1];
              croppedData[dstIdx + 2] = this.data[srcIdx + 2];
              croppedData[dstIdx + 3] = this.data[srcIdx + 3];
            }
          }
          
          code = jsQR(croppedData, cropW, cropH);
          if (code) {
            console.log(`FOUND WITH CROP: top=${topRatio}, left=${leftRatio}, size=${widthRatio}`);
            console.log('DECODED_DATA:');
            console.log(code.data);
            process.exit(0);
          }
        }
      }
    }
    
    console.log('Could not decode automatically with jsQR.');
  });
