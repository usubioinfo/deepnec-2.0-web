// Author: Naveen Duhan
import React from 'react';
import axios from 'axios';
import "./Results.scss";
import { env } from 'env';
import PhaseTable from './rtable';
import MotifTable from './mstable';
import { Divider } from 'antd';
import { Button } from 'react-bootstrap';
import { fetchResults } from "./nextFetchResults";
import test from './test.gif';

const PDBViewer = React.lazy(() => import('../../Components/PDBviewer/PDBviewer'));

export default class Results extends React.Component {
    constructor(props) {
        super(props);
        const searchParams = new URLSearchParams(window.location.search);
        const initialPhase = searchParams.get('phase') || 'Phase4';

        this.state = {
            namer: searchParams.get('namer'),
            phase: initialPhase,
            ecnumber: searchParams.get('ecnumber') || 'all_models',
            results: null,
            selectedPhase: initialPhase,
            isOpen: false,

            // 3D Structure Viewer state variables
            selectedSampleId: null,
            structureData: null,
            loadingStructure: false,
            structureError: null,
            checkedMotifs: [],
            highlightedResidues: [],
            selectedSeqLength: null
        };

        this.handlePhaseChange = this.handlePhaseChange.bind(this);
        this.downloadCSV = this.downloadCSV.bind(this);
        this.downloadJSON = this.downloadJSON.bind(this);
        this.predictNextPhase = this.predictNextPhase.bind(this);
    }

    getSampleIds = () => {
        const { results } = this.state;
        if (!results) return [];
        const sampleIds = [];
        const phases = ['Phase4', 'Phase3', 'Phase2', 'Phase1'];
        for (const ph of phases) {
            if (results[ph] && results[ph].length > 0) {
                results[ph].forEach(row => {
                    if (row.SampleID && !sampleIds.includes(row.SampleID)) {
                        sampleIds.push(row.SampleID);
                    }
                });
                break;
            }
        }
        return sampleIds;
    };

    loadStructureData = async (sampleId) => {
        const motifData = this.state.results?.motifScan?.find(m => m.SampleID === sampleId);
        const seqLength = motifData ? parseInt(motifData.Sequence_Length) : null;
        this.setState({
            loadingStructure: true,
            loadingSampleId: sampleId,
            structureError: null,
            structureData: null,
            highlightedResidues: [],
            checkedMotifs: [],
            selectedSeqLength: seqLength
        });
        try {
            const response = await axios.get(`${env.BACKEND}/api/struct`, {
                params: {
                    namer: this.state.namer,
                    phase: this.state.phase,
                    ecnumber: this.state.ecnumber,
                    acc_extract: sampleId
                }
            });
            this.setState(prevState => ({
                structureData: response.data,
                loadingStructure: false,
                loadingSampleId: null,
                loadedStructuresMap: {
                    ...(prevState.loadedStructuresMap || {}),
                    [sampleId]: true
                }
            }));
        } catch (error) {
            console.error("Error loading structure:", error);
            const errMsg = error.response?.data?.error || "Error predicting or loading tertiary structure. Note: If the sequence is > 400 amino acids, the job is submitted to Swiss-Model, which may take up to 2 minutes.";
            this.setState({
                structureError: errMsg,
                loadingStructure: false,
                loadingSampleId: null
            });
        }
    };

    findMotifPositions = (sequence, motifType) => {
        if (!sequence) return [];
        let regex;
        if (motifType === 'Heme_Binding_CXXCH') {
            regex = /C[A-Z]{2}CH/gi;
        } else if (motifType === 'Iron_Sulfur_CxxC') {
            regex = /C[A-Z]{2}C/gi;
        } else {
            return [];
        }

        const positions = [];
        let match;
        while ((match = regex.exec(sequence)) !== null) {
            const start = match.index + 1; // 1-indexed for biological residue numbers
            const end = start + match[0].length - 1;
            for (let i = start; i <= end; i++) {
                positions.push(i);
            }
        }
        return positions;
    };

