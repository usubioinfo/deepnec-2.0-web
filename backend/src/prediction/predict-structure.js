// Author: Naveen Duhan
const fs = require('fs');
const zlib = require('zlib');
const { promisify } = require('util');
const gunzip = promisify(zlib.gunzip);

const token = process.env.SWISS_MODEL_TOKEN || "";
const projectIdUrl = "https://swissmodel.expasy.org/automodel";
const statusUrl = projectId => `https://swissmodel.expasy.org/project/${projectId}/models/summary/`;

async function extractSequence(text) {
    const lines = text.split('\n');
    const headerIndex = lines.findIndex(line => line.startsWith('>'));
    if (headerIndex === -1) {
        return 'Header not found';
    }
    const sequenceLines = lines.slice(headerIndex + 1);
    return sequenceLines.join('').replace(/[\s]/g, '');
}

async function tryESMFold(sequence, filename) {
    console.log(`[Structure] Folding sequence via ESMFold API... Sequence length: ${sequence.length}`);
    try {
        const response = await fetch("https://api.esmatlas.com/foldSequence/v1/pdb/", {
            method: 'POST',
            body: sequence,
            headers: {
                'Content-Type': 'text/plain'
            }
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`ESMFold API failed (Status ${response.status}): ${errText || response.statusText}`);
        }

        const pdbText = await response.text();
        fs.writeFileSync(filename, pdbText);
        console.log(`[Structure] Saved ESMFold structure to: ${filename}`);
        return true;
    } catch (error) {
        console.error(`[Structure] ESMFold failed:`, error);
        return false;
    }
}

async function submitSwissModelJob(sequence) {
    console.log(`[Structure] Submitting sequence (length ${sequence.length}) to Swiss-Model...`);
    const response = await fetch(projectIdUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            target_sequences: sequence,
            project_title: "deepNEC 2.0 structure prediction"
        })
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Swiss-Model submission failed (Status ${response.status}): ${errText}`);
    }

    const data = await response.json();
    return data.project_id;
}

async function checkSwissModelStatus(projectId) {
    const response = await fetch(statusUrl(projectId), {
        method: 'GET',
        headers: { 'Authorization': `Token ${token}` }
    });
    if (!response.ok) {
        throw new Error(`Swiss-Model status check failed (Status ${response.status})`);
    }
    return response.json();
}

async function downloadAndDecompress(coordinatesUrl, filename) {
    const response = await fetch(coordinatesUrl);
    if (!response.ok) {
        throw new Error(`Failed to download Swiss-Model PDB file from: ${coordinatesUrl}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const decompressedData = await gunzip(buffer);
    fs.writeFileSync(filename, decompressedData);
}

async function trySwissModel(sequence, filename) {
    const projectId = await submitSwissModelJob(sequence);
    if (!projectId) {
        throw new Error('Failed to get Swiss-Model project ID.');
    }
    console.log('[Structure] Swiss-Model job submitted. Project ID:', projectId);

    let statusData, status, coordinatesUrl;
    let attempts = 0;
    const maxAttempts = 60; // 10 minutes max polling time

    do {
        attempts++;
        if (attempts > maxAttempts) {
            throw new Error('Swiss-Model structure prediction timed out.');
        }

        console.log(`[Structure] Polling Swiss-Model status (Attempt ${attempts}/${maxAttempts})...`);
        await new Promise(resolve => setTimeout(resolve, 10000));

        statusData = await checkSwissModelStatus(projectId);
        status = statusData.status;

        if (status === "COMPLETED") {
            coordinatesUrl = statusData.models[0].coordinates_url;
        }
    } while (status !== "COMPLETED" && status !== "FAILED");

    if (status === "COMPLETED") {
        console.log('[Structure] Swiss-Model completed. Downloading coordinates: ', coordinatesUrl);
        await downloadAndDecompress(coordinatesUrl, filename);
        console.log(`[Structure] Saved Swiss-Model structure to: ${filename}`);
        return true;
    } else {
        throw new Error('Swiss-Model structure prediction job failed.');
    }
}

async function predictStructure(targetSequences, filename) {
    try {
        const sequence = await extractSequence(targetSequences);
        if (sequence === 'Header not found') {
            throw new Error('FASTA Sequence header not found.');
        }

        // 1. If sequence is <= 400 AA, try ESMFold first
        if (sequence.length <= 400) {
            const success = await tryESMFold(sequence, filename);
            if (success) return;
            console.log("[Structure] ESMFold failed. Falling back to Swiss-Model...");
        }

        // 2. Fall back to Swiss-Model for sequences > 400 AA or if ESMFold fails
        await trySwissModel(sequence, filename);
    } catch (error) {
        console.error('[Structure] Error in predictStructure:', error);
        throw error;
    }
}

module.exports = predictStructure;
