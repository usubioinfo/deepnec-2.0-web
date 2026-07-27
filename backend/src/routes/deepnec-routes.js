// Author: Naveen Duhan
const express = require("express");
const router = express.Router();
const path = require('path');
const fs = require('fs');

const jobQueue = require('../queue/job-queue');
const getPhaseResults = require("../prediction/getresults");
const extractFastaSequence = require("../prediction/extract_seq");
const predictStructure = require("../prediction/predict-structure");
const parsePDB = require("../prediction/parsePDB");
const { SecStructure, parseHorizFile } = require("../prediction/sec-structure");

// Validation helpers
const isValidNamer = (id) => typeof id === 'string' && /^[a-zA-Z0-9_-]{1,64}$/.test(id);
const isValidAccession = (id) => typeof id === 'string' && /^[a-zA-Z0-9_.|:-]{1,256}$/.test(id);
const safeAccessionForFile = (id) => id.replace(/[^a-zA-Z0-9_|-]/g, '_').slice(0, 128);
const isValidPhase = (phase) => ['Phase1', 'Phase2', 'Phase3', 'Phase4'].includes(phase);
const isValidSeqType = (st) => !st || ['prot', 'nucl'].includes(st);

// --- RESTFUL ASYNC JOB QUEUE ENDPOINTS ---

// Health check endpoint for Docker & load balancer
router.get("/jobs/health", (req, res) => {
    return res.status(200).json({ status: "healthy", timestamp: new Date().toISOString() });
});

// 1. Submit async prediction job -> returns 202 Accepted + jobId
router.post("/jobs", (req, res) => {
    try {
        const { seqtxt, accession, phase, seqtype } = req.body;

        if (!seqtxt && !accession) {
            return res.status(400).json({ error: "No sequence text or accession provided." });
        }
        if (phase && !isValidPhase(phase)) {
            return res.status(400).json({ error: "Invalid prediction phase specified." });
        }
        if (seqtype && !isValidSeqType(seqtype)) {
            return res.status(400).json({ error: "Invalid sequence type specified." });
        }

        const jobId = jobQueue.createJob(req.body);
        return res.status(202).json({
            jobId,
            status: 'queued',
            message: 'Job submitted successfully.',
            statusUrl: `/api/jobs/${jobId}/status`,
            resultsUrl: `/api/jobs/${jobId}/results`
        });
    } catch (err) {
        console.error("Error submitting job:", err);
        return res.status(500).json({ error: "Failed to queue prediction job." });
    }
});

// 2. Poll job execution status
router.get("/jobs/:id/status", (req, res) => {
    try {
        const jobId = req.params.id;
        if (!isValidNamer(jobId)) {
            return res.status(400).json({ error: "Invalid job ID format." });
        }

        const statusData = jobQueue.getStatus(jobId);
        if (!statusData) {
            return res.status(404).json({ error: "Job not found." });
        }

        return res.json(statusData);
    } catch (err) {
        console.error("Error fetching job status:", err);
        return res.status(500).json({ error: "Failed to fetch job status." });
    }
});

// 3. Fetch structured job results
router.get("/jobs/:id/results", async (req, res) => {
    try {
        const jobId = req.params.id;
        if (!isValidNamer(jobId)) {
            return res.status(400).json({ error: "Invalid job ID format." });
        }

        const phase = req.query.phase || 'Phase4';
        const ecnumber = req.query.ecnumber;
        const predmethod = req.query.predmethod;
        const outdir = path.join(__dirname, `../prediction/tmp/${jobId}`);

        if (!fs.existsSync(outdir)) {
            return res.status(404).json({ error: "Job results directory not found." });
        }

        const results = await getPhaseResults(phase, outdir, ecnumber, predmethod);
        return res.json({ jobId, results });
    } catch (err) {
        console.error("Error fetching job results:", err);
        return res.status(500).json({ error: "Failed to fetch job results." });
    }
});

// --- LEGACY ENDPOINT COMPATIBILITY ---

router.route("/prediction").post(async (req, res) => {
    try {
        if (!req.body.seqtxt && !req.body.accession) {
            return res.status(400).json({ error: "No sequence text or accession provided." });
        }

        const jobId = jobQueue.createJob(req.body);
        return res.status(202).json({ namer: jobId, status: 'queued' });
    } catch (error) {
        console.error('Error during prediction process:', error);
        res.status(500).send({ error: 'An error occurred during prediction queuing' });
    }
});

router.route("/progress").get((req, res) => {
    try {
        const namer = req.query.namer;
        if (!namer || !isValidNamer(namer)) {
            return res.status(400).json({ error: "Invalid or missing namer parameter" });
        }

        const statusData = jobQueue.getStatus(namer);
        if (statusData) {
            return res.json({ percent: statusData.percent, stage: statusData.stage });
        }

        const progressFile = path.join(__dirname, `../prediction/tmp/${namer}/progress.json`);
        if (fs.existsSync(progressFile)) {
            const data = fs.readFileSync(progressFile, 'utf8');
            return res.json(JSON.parse(data));
        }
        return res.json({ percent: 0, stage: "Starting prediction job..." });
    } catch (error) {
        console.error("Error reading progress:", error);
        return res.status(500).json({ error: "Error reading progress" });
    }
});

router.route("/nextpred").post((req, res) => {
    try {
        const id = req.body.namer;
        if (!id || !isValidNamer(id)) {
            return res.status(400).json({ error: "Invalid or missing namer parameter" });
        }

        const jobId = jobQueue.createJob(req.body);
        return res.status(202).json({ namer: jobId, status: 'queued' });
    } catch (error) {
        console.error('Error during next prediction:', error);
        res.status(500).send({ error: 'An error occurred during prediction queuing' });
    }
});

