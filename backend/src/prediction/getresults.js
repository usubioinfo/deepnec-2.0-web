// Author: Naveen Duhan
const path = require('path');
const fs = require('fs');

function readFileToJson(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            console.warn(`File does not exist: ${filePath}`);
            return null;
        }

        // Read the file synchronously
        const fileContent = fs.readFileSync(filePath, 'utf8');

        // Split the content by newlines to get rows
        const rows = fileContent.split('\n').filter(row => row.trim() !== '');

        if (rows.length === 0) {
            throw new Error('The file is empty or invalid.');
        }

        // The first row is assumed to be the column names
        const columnNames = rows[0].split('\t');

        // Convert each subsequent row into an object
        const jsonArray = rows.slice(1).map(row => {
            const values = row.split('\t');
            let obj = {};
            columnNames.forEach((colName, index) => {
                obj[colName.trim()] = values[index] ? values[index].trim() : null;
            });
            return obj;
        });

        return jsonArray;
    } catch (error) {
        console.error('Error reading or parsing file:', error);
        return null;
    }
}

const getPhaseResults = async (phase, outdir, ecnumber, predmethod) => {
    let results = {};

    try {
        // deepNEC 2.0 writes TSV files uniformly across all prediction methods

        // Phase 1
        if (phase === "Phase1" || phase === "Phase2" || phase === "Phase3" || phase === "Phase4") {
            results["Phase1"] = readFileToJson(path.join(outdir, 'Phase_1_predictions.tsv'));
        }

        // Phase 2
        if (phase === "Phase2" || phase === "Phase3" || phase === "Phase4") {
            results["Phase2"] = readFileToJson(path.join(outdir, 'Phase_2_predictions.tsv'));
        }

        // Phase 3
        if (phase === "Phase3" || phase === "Phase4") {
            let phase3Results = readFileToJson(path.join(outdir, 'Phase_3_predictions.tsv'));
            if (phase3Results) {
                // Ensure all the required pathway keys exist for rendering in frontend rtable
                phase3Results = phase3Results.map(result => {
                    return {
                        "SampleID": result["SampleID"],
                        "Prediction": result["Prediction"],
                        "Confidence": result["Confidence"],
                        "Nitrogen Fixation": result["Nitrogen_Fixation"] || result["Nitrogen Fixation"] || null,
                        "Anammox": result["Anammox"] || null,
                        "Assimilatory": result["Assimilatory"] || null,
                        "Dissimilatory": result["Dissimilatory"] || null,
                        "Denitrification": result["Denitrification"] || null,
                        "Nitrification": result["Nitrification"] || null,
                        "ADDN": result["ADDN"] || null,
                        "DN": result["DN"] || null,
                        "DDN": result["DDN"] || null,
                        "DD": result["DD"] || null
                    };
                });
            }
            results["Phase3"] = phase3Results;
        }

        // Phase 4
        if (phase === "Phase4") {
            // Read from the unified Phase_4_predictions.tsv file
            results["Phase4"] = readFileToJson(path.join(outdir, 'Phase_4_predictions.tsv'));
        }

        // 1. Read Motif Scan report if it exists
        const motifScanPath = path.join(outdir, 'motif_scan_report.tsv');
        if (fs.existsSync(motifScanPath)) {
            results["motifScan"] = readFileToJson(motifScanPath);
        }

        // 2. Check if Annotated GFF exists
        const annotatedGffPath = path.join(outdir, 'annotated_output.gff');
        results["hasAnnotatedGff"] = fs.existsSync(annotatedGffPath);

        return results;
    } catch (err) {
        throw new Error(`Error reading phase data: ${err.message}`);
    }
};

module.exports = getPhaseResults;
