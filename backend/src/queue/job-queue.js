// Author: Naveen Duhan
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const runDeepNEC = require('../prediction/run-deepnec');
const downloadProteinSequence = require('../prediction/downloaduniprot');

class JobQueueManager {
    constructor(maxConcurrent = 2, expirationMs = 24 * 60 * 60 * 1000) {
        this.maxConcurrent = maxConcurrent;
        this.expirationMs = expirationMs;
        this.jobs = new Map(); // jobId -> JobState
        this.queue = [];       // array of jobIds waiting to run
        this.activeCount = 0;

        // Run auto-cleanup cron every hour
        const cleanupTimer = setInterval(() => this.cleanupExpiredJobs(), 60 * 60 * 1000);
        cleanupTimer.unref();
    }

    createJob(params) {
        const jobId = crypto.randomUUID();
        const tmpBaseDir = path.join(__dirname, '../prediction/tmp');
        const outdir = path.join(tmpBaseDir, jobId);
        const seqfile = path.join(tmpBaseDir, `${jobId}.fa`);
        const gfffile = params.gfftxt && params.gfftxt.trim()
            ? path.join(tmpBaseDir, `${jobId}.gff`)
            : null;

        if (!fs.existsSync(outdir)) {
            fs.mkdirSync(outdir, { recursive: true });
        }

        if (gfffile) {
            fs.writeFileSync(gfffile, params.gfftxt);
        }

        const jobState = {
            id: jobId,
            status: 'queued', // queued | running | completed | failed
            percent: 0,
            stage: 'Job queued...',
            createdAt: Date.now(),
            params: { ...params, seqfile, outdir, gfffile },
            error: null
        };

        this.jobs.set(jobId, jobState);
        this.queue.push(jobId);
        this.processNext();

        return jobId;
    }

    getStatus(jobId) {
        const job = this.jobs.get(jobId);
        if (!job) {
            // Check if progress.json exists on disk
            const progressFile = path.join(__dirname, `../prediction/tmp/${jobId}/progress.json`);
            if (fs.existsSync(progressFile)) {
                try {
                    const diskData = JSON.parse(fs.readFileSync(progressFile, 'utf8'));
                    return { status: diskData.percent === 100 ? 'completed' : 'running', ...diskData };
                } catch (e) {}
            }
            return null;
        }

        // Read live progress.json if present
        const progressFile = path.join(job.params.outdir, 'progress.json');
        if (fs.existsSync(progressFile)) {
            try {
                const diskData = JSON.parse(fs.readFileSync(progressFile, 'utf8'));
                job.percent = diskData.percent;
                job.stage = diskData.stage;
                if (diskData.percent === 100) {
                    job.status = 'completed';
                } else if (diskData.percent === -1) {
                    job.status = 'failed';
                    job.error = diskData.stage;
                }
            } catch (e) {}
        }

        return {
            id: job.id,
            status: job.status,
            percent: job.percent,
            stage: job.stage,
            createdAt: job.createdAt,
            error: job.error
        };
    }

    async processNext() {
        if (this.activeCount >= this.maxConcurrent || this.queue.length === 0) {
            return;
        }

        const jobId = this.queue.shift();
        const job = this.jobs.get(jobId);
        if (!job) return;

        this.activeCount++;
        job.status = 'running';
        job.stage = 'Initializing feature extraction...';

        try {
            const { seqtxt, accession, acctype, phase, ecnumber, evalue, identity, coverage, predmethod, seqtype, homologymethod, seqfile, outdir, gfffile } = job.params;

            if (seqtxt) {
                fs.writeFileSync(seqfile, seqtxt);
            } else if (accession) {
                job.stage = 'Downloading sequence from accession database...';
                await downloadProteinSequence(accession, jobId, acctype);
            }

            await runDeepNEC(jobId, phase, seqfile, outdir, ecnumber, evalue, identity, coverage, predmethod, seqtype, homologymethod, gfffile);
            job.status = 'completed';
            job.percent = 100;
            job.stage = 'Prediction completed successfully.';
        } catch (err) {
            console.error(`Job ${jobId} execution failed:`, err);
            job.status = 'failed';
            job.percent = -1;
            job.error = err.message || 'Execution failed.';
        } finally {
            this.activeCount--;
            this.processNext();
        }
    }

    cleanupExpiredJobs() {
        const now = Date.now();
        const tmpBaseDir = path.join(__dirname, '../prediction/tmp');

        for (const [jobId, job] of this.jobs.entries()) {
            if (now - job.createdAt > this.expirationMs) {
                this.jobs.delete(jobId);
                const outdir = path.join(tmpBaseDir, jobId);
                if (fs.existsSync(outdir)) {
                    try { fs.rmSync(outdir, { recursive: true, force: true }); } catch (e) {}
                }
                const faFile = path.join(tmpBaseDir, `${jobId}.fa`);
                if (fs.existsSync(faFile)) {
                    try { fs.unlinkSync(faFile); } catch (e) {}
                }
            }
        }
    }
}

const jobQueue = new JobQueueManager();
module.exports = jobQueue;
