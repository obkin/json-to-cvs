const { exec } = require('child_process');
const { google } = require('googleapis');
const { authenticate } = require('@google-cloud/local-auth');
const fs = require('fs');

// --- Converting JSON to cvs ---
function runDockerScoutCves(imageName, outputFilename) {
    const command = `docker scout cves --format sarif --output ${outputFilename}.json ${imageName}`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            return;
        }
        console.log(`Command output: ${stdout}`);
        parseJsonToCsv(`${outputFilename}.json`);
    });
}

function parseJsonToCsv(jsonFilename) {
    const rawData = fs.readFileSync(jsonFilename);
    const jsonData = JSON.parse(rawData);
    
    const csvData = jsonData.runs[0].results.map(entry => {
        return {
            imageName: entry.locations[0].physicalLocation.artifactLocation.uri,
            CVE: entry.ruleId,
            severity: entry.message.text
        };
    });

    const csvContent = csvData.map(entry => `${entry.imageName}, ${entry.CVE}, ${entry.severity}`).join('\n');
    fs.writeFileSync('output.csv', 'imageName, CVE#, severity\n' + csvContent);

    console.log('CSV file generated successfully.');
}

// --- using ---
const imageName = process.argv[2];
const outputFilename = process.argv[3];

if (!imageName || !outputFilename) {
    console.error('Usage: node script.js <image_name> <output_filename>');
} else {
    runDockerScoutCves(imageName, outputFilename);
}



// --- Uploading to google drive ---
async function uploadToGoogleDrive(fileId, filePath, mimeType = 'application/json') {
    try {
        const auth = await authenticate({
            keyfilePath: 'json-to-cvs/client_credentials.json', // path to google acc credentials
            scopes: ['https://www.googleapis.com/auth/drive.file'],
        });

        const drive = google.drive({ version: 'v3', auth });

        const media = {
            mimeType,
            body: fs.createReadStream(filePath),
        };

        const response = await drive.files.create({
            requestBody: {
                name: fileId,
                mimeType,
            },
            media,
        });

        console.log(`File uploaded successfully. File ID: ${response.data.id}`);
    } catch (error) {
        console.error('Error uploading file to Google Drive:', error.message);
    }
}

// --- using ---
const fileId = 'output.cvs'; // google drive file name
const filePath = 'json-to-cvs/output.json'; // path to file you wanna upload

uploadToGoogleDrive(fileId, filePath);
