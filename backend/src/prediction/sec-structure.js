// Author: Naveen Duhan
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const parseHorizFile = (filePath) => {
    const data = fs.readFileSync(filePath, 'utf8');
    const lines = data.split('\n');

    let confs = '';
    let preds = '';
    let aas = '';

    lines.forEach(line => {
        if (line.startsWith('Conf:')) {
            confs += line.trim().split(/\s+/)[1];
        } else if (line.startsWith('Pred:')) {
            preds += line.trim().split(/\s+/)[1];
        } else if (line.startsWith('  AA:')) {
            aas += line.trim().split(/\s+/)[1];
        }
    });

    return {
        confidence: confs,
        prediction: preds,
        amino_acids: aas
    };
};

const SecStructure = (infile, outfile) => {
    const s4predPath = fs.existsSync('/s4pred/run_model.py')
        ? '/s4pred/run_model.py'
        : path.join(__dirname, '../../../s4pred/run_model.py');
    let pythonPath = 'python3';
    if (fs.existsSync('/Users/naveen/miniconda3/envs/deepml/bin/python')) {
        pythonPath = '/Users/naveen/miniconda3/envs/deepml/bin/python';
    }

    const output = execFileSync(pythonPath, [s4predPath, '-t', 'horiz', infile]);
    fs.writeFileSync(outfile, output);

    return Promise.resolve(outfile);
};

module.exports = { SecStructure, parseHorizFile };
