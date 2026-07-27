// Author: Naveen Duhan
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

const writeProgress = (outdir, percent, stage) => {
    try {
        if (!fs.existsSync(outdir)) {
            fs.mkdirSync(outdir, { recursive: true });
        }
        fs.writeFileSync(
            path.join(outdir, 'progress.json'),
            JSON.stringify({ percent, stage })
        );
    } catch (e) {
        console.error('Failed to write progress:', e);
    }
};

const runFileAsync = (file, args, options) => {
    return new Promise((resolve, reject) => {
        execFile(file, args, options, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            } else {
                resolve({ stdout, stderr });
            }
        });
    });
};

const runDeepNEC = async (namer, phase, file, outdir, ecnumber, evalue, identity, coverage, method, seqtype, homologymethod, gfffile) => {
    const scriptPath = path.join(__dirname, '../../deepnec-2.0/deepnec.py');
    let visualizeScriptPath = path.join(__dirname, '../../deepnec-2.0/deepNEC/visualize.py');
    if (!fs.existsSync(visualizeScriptPath)) {
        visualizeScriptPath = path.join(__dirname, 'visualize.py');
    }
    const motifScanScriptPath = path.join(__dirname, '../../deepnec-2.0/deepNEC/motif_scan.py');
    const annotateScriptPath = path.join(__dirname, '../../deepnec-2.0/deepNEC/annotate.py');

    let pythonPath = 'python3';
    if (fs.existsSync('/Users/naveen/miniconda3/envs/deepml/bin/python')) {
        pythonPath = '/Users/naveen/miniconda3/envs/deepml/bin/python';
    }

    const mainArgs = [scriptPath, '-i', file, '-l', phase, '-od', outdir, '-t', seqtype || 'prot'];

    if (phase === 'Phase4') {
        const pathwayMap = {
            'nitri': 'nitrification',
            'nfix': 'Nitrogen_Fixation',
            'assim': 'assimilatory',
            'dissim': 'dissimilatory',
            'denitri': 'denitrification',
            'addn': 'addn',
            'ddn': 'DDN',
            'dn': 'DN',
            'dd': 'DD',
            'anammox': 'anammox',
            'all_models': 'all'
        };
        const pathway = pathwayMap[ecnumber] || 'all';
        mainArgs.push('-n', pathway);
    }

    const envOptions = {
        env: {
            ...process.env,
            PYTHONPATH: path.dirname(scriptPath)
        }
    };

    console.log(`Executing deepNEC 2.0 via execFile: ${pythonPath} ${mainArgs.join(' ')}`);
    try {
        writeProgress(outdir, 15, 'Extracting sequence features & generating embeddings...');
        writeProgress(outdir, 30, 'Running deepNEC classification models...');
        await runFileAsync(pythonPath, mainArgs, envOptions);
        writeProgress(outdir, 65, 'Main prediction phase completed.');

        let predictionsTsv = path.join(outdir, 'Phase_4_predictions.tsv');
        if (!fs.existsSync(predictionsTsv)) {
            predictionsTsv = path.join(outdir, 'Phase_3_predictions.tsv');
        }
        if (!fs.existsSync(predictionsTsv)) {
            predictionsTsv = path.join(outdir, 'deepnec_predictions.tsv');
        }

        if (fs.existsSync(predictionsTsv)) {
            writeProgress(outdir, 70, 'Generating publication-ready figures & distribution curves...');
            await runFileAsync(pythonPath, [visualizeScriptPath, '-i', predictionsTsv, '-od', outdir], envOptions);
            writeProgress(outdir, 85, 'Visualization generation completed.');
        }

        if (fs.existsSync(file)) {
            const motifScanTsv = path.join(outdir, 'motif_scan_report.tsv');
            writeProgress(outdir, 88, 'Scanning sequences for active site & metal-binding motifs...');
            await runFileAsync(pythonPath, [motifScanScriptPath, '-i', file, '-o', motifScanTsv], envOptions);
            writeProgress(outdir, 94, 'Motif scan completed.');
        }

        if (phase === 'Phase4' && gfffile && fs.existsSync(gfffile) && fs.existsSync(predictionsTsv)) {
            const outputGff = path.join(outdir, 'annotated_output.gff');
            writeProgress(outdir, 95, 'Constructing GFF3 genomic annotations...');
            await runFileAsync(pythonPath, [annotateScriptPath, '-g', gfffile, '-p', predictionsTsv, '-o', outputGff], envOptions);
            writeProgress(outdir, 98, 'Genomic annotations completed.');
        }

        writeProgress(outdir, 100, 'Processing results...');
    } catch (err) {
        console.error(`deepNEC Execution Failed: ${err.message}`);
        writeProgress(outdir, -1, `Error: ${err.message}`);
        throw err;
    }

    return namer;
};

module.exports = runDeepNEC;