    handleMotifCheckboxChange = (motifType, isChecked) => {
        this.setState(prevState => {
            const nextChecked = isChecked
                ? [...prevState.checkedMotifs, motifType]
                : prevState.checkedMotifs.filter(t => t !== motifType);

            let highlightedResidues = [];
            const seq = prevState.structureData?.sequence || '';
            nextChecked.forEach(type => {
                const pos = this.findMotifPositions(seq, type);
                highlightedResidues = [...highlightedResidues, ...pos];
            });

            return {
                checkedMotifs: nextChecked,
                highlightedResidues: highlightedResidues
            };
        });
    };

    getReadableRanges = (residues) => {
        if (!residues || residues.length === 0) return '';
        const sorted = [...new Set(residues)].sort((a, b) => a - b);
        const ranges = [];
        let start = sorted[0];
        let prev = sorted[0];

        for (let i = 1; i <= sorted.length; i++) {
            if (i === sorted.length || sorted[i] !== prev + 1) {
                if (start === prev) {
                    ranges.push(`${start}`);
                } else {
                    ranges.push(`${start}-${prev}`);
                }
                if (i < sorted.length) {
                    start = sorted[i];
                    prev = sorted[i];
                }
            } else {
                prev = sorted[i];
            }
        }
        return ranges.join(', ');
    };

    componentDidMount() {
        this.getResults();
    }

    openModel = () => this.setState({ isOpen: true });
    closeModel = () => this.setState({ isOpen: false });

    async getResults() {
        try {
            const response = await axios.get(
                `${env.BACKEND}/api/results`,
                {
                    params: {
                        namer: this.state.namer,
                        phase: this.state.phase,
                        ecnumber: this.state.ecnumber
                    }
                }
            );
            console.log(response.data);

            this.setState({ results: response.data });
        } catch (error) {
            console.error('Error fetching results:', error);
        }
    }

    handlePhaseChange(phase) {
        this.setState({ selectedPhase: phase }, () => {
            if (phase === '3dstructure') {
                const sampleIds = this.getSampleIds();
                if (sampleIds.length > 0 && !this.state.selectedSampleId) {
                    this.setState({ selectedSampleId: sampleIds[0] });
                    this.loadStructureData(sampleIds[0]);
                }
            }
        });
    }

