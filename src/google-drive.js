import { google } from 'googleapis';
import { authenticate } from '@google-cloud/local-auth';
import fs from 'fs';

export async function uploadToGoogleDrive(fileId, filePath, mimeType = 'application/json') {
    try {
        const auth = await authenticate({
            keyfilePath: 'client_credentials.json', // path to google acc credentials
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
