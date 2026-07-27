// Author: Naveen Duhan
const fs = require('fs').promises;

async function extractFastaSequence(filePath, header) {
    try {
        // Read the FASTA file content asynchronously
        const fastaContent = await fs.readFile(filePath, 'utf8');

        // Split the content into individual sequences
        const sequences = fastaContent.split('>');
        let result = "";

        // Loop through each sequence to find the one that matches the header
        for (let seq of sequences) {
            if (seq.startsWith(header)) {
                result = ">" + seq.trim(); // Re-add the '>' at the start and trim any whitespace
                break;
            }
        }

        // Return the sequence if found, otherwise return a message
        return result ? result : "Header not found.";
    } catch (error) {
        console.error("Error reading file:", error);
        return null;
    }
}

module.exports = extractFastaSequence;
