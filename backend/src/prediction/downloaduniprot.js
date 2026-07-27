// Author: Naveen Duhan
const fs = require('fs');
const path = require('path');
const { URLSearchParams } = require('url');

async function downloadProteinSequence(uniprotId, id, acctype) {
    if (!uniprotId) {
      console.error('Please provide a UniProt ID or list of IDs.');
      return;
    }

    try {
      // Split the incoming string by comma, space, semicolon or newline to support list
      const idsList = uniprotId.split(/[\s,;\n]+/).map(x => x.trim()).filter(x => x.length > 0);
      console.log(`Parsed accession list:`, idsList);

      let combinedFasta = "";

      if (acctype === 'uniprot') {
        // Fetch each accession sequence from UniProt
        for (const singleId of idsList) {
          try {
            console.log(`Fetching UniProt sequence for: ${singleId}`);
            const response = await fetch(`https://www.uniprot.org/uniprot/${singleId}.fasta`);
            if (response.ok) {
              const text = await response.text();
              combinedFasta += text.trim() + "\n\n";
            } else {
              console.error(`Failed to fetch UniProt sequence for ID: ${singleId} (Status: ${response.status})`);
            }
          } catch (e) {
            console.error(`Error fetching UniProt sequence for ID: ${singleId}`, e);
          }
        }
      } else if (acctype === 'ncbi') {
        // NCBI efetch supports retrieving multiple comma-separated IDs in a single request
        const commaIds = idsList.join(",");
        console.log(`Fetching NCBI sequences for: ${commaIds}`);
        const baseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi';

        const params = new URLSearchParams({
            db: 'protein',
            id: commaIds,
            rettype: 'fasta',
            retmode: 'text',
        });
        const sequrl = `${baseUrl}?${params.toString()}`;
        const response = await fetch(sequrl);

        if (!response.ok) {
          throw new Error(`NCBI efetch returned status: ${response.status}`);
        }
        combinedFasta = await response.text();
      }

      if (!combinedFasta.trim()) {
        throw new Error('No sequence data could be retrieved for the provided accession list.');
      }

      // Define the file path and name
      const filePath = path.join(__dirname, `../prediction/tmp/${id}.fa`);

      // Write the data to a file
      fs.writeFileSync(filePath, combinedFasta, 'utf8');
      console.log(`Saved combined FASTA with ${idsList.length} accessions to ${filePath}`);

    } catch (error) {
      console.error('Error fetching protein sequences:', error);
      throw error;
    }
}

module.exports = downloadProteinSequence;
