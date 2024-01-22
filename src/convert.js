import { promisify } from 'util';
import { exec } from 'child_process';
import fs from 'fs/promises';

const execAsync = promisify(exec);

export async function runDockerScoutCves(imageName, outputFilename) {
    const command = `docker scout cves --format sarif --output ${outputFilename}.json ${imageName}`;

    try {
        const { stdout } = await execAsync(command);
        console.log(`Command output: ${stdout}`);
        await parseJsonToCsv(`${outputFilename}.json`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

async function parseJsonToCsv(jsonFilename) {
    try {
        const rawData = await fs.readFile(jsonFilename, 'utf-8');
        const jsonData = JSON.parse(rawData);

        const csvData = jsonData.runs[0].results.map(entry => ({
            imageName: entry.locations[0].physicalLocation.artifactLocation.uri,
            CVE: entry.ruleId,
            severity: entry.message.text
        }));

        const csvContent = csvData.map(entry => `${entry.imageName}, ${entry.CVE}, ${entry.severity}`).join('\n');
        await fs.writeFile('output.csv', 'imageName, CVE#, severity\n' + csvContent);

        console.log('CSV file generated successfully.');
    } catch (error) {
        console.error(`Error parsing JSON to CSV: ${error.message}`);
    }
}