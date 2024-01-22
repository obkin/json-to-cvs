const { exec } = require('child_process');
const fs = require('fs');

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

// using
const imageName = process.argv[2];
const outputFilename = process.argv[3];

if (!imageName || !outputFilename) {
    console.error('Usage: node script.js <image_name> <output_filename>');
} else {
    runDockerScoutCves(imageName, outputFilename);
}
