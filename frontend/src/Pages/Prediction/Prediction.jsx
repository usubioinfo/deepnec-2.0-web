// Author: Naveen Duhan
import React from "react";
import axios from "axios";
import "./Prediction.scss";
import { Divider, Radio, Button, Alert } from 'antd';
import { Form } from "react-bootstrap";
import FileInput from "Components/FileInput/FileInput";
import test from './test.gif';
import { fetchResults } from "./fetchResults";
import { demoSequences } from "./geneSamples";
import { demoNTSequences } from "./geneNTSamples";
import { demoAccessions } from "./geneAccessionSamples";
import { env } from "env";

export default class Prediction extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isOpen: false,
            datatype: 'fasta',
            seqtype: 'prot',
            acctype: 'ncbi',
            accession: '',
            targetPhase: 'Phase4',
            p4value: 'all_models',
            seqtxt: '',
            filetxt: '',
            gfftxt: '',
            progressPercent: 0,
            progressStage: '',
            validationError: null,
            validationInfo: null
        };

        this.SeqMethodradioHandler = this.SeqMethodradioHandler.bind(this);
        this.SeqTyperadioHandler = this.SeqTyperadioHandler.bind(this);
        this.AccessionHandler = this.AccessionHandler.bind(this);
        this.handleSeqChange = this.handleSeqChange.bind(this);
        this.handlep4Change = this.handlep4Change.bind(this);
        this.fileSelected = this.fileSelected.bind(this);
        this.accessionFileSelected = this.accessionFileSelected.bind(this);
        this.gffFileSelected = this.gffFileSelected.bind(this);
        this.runPrediction = this.runPrediction.bind(this);
        this.handleSearch = this.handleSearch.bind(this);
        this.handlePhaseChange = this.handlePhaseChange.bind(this);
    }

    componentWillUnmount() {
        this.stopProgressPolling();
    }

    startProgressPolling(jobId) {
        this.progressInterval = setInterval(async () => {
            try {
                const response = await axios.get(`${env.BACKEND}/api/jobs/${jobId}/status`);
                if (response.data) {
                    const { percent, stage, status } = response.data;
                    this.setState({
                        progressPercent: percent || 0,
                        progressStage: stage || 'Processing...'
                    });

                    if (status === 'completed' || percent === 100) {
                        this.stopProgressPolling();
                        this.setState({ isOpen: false });
                        window.location.assign(`/deepnec-2.0/results?namer=${jobId}&phase=${this.state.targetPhase}&ecnumber=${this.state.p4value}`);
                    } else if (status === 'failed' || percent === -1) {
                        this.stopProgressPolling();
                        this.setState({
                            isOpen: false,
                            validationError: `Prediction failed: ${stage}`
                        });
                    }
                }
            } catch (error) {
                console.error("Error fetching prediction progress:", error);
            }
        }, 1500);
    }

    stopProgressPolling() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
        }
    }

    validateSequenceInput(text, type) {
        if (!text || !text.trim()) {
            return null;
        }

        const lines = text.trim().split('\n');
        let seqCount = 0;
        let totalLen = 0;
        let minLen = Infinity;
        let maxLen = 0;
        let invalidCount = 0;

        const validRegex = type === 'nucl' ? /^[ATCGN\s]+$/i : /^[ARNDCQEGHILKMFPSTWYV\s]+$/i;

        lines.forEach(line => {
            const trimmed = line.trim();
            if (trimmed.startsWith('>')) {
                seqCount++;
            } else if (trimmed.length > 0) {
                totalLen += trimmed.length;
                if (trimmed.length < minLen) minLen = trimmed.length;
                if (trimmed.length > maxLen) maxLen = trimmed.length;

                if (!validRegex.test(trimmed)) {
                    invalidCount++;
                }
            }
        });

        // If no header, count as 1 sequence
        if (seqCount === 0 && totalLen > 0) seqCount = 1;

        return {
            seqCount,
            totalLen,
            avgLen: seqCount > 0 ? Math.round(totalLen / seqCount) : 0,
            minLen: minLen === Infinity ? 0 : minLen,
            maxLen,
            invalidCount
        };
    }

    handleSeqChange(e) {
        const val = e.target.value;
        const valInfo = this.validateSequenceInput(val, this.state.seqtype);
        this.setState({
            seqtxt: val,
            validationInfo: valInfo,
            validationError: null
        });
    }

    fileSelected(fileText) {
        const valInfo = this.validateSequenceInput(fileText, this.state.seqtype);
        this.setState({
            filetxt: fileText,
            validationInfo: valInfo,
            validationError: null
        });
    }

    gffFileSelected(fileText) {
        this.setState({ gfftxt: fileText });
    }

    accessionFileSelected(fileText) {
        this.setState({ accession: fileText, validationError: null });
    }

    SeqMethodradioHandler(e) {
        this.setState({ datatype: e.target.value, validationError: null, validationInfo: null });
    }

    SeqTyperadioHandler(e) {
        const type = e.target.value;
        this.setState({ seqtype: type, validationError: null });
        const pKey = (this.state.p4value === 'all' || this.state.p4value === 'all_models') ? 'all' : this.state.p4value;
        if (this.state.seqtxt !== '') {
            const sample = type === 'nucl' ? demoNTSequences[pKey] : demoSequences[pKey];
            const valInfo = this.validateSequenceInput(sample, type);
            this.setState({ seqtxt: sample, validationInfo: valInfo });
        }
    }

    AccessionHandler(e) {
        const newAccType = e.target.value;
        this.setState({ acctype: newAccType, validationError: null });
        if (this.state.accession !== '') {
            const pKey = (this.state.p4value === 'all' || this.state.p4value === 'all_models') ? 'all' : this.state.p4value;
            const sample = demoAccessions[newAccType] ? demoAccessions[newAccType][pKey] : "";
            this.setState({ accession: sample });
        }
    }

    handleSearch(e) {
        this.setState({ accession: e.target.value, validationError: null });
    }

    handlep4Change(e) {
        const val = e.target.value;
        this.setState({ p4value: val });
        const pKey = (val === 'all' || val === 'all_models') ? 'all' : val;

        if (this.state.seqtxt !== '') {
            const sample = this.state.seqtype === 'nucl' ? demoNTSequences[pKey] : demoSequences[pKey];
            const valInfo = this.validateSequenceInput(sample, this.state.seqtype);
            this.setState({ seqtxt: sample, validationInfo: valInfo });
        }
    }

    handlePhaseChange(e) {
        this.setState({ targetPhase: e.target.value });
    }

    async runPrediction() {
        this.setState({ validationError: null });

        const { datatype, seqtxt, filetxt, accession, seqtype, targetPhase, p4value, gfftxt, acctype } = this.state;
        const activeSeq = seqtxt.trim() || filetxt.trim();

        if (datatype === 'fasta') {
            if (!activeSeq) {
                this.setState({ validationError: "Please provide a FASTA sequence or upload a FASTA file." });
                return;
            }
        } else if (datatype === 'accession') {
            if (!accession.trim()) {
                this.setState({ validationError: "Please enter or upload a list of accession IDs." });
                return;
            }
        }

        let data = new FormData();
        data.append('phase', targetPhase);
        data.append('seqtype', seqtype);
        data.append('ecnumber', p4value);

        if (datatype === 'accession') {
            data.append('accession', accession);
            data.append('acctype', acctype);
        } else {
            data.append('seqtxt', activeSeq);
        }

        if (gfftxt && gfftxt.trim()) {
            data.append('gfftxt', gfftxt);
        }

        try {
            this.setState({ isOpen: true, progressPercent: 0, progressStage: 'Submitting job to queue...' });
            const response = await fetchResults(data);
            const jobId = response.jobId || response.namer;

            if (jobId) {
                this.startProgressPolling(jobId);
            } else {
                throw new Error("Server failed to return a valid job ID.");
            }
        } catch (err) {
            this.setState({
                isOpen: false,
                validationError: `Submission failed: ${err.response?.data?.error || err.message}`
            });
        }
    }

    render() {
        const phaseOptions = [
            { label: 'Phase 1: Binary Enzyme Filter (Enzyme vs Non-Enzyme)', value: 'Phase1' },
            { label: 'Phase 2: Nitrogen Metabolism Enzyme Filter (Phases 1 → 2)', value: 'Phase2' },
            { label: 'Phase 3: Nitrogen Sub-pathway Predictor (Phases 1 → 2 → 3)', value: 'Phase3' },
            { label: 'Phase 4: Full Pipeline & EC Assignment (Phases 1 → 2 → 3 → 4)', value: 'Phase4' },
        ];

        const pathwayOptions = [
            { label: "All Predicted Nitrogen Pathways (Default)", value: "all_models" },
            { label: "Nitrification", value: "nitri" },
            { label: "Nitrogen Fixation", value: "nfix" },
            { label: "Anammox", value: "anammox" },
            { label: "Assimilatory Nitrate Reduction", value: "assim" },
            { label: "Dissimilatory Nitrate Reduction", value: "dissim" },
            { label: "Denitrification", value: "denitri" },
            { label: "Assimilatory + Dissimilatory + Denitrification + Nitrification", value: "addn" },
            { label: "Dissimilatory + Denitrification + Nitrification", value: "ddn" },
            { label: "Denitrification + Nitrification", value: "dn" },
            { label: "Dissimilatory + Denitrification", value: "dd" }
        ];

        const pKey = (this.state.p4value === 'all' || this.state.p4value === 'all_models') ? 'all' : this.state.p4value;
        const genePlaceholder = this.state.seqtype === 'nucl' ? demoNTSequences[pKey] : demoSequences[pKey];
        const val = this.state.validationInfo;

        return (
            <div className="container main">
                <Divider />
                <div className="text-center mb-4">
                    <h3 style={{ color: '#0f2439', fontWeight: '700' }}>deepNEC-2.0 Prediction Workbench</h3>
                    <p className="text-muted small">Alignment-free, deep learning hierarchical classification and EC prediction for nitrogen metabolism</p>
                </div>

                {this.state.validationError && (
                    <div className="mb-4">
                        <Alert message="Validation / Submission Error" description={this.state.validationError} type="error" showIcon closable onClose={() => this.setState({ validationError: null })} />
                    </div>
                )}

                <div className="row">
                    {/* Left Column: Configurations */}
                    <div className="col-md-6 border-end pe-md-5 pe-3">
                        <div className="row justify-content-center mb-3">
                            <Radio.Group value={this.state.seqtype} onChange={this.SeqTyperadioHandler}>
                                <h5>1. Select Sequence Type</h5>
                                <div className="d-flex justify-content-center gap-3">
                                    <Radio value="prot">Protein Sequence</Radio>
                                    <Radio value="nucl">Nucleotide Sequence</Radio>
                                </div>
                            </Radio.Group>
                        </div>
                        <Divider style={{ margin: '20px 0' }} />

                        <div className="row justify-content-center mb-3">
                            <Radio.Group value={this.state.datatype} onChange={this.SeqMethodradioHandler}>
                                <h5>2. Select Input Mode</h5>
                                <div className="d-flex justify-content-center gap-3">
                                    <Radio value="fasta">FASTA Sequence</Radio>
                                    <Radio value="accession">Accession ID</Radio>
                                </div>
                            </Radio.Group>
                        </div>

                        {this.state.datatype === 'accession' && (
                            <>
                                <Divider style={{ margin: '20px 0' }} />
                                <div className="row justify-content-center mb-3">
                                    <Radio.Group value={this.state.acctype} onChange={this.AccessionHandler}>
                                        <h5>Select Database</h5>
                                        <div className="d-flex justify-content-center gap-3">
                                            <Radio value="ncbi">NCBI Protein</Radio>
                                            <Radio value="uniprot">UniProtKB</Radio>
                                        </div>
                                    </Radio.Group>
                                </div>
                            </>
                        )}
                        <Divider style={{ margin: '20px 0' }} />

                        <div className="row justify-content-center mb-3">
                            <div className="col-md-11 text-center">
                                <h5>3. Select Target Pipeline Depth</h5>
                                <select className="form-control kbl-form mx-auto" style={{ width: '100%' }} value={this.state.targetPhase} onChange={this.handlePhaseChange}>
                                    {phaseOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <Divider style={{ margin: '20px 0' }} />

                        {this.state.targetPhase === 'Phase4' && (
                            <div className="row justify-content-center mb-3">
                                <div className="col-md-11 text-center">
                                    <h5>4. Select Target Pathway (Phase 4)</h5>
                                    <select className="form-control kbl-form mx-auto" style={{ width: '100%' }} value={this.state.p4value} onChange={this.handlep4Change}>
                                        {pathwayOptions.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Input & Validation */}
                    <div className="col-md-6 ps-md-5 ps-3">
                        {this.state.datatype === 'fasta' && (
                            <>
                                <h5>Enter {this.state.seqtype === 'nucl' ? 'Nucleotide' : 'Protein'} FASTA Sequence</h5>
                                <Form.Control className="kbl-form mb-2" as="textarea" rows={5} placeholder={genePlaceholder} onChange={this.handleSeqChange} value={this.state.seqtxt} spellCheck={false} />

                                {val && (
                                    <div className="p-2 mb-3 bg-light border rounded text-center small" style={{ color: '#288DC2' }}>
                                        ✓ <b>{val.seqCount}</b> sequence(s) detected | Total length: <b>{val.totalLen}</b> aa | Avg length: <b>{val.avgLen}</b> aa
                                        {val.invalidCount > 0 && <span className="text-danger ms-2">⚠️ {val.invalidCount} non-standard lines</span>}
                                    </div>
                                )}

                                <div className="col-md-12 text-center mb-3">
                                    <Button className="kbl-btn-1 mx-2" onClick={() => {
                                        const sample = genePlaceholder;
                                        const valInfo = this.validateSequenceInput(sample, this.state.seqtype);
                                        this.setState({ seqtxt: sample, validationInfo: valInfo });
                                    }}>Load Sample Data</Button>
                                    <Button className="kbl-btn-3" onClick={() => this.setState({ seqtxt: "", validationInfo: null })}>Clear</Button>
                                </div>
                                <div className="row justify-content-center my-2"><b>OR</b></div>
                                <div className="row justify-content-center mb-3">
                                    <h5 className="w-100 text-center mb-2">Upload FASTA File</h5>
                                    <FileInput handler={this.fileSelected} />
                                </div>
                            </>
                        )}

                        {this.state.datatype === 'accession' && (
                            <>
                                <h5>Paste Accession IDs</h5>
                                <Form.Control className="kbl-form mb-3" as="textarea" rows={5} value={this.state.accession} onChange={this.handleSearch} placeholder="Enter Accession IDs (one per line or space-separated)..." spellCheck={false} />
                                <div className="col-md-12 text-center mb-3">
                                    <Button className="kbl-btn-1 mx-2" onClick={() => {
                                        const sample = demoAccessions[this.state.acctype] ? demoAccessions[this.state.acctype][pKey] : "";
                                        this.setState({ accession: sample });
                                    }}>Load Sample IDs</Button>
                                    <Button className="kbl-btn-3" onClick={() => this.setState({ accession: "" })}>Clear</Button>
                                </div>
                                <div className="row justify-content-center my-2"><b>OR</b></div>
                                <div className="row justify-content-center mb-3">
                                    <h5 className="w-100 text-center mb-2">Upload Accession List File</h5>
                                    <FileInput handler={this.accessionFileSelected} />
                                </div>
                            </>
                        )}

                        <Divider style={{ margin: '20px 0' }} />
                        <div className="row justify-content-center">
                            <h5 className="w-100 text-center mb-1">Optional: GFF3 Genome Annotation</h5>
                            <p className="text-center w-100 px-3 small text-muted">Upload a GFF3 file to automatically annotate genomic features with predicted pathways and EC numbers.</p>
                            <FileInput handler={this.gffFileSelected} />
                            {this.state.gfftxt && (
                                <div className="text-success mt-2 text-center w-100 font-weight-bold">✓ GFF file loaded successfully.</div>
                            )}
                        </div>
                    </div>
                </div>

                <Divider />
                <div className="row justify-content-center text-center my-4">
                    {this.state.isOpen ? (
                        <div className="col-12 my-3">
                            <h5 className="mb-2" style={{ color: '#0f2439', fontWeight: '600' }}>
                                Running DeepNEC 2.0 Pipeline: {this.state.progressPercent}%
                            </h5>
                            <img src={test} className="loading mb-3" height="50px" alt="Loading" />
                            <div className="mx-auto" style={{ maxWidth: '500px' }}>
                                <div className="progress mb-2" style={{ height: '12px', borderRadius: '6px' }}>
                                    <div className="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style={{ width: `${this.state.progressPercent}%`, backgroundColor: '#288DC2' }} />
                                </div>
                                <p className="text-muted small font-weight-bold">{this.state.progressStage || 'Processing query...'}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="col-12">
                            <Button className="kbl-btn-1" style={{ fontSize: '18px', fontWeight: 'bold', borderRadius: '8px', padding: '14px 45px', height: 'auto' }} onClick={this.runPrediction}>
                                Submit Prediction Job
                            </Button>
                        </div>
                    )}
                </div>
                <Divider />
            </div>
        );
    }
}