router.route("/sequence").get(async (req, res) => {
    try {
        const namer = req.query.namer;
        const acc_extract = req.query.acc_extract;
        if (!namer || !isValidNamer(namer) || !isValidAccession(acc_extract)) {
            return res.status(400).json({ error: "Missing or invalid namer or acc_extract" });
        }
        const seqfile = path.join(__dirname, `../prediction/tmp/${namer}.fa`);
        if (!fs.existsSync(seqfile)) {
            return res.status(404).json({ error: "Sequence file not found" });
        }
        const extract_seq = await extractFastaSequence(seqfile, acc_extract);
        const seqLines = extract_seq.split('\n');
        const rawSequence = seqLines.filter(line => !line.startsWith('>')).join('').replace(/[\s]/g, '');
        return res.json({ sequence: rawSequence });
    } catch (err) {
        console.error("Error in /sequence endpoint:", err);
        return res.status(500).json({ error: err.message });
    }
});

router.route("/struct").get(async (req, res) => {
    try {
        const namer = req.query.namer;
        const acc_extract = req.query.acc_extract;
        if (!namer || !isValidNamer(namer) || !isValidAccession(acc_extract)) {
            return res.status(400).json({ error: "Missing or invalid namer or acc_extract" });
        }
        const seqfile = path.join(__dirname, `../prediction/tmp/${namer}.fa`);
        const safeAcc = safeAccessionForFile(acc_extract);
        const extract_seqfile = path.join(__dirname, `../prediction/tmp/${namer}_${safeAcc}.fa`);
        const pdbfile = path.join(__dirname, `../prediction/tmp/${namer}_${safeAcc}.pdb`);
        const extract_seq = await extractFastaSequence(seqfile, acc_extract);

        if (!fs.existsSync(pdbfile)) {
            fs.writeFileSync(extract_seqfile, extract_seq);
            await predictStructure(extract_seq, pdbfile);
        }

        fs.readFile(pdbfile, 'utf8', (err, data) => {
            if (err) {
                res.status(500).send('Error reading PDB file');
                return;
            }

            const jsonData = parsePDB(data);
            const seqLines = extract_seq.split('\n');
            const rawSequence = seqLines.filter(line => !line.startsWith('>')).join('').replace(/[\s]/g, '');

            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify({
                atoms: jsonData.atoms,
                sequence: rawSequence,
                pdbUrl: `/api/download-file/${namer}_${safeAcc}.pdb`
            }));
        });
    } catch (err) {
        console.error("Error in /struct endpoint:", err);
        res.status(500).json({ error: err.message || 'Error predicting structure' });
    }
});

router.route("/secstruct").get(async (req, res) => {
    try {
        const namer = req.query.namer;
        const acc_extract = req.query.acc_extract;
        if (!namer || !isValidNamer(namer) || !isValidAccession(acc_extract)) {
            return res.status(400).json({ error: "Missing or invalid namer or acc_extract" });
        }
        const macc = safeAccessionForFile(acc_extract);
        const seqfile = path.join(__dirname, `../prediction/tmp/${namer}.fa`);
        const extract_seqfile = path.join(__dirname, `../prediction/tmp/${namer}_${macc}.fa`);
        const ssfile = path.join(__dirname, `../prediction/tmp/${namer}_${macc}.horiz`);
        const extract_seq = await extractFastaSequence(seqfile, acc_extract);

        fs.writeFileSync(extract_seqfile, extract_seq);
        await SecStructure(extract_seqfile, ssfile);

        const results = parseHorizFile(ssfile);
        res.send(results);
    } catch (err) {
        console.error("Error in /secstruct endpoint:", err);
        res.status(500).json({ error: "Error predicting secondary structure" });
    }
});

router.route("/results").get(async (req, res) => {
    try {
        const namer = req.query.namer;
        if (!namer || !isValidNamer(namer)) {
            return res.status(400).json({ error: "Missing or invalid namer parameter" });
        }
        const phase = req.query.phase;
        const ecnumber = req.query.ecnumber;
        const predmethod = req.query.predmethod;
        const outdir = path.join(__dirname, `../prediction/tmp/${namer}`);

        const results = await getPhaseResults(phase, outdir, ecnumber, predmethod);
        res.send(results);
    } catch (err) {
        console.error("Error in /results endpoint:", err);
        res.status(500).json({ error: "Error fetching prediction results" });
    }
});

// Secure controlled download endpoints
router.route("/download-file/:fileName").get((req, res) => {
    try {
        const fileName = path.basename(req.params.fileName);
        if (!/^[a-zA-Z0-9_|-]+\.(pdb|fa|gff|tsv|horiz|json)$/i.test(fileName)) {
            return res.status(400).json({ error: "Invalid file format requested." });
        }
        const filePath = path.join(__dirname, `../prediction/tmp/${fileName}`);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: "File not found." });
        }
        return res.sendFile(filePath);
    } catch (err) {
        return res.status(500).json({ error: "Download failed." });
    }
});

router.route("/download/:namer/:fileName").get((req, res) => {
    try {
        const { namer, fileName } = req.params;
        if (!isValidNamer(namer)) {
            return res.status(400).json({ error: "Invalid namer parameter." });
        }
        const safeFileName = path.basename(fileName);
        if (!/^[a-zA-Z0-9_|-]+\.(tsv|gff|png|jpg|jpeg|json)$/i.test(safeFileName)) {
            return res.status(400).json({ error: "Invalid file format requested." });
        }
        const filePath = path.join(__dirname, `../prediction/tmp/${namer}/${safeFileName}`);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: "File not found." });
        }
        return res.sendFile(filePath);
    } catch (err) {
        return res.status(500).json({ error: "Download failed." });
    }
});

module.exports = router;