    // CSV / TSV Download Function with Provenance Metadata
    downloadCSV() {
        const { selectedPhase, results } = this.state;
        const phaseData = results[selectedPhase];

        if (!phaseData || phaseData.length === 0) return;

        const headers = Object.keys(phaseData[0]).filter(header => header !== "pred");
        const csvRows = [];

        // Add Provenance Metadata Header
        csvRows.push(`# DeepNEC Framework Version: 2.0.0`);
        csvRows.push(`# Phase 1 Architecture: Ultimate Hybrid Fold 5 LoRA + 2968 Descriptors (4248-dim)`);
        csvRows.push(`# Run Date: ${new Date().toISOString()}`);
        csvRows.push(`# Job ID: ${this.state.namer}`);
        csvRows.push(`# Exported Phase: ${selectedPhase}`);
        csvRows.push('');

        // Add headers
        csvRows.push(headers.join('\t'));

        // Add data rows
        for (const row of phaseData) {
            const values = headers.map(header => row[header]);
            csvRows.push(values.join('\t'));
        }

        // Create TSV string
        const csvString = csvRows.join('\n');

        // Trigger file download
        const blob = new Blob([csvString], { type: 'text/tab-separated-values' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedPhase}_deepnec2_predictions.tsv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // JSON Download Function
    downloadJSON() {
        const { selectedPhase, results } = this.state;
        const phaseData = results[selectedPhase];

        if (!phaseData) return;

        const jsonString = JSON.stringify(phaseData, null, 2);  // Pretty-print JSON

        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedPhase}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    predictNextPhase() {
        this.openModel();
        const currentPhaseNumber = parseInt(this.state.phase.replace('Phase', ''));
        const nextPhaseNumber = currentPhaseNumber + 1;
        const nextPhase = `Phase${nextPhaseNumber}`;

        let data = new FormData();
        data.append('phase', nextPhase);
        data.append('namer', this.state.namer);
        data.append('ecnumber', this.state.ecnumber.toLowerCase());

        fetchResults(data)
        .then(res => {
            this.closeModel();
            window.location.assign(`/deepnec-2.0/results?namer=${res['namer']}&phase=${nextPhase}&ecnumber=${this.state.ecnumber.toLowerCase()}`);
        });
    }

    render() {
        const { results, selectedPhase, phase } = this.state;
        const data = results || {};
        const currentPhaseNumber = parseInt(phase.replace('Phase', ''));
        const isNotPhase4 = currentPhaseNumber < 4;

        const phasesToDisplay = [];
        for (let i = 1; i <= currentPhaseNumber; i++) {
            phasesToDisplay.push(`Phase${i}`);
        }

        const sampleIds = this.getSampleIds();

        const mainTabs = [
            { key: 'workflow', label: 'Prediction Results' },
            { key: 'motifScan', label: 'Motif Analysis' }
        ];
        if (sampleIds.length > 0) {
            mainTabs.push({ key: '3dstructure', label: '3D Structure' });
        }
        if (phase === 'Phase4') {
            mainTabs.push(
                { key: 'visualize', label: 'Visualizations' },
                { key: 'gff', label: 'GFF Annotation' }
            );
        }

        // Active tab matching logic
        let activeTopTab = 'workflow';
        if (['motifScan', '3dstructure', 'visualize', 'gff'].includes(selectedPhase)) {
            activeTopTab = selectedPhase;
        }

        const handleTopTabChange = (key) => {
            if (key === 'workflow') {
                this.handlePhaseChange(`Phase${currentPhaseNumber}`);
            } else {
                this.handlePhaseChange(key);
            }
        };

        return (
            <div className='container main' style={{ backgroundColor: '#ffffff', minHeight: '80vh', padding: '30px', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '20px', boxShadow: '0 4px 20px rgba(15, 36, 57, 0.02)' }}>
                <Divider />
                <h4 style={{ color: '#0F2439', fontWeight: 'bold' }}>deepNEC-2.0 Results</h4>
                <Divider />

                {/* Top level tabs */}
                <div className="results-tab-bar">
                    {mainTabs.map((tab, idx) => (
                        <button
                            key={idx}
                            className="btn btn-link mx-3 px-3 py-2"
                            style={{
                                borderBottom: activeTopTab === tab.key ? '3px solid #2B6CB0' : '3px solid transparent',
                                color: activeTopTab === tab.key ? '#0F2439' : '#64748b',
                                fontWeight: activeTopTab === tab.key ? 'bold' : 'normal',
                                textDecoration: 'none',
                                fontSize: '1.05rem',
                                transition: 'all 0.2s ease',
                                borderTop: 'none',
                                borderLeft: 'none',
                                borderRight: 'none',
                                background: 'none'
                            }}
                            onClick={() => handleTopTabChange(tab.key)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Chevron-style Phase workflow Stepper */}
                {activeTopTab === 'workflow' && (
                    <div className="chevron-stepper">
                        {phasesToDisplay.map((p, index) => {
                            const phaseNum = index + 1;
                            const isCompleted = phaseNum < currentPhaseNumber;
                            const isActive = selectedPhase === p;
                            let nodeClass = "step-node";
                            if (isCompleted) nodeClass += " completed";
                            if (isActive) nodeClass += " active";

                            return (
                                <div
                                    key={index}
                                    className={nodeClass}
                                    onClick={() => this.handlePhaseChange(p)}
                                >
                                    <span className="step-icon">
                                        {isCompleted ? '✓' : phaseNum}
                                    </span>
                                    <span>
                                        Phase {phaseNum}: {phaseNum === 1 ? 'Enzyme' : phaseNum === 2 ? 'N-Metabolism' : phaseNum === 3 ? 'Pathway' : 'EC Number'}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}

                <Divider />

                {/* 1. Render standard Phase prediction tables */}
                {selectedPhase.startsWith('Phase') && (
                    <>
                        <PhaseTable
                            phaseData={data[selectedPhase] || []}
                            phase={selectedPhase}
                            namer={this.state.namer}
                            ecnumber={this.state.ecnumber}
                            predmethod={this.state.predmethod}
                            loadedStructuresMap={this.state.loadedStructuresMap || {}}
                            loadingSampleId={this.state.loadingStructure ? this.state.selectedSampleId : null}
                            onViewStructure={(sampleId) => {
                                this.handlePhaseChange('3dstructure');
                                this.setState({ selectedSampleId: sampleId });
                                if (!this.state.loadedStructuresMap?.[sampleId]) {
                                    this.loadStructureData(sampleId);
                                }
                            }}
                        />
                        <Divider />
                        <Button className="kbl-btn-1 mx-5 lg" onClick={this.downloadCSV}>Download {selectedPhase} CSV</Button>
                        <Button className="kbl-btn-1 mx-5 lg" onClick={this.downloadJSON}>Download {selectedPhase} JSON</Button>
                    </>
                )}

                {/* 2. Render Motif Scanner table */}
                {selectedPhase === 'motifScan' && (
                    <MotifTable motifData={data['motifScan'] || []} namer={this.state.namer} />
                )}

                {selectedPhase === '3dstructure' && (
                    <div className="my-4">
                        <Divider>Interactive 3D Structure Viewer (NGL)</Divider>

                        <div className="row g-4 align-items-center mb-4">
                            <div className="col-md-5">
                                <h6 className="text-muted small text-uppercase font-weight-bold mb-2">Select Sequence to Visualize</h6>
                                <select
                                    className="form-control kbl-form"
                                    value={this.state.selectedSampleId || ''}
                                    onChange={(e) => {
                                        const sampleId = e.target.value;
                                        this.setState({ selectedSampleId: sampleId });
                                        this.loadStructureData(sampleId);
                                    }}
                                >
                                    {this.getSampleIds().map((id, index) => (
                                        <option key={index} value={id}>{id}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {this.state.loadingStructure && (
                            <div className="text-center my-5 p-5 border rounded bg-light shadow-sm">
                                <div className="spinner-border text-primary mb-3" role="status"></div>
                                <h5>Generating 3D Structure Model...</h5>
                                {this.state.selectedSeqLength !== null ? (
                                    <div className="mt-2">
                                        <p className="mb-1 font-weight-bold">
                                            Sequence Length: <span className="text-primary">{this.state.selectedSeqLength} AA</span>
                                        </p>
                                        <p className="text-muted small mb-0">
                                            {this.state.selectedSeqLength <= 400 ? (
                                                <span>Using <strong>ESMFold API</strong> (optimal for sequences ≤ 400 AA, processing may take around 25-30 seconds).</span>
                                            ) : (
                                                <span>Using <strong>Swiss-Model</strong> (required for sequences > 400 AA, processing may take up to 2 minutes).</span>
                                            )}
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-muted small mb-0">
                                        Folding sequence via ESMFold API (takes around 25-30 seconds). If the sequence is longer than 400 AA, this will automatically fall back to Swiss-Model, which may take up to 2 minutes.
                                    </p>
                                )}
                            </div>
                        )}

                        {this.state.structureError && (
                            <div className="alert alert-danger p-4 shadow-sm border-0 rounded my-4">
                                <h5 className="alert-heading font-weight-bold mb-2">Structure Prediction Failed</h5>
                                <p className="mb-0">{this.state.structureError}</p>
                            </div>
                        )}

                        {!this.state.loadingStructure && !this.state.structureError && this.state.structureData && (
                            <div className="row mt-3">
                                {/* 3D Canvas Column */}
                                <div className="col-lg-8 mb-4">
                                    <React.Suspense fallback={<div className="p-5 text-center text-muted font-weight-bold">Loading 3D Molecule Canvas...</div>}>
                                        <PDBViewer
                                            pdbData={this.state.structureData}
                                            highlightResidues={this.state.highlightedResidues}
                                        />
                                    </React.Suspense>
                                </div>

                                {/* Motifs Highlight Panel Column */}
                                <div className="col-lg-4">
                                    <div className="card shadow-sm p-4 border rounded bg-light h-100">
                                        <h5 className="font-weight-bold mb-3">Active Site / Motif Scanner</h5>

                                        <div className="mb-4 p-3 rounded border bg-white small">
                                            <div className="d-flex justify-content-between mb-1">
                                                <span className="text-muted">Sequence Length:</span>
                                                <span className="font-weight-bold text-dark">{this.state.structureData?.sequence?.length || this.state.selectedSeqLength || 0} AA</span>
                                            </div>
                                            <div className="d-flex justify-content-between">
                                                <span className="text-muted">Folding Method:</span>
                                                <span className="font-weight-bold text-primary">
                                                    {(this.state.structureData?.sequence?.length || this.state.selectedSeqLength || 0) <= 400 ? "ESMFold API" : "Swiss-Model"}
                                                </span>
                                            </div>
                                        </div>

                                        <p className="text-muted small mb-4">
                                            Select cofactors or metal-binding motifs to highlight their spatial arrangement on the 3D structure:
                                        </p>

                                        {(() => {
                                            const sampleMotif = (data['motifScan'] || []).find(m => m.SampleID === this.state.selectedSampleId) || {};
                                            const seq = this.state.structureData?.sequence || '';

                                            // Helper to render motif check rows
                                            const renderMotifRow = (label, dbKey) => {
                                                const count = parseInt(sampleMotif[dbKey] || 0);
                                                const pos = this.findMotifPositions(seq, dbKey);
                                                const hasMotif = count > 0;
                                                const isChecked = this.state.checkedMotifs.includes(dbKey);

                                                return (
                                                    <div className={`p-3 rounded mb-3 border ${hasMotif ? 'bg-white' : 'bg-light'} d-flex align-items-start gap-3`} key={dbKey}>
                                                        <input
                                                            type="checkbox"
                                                            className="mt-1"
                                                            disabled={!hasMotif}
                                                            checked={isChecked}
                                                            onChange={(e) => this.handleMotifCheckboxChange(dbKey, e.target.checked)}
                                                            style={{ width: '18px', height: '18px', cursor: hasMotif ? 'pointer' : 'not-allowed' }}
                                                        />
                                                        <div>
                                                            <div className="d-flex align-items-center gap-2">
                                                                <span className={`font-weight-bold ${hasMotif ? 'text-dark' : 'text-muted'}`}>{label}</span>
                                                                <span className={`badge ${hasMotif ? 'bg-primary' : 'bg-secondary'}`}>{count} found</span>
                                                            </div>
                                                            {hasMotif && (
                                                                <div className="text-muted small mt-1 font-monospace">
                                                                    Residues: {this.getReadableRanges(pos)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            };

                                            return (
                                                <div className="motif-check-list">
                                                    {renderMotifRow("Heme Binding (CXXCH)", "Heme_Binding_CXXCH")}
                                                    {renderMotifRow("Iron Sulfur (CxxC)", "Iron_Sulfur_CxxC")}

                                                    {/* Legend info */}
                                                    <div className="mt-4 p-3 rounded bg-white border small text-muted">
                                                        <div className="font-weight-bold mb-2">Color Coding Legend:</div>
                                                        <div className="d-flex align-items-start gap-2 mb-2">
                                                            <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ff00ff', flexShrink: 0, marginTop: '4px' }}></span>
                                                            <span>Selected Motif Highlight (Bright Magenta Selection)</span>
                                                        </div>
                                                        <div className="d-flex align-items-start gap-2">
                                                            <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', background: 'linear-gradient(90deg, #3b73ac, #a2aaad)', flexShrink: 0, marginTop: '4px' }}></span>
                                                            <span>Other regions color-coded according to NGL Color Scheme selection (e.g. B-Factor, Element, etc.)</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* 3. Render Visualizations Dashboard */}
                {selectedPhase === 'visualize' && (
                    <div className="my-4">
                        <Divider>Publication-Ready Figure Dashboard</Divider>
                        {this.state.results?.Phase4 && this.state.results.Phase4.length > 0 ? (
                            <div className="row justify-content-center mt-4">
                                <div className="col-md-6 mb-4">
                                    <div className="card shadow-sm p-3 border rounded text-center">
                                        <h5 className="mb-3">Sequence Count per Nitrogen Pathway</h5>
                                        <img src={`${env.BACKEND}/api/download/${this.state.namer}/pathway_distribution.png`} alt="Pathway Distribution" className="img-fluid rounded" />
                                    </div>
                                </div>
                                <div className="col-md-6 mb-4">
                                    <div className="card shadow-sm p-3 border rounded text-center">
                                        <h5 className="mb-3">Distribution of Predicted EC Numbers</h5>
                                        <img src={`${env.BACKEND}/api/download/${this.state.namer}/ec_distribution.png`} alt="EC Distribution" className="img-fluid rounded" />
                                    </div>
                                </div>
                                <div className="col-md-8 mb-4">
                                    <div className="card shadow-sm p-3 border rounded text-center">
                                        <h5 className="mb-3">Pathway Completeness Heatmap Profile</h5>
                                        <img src={`${env.BACKEND}/api/download/${this.state.namer}/pathway_completeness.png`} alt="Pathway Completeness" className="img-fluid rounded" />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center my-5 p-5 border rounded bg-light shadow-sm">
                                <h5>Visualizations Unavailable</h5>
                                <p className="text-muted small mb-0">
                                    No positive Nitrogen Metabolism pathway enzymes were predicted in Phase 4. Visualizations are only generated when positive predictions are identified.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* 4. Render GFF Genome Annotation integration */}
                {selectedPhase === 'gff' && (
                    <div className="my-4 text-center">
                        <Divider>Genomic GFF3 Annotation</Divider>
                        {data['hasAnnotatedGff'] ? (
                            <div className="p-5 border rounded bg-light shadow-sm my-4" style={{ maxWidth: '700px', margin: '0 auto' }}>
                                <h3 className="text-success mb-3">✓ Genome Annotation Succeeded</h3>
                                <p className="mb-4" style={{ color: '#555' }}>
                                    Your genome annotations have been updated. Nitrogen metabolism pathways, specific enzyme commissions (EC numbers), and prediction confidence attributes have been successfully written to the GFF3 properties.
                                </p>
                                <Button className="kbl-btn-1 lg px-5 py-3" style={{ fontSize: '16px' }} href={`${env.BACKEND}/api/download/${this.state.namer}/annotated_output.gff`} download>
                                    Download Annotated GFF3 File
                                </Button>
                            </div>
                        ) : (
                            <div className="p-5 border rounded bg-light shadow-sm my-4" style={{ maxWidth: '700px', margin: '0 auto' }}>
                                <h3 className="text-warning mb-3">Genomic Annotation GFF3</h3>
                                <p className="mb-3" style={{ color: '#555' }}>
                                    No genome GFF3 file was uploaded for this prediction run.
                                </p>
                                <p style={{ fontSize: '13px', color: '#777' }}>
                                    To generate an annotated genome GFF3 file, please upload your original GFF/GFF3 file alongside the sequence file under the **Optional: GFF3 Genome Annotation** panel on the Prediction page.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {isNotPhase4 && this.state.isOpen && (
                    <img src={test} className="loading" height="50px" alt="" />
                )}
                {isNotPhase4 && this.state.isOpen === false && selectedPhase.startsWith('Phase') && (
                    <Button className="kbl-btn-1 mx-5 lg" onClick={this.predictNextPhase}>Predict Next Phase</Button>
                )}

                <Divider />
            </div>
        );
    }
}
