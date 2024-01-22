import { runDockerScoutCves } from './src/convert.js'
import { uploadToGoogleDrive } from './src/google-drive.js'

// --- converting ---
const imageName = process.argv[2];
const outputFilename = process.argv[3];

// --- google drive ---
const fileId = 'output.cvs'; // google drive file name
const filePath = 'output.csv'; // path to file you wanna upload

async function init() {
    if (!imageName || !outputFilename) {
        console.error('Usage: node script.js <image_name> <output_filename>');
    } else {
        await runDockerScoutCves(imageName, outputFilename);
        await uploadToGoogleDrive(fileId, filePath);
    }
}

init();