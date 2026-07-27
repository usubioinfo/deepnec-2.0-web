// Author: Naveen Duhan
import React from 'react';
import { Table, Button, Spinner, Card } from 'react-bootstrap';
import { Divider } from 'antd';
import axios from 'axios';
import { env } from '../../env';
import './Results.scss';
import '../../scss/components/buttons.scss';
import '../../scss/components/forms.scss';
import '../../scss/style.scss';

const motifRegexes = {
    'Heme_Binding_CXXCH': /C[A-Z]{2}CH/gi,
    'Iron_Sulfur_CxxC': /C[A-Z]{2}C/gi,
    'Rossmann_Fold': /[LIVMFYGA]{6}.{0,5}[DE]/gi,
    'NADP_Basic': /[KR].{2,4}[KR].{6,10}[LIVMFY]/gi,
    'NAD_Acidic': /D[DED].{6,12}[LIVMFY]/gi,
    'Ferredoxin_FeS': /C.{2,4}C.{2,4}C.{3,15}C/gi,
    'Mo_MGD_Binding': /C.{2,4}C.{10,30}C/gi
};

const motifColors = {
    'Heme_Binding_CXXCH': { bg: '#ff00ff', text: '#ffffff', label: 'Heme Binding (CXXCH)' },
    'Iron_Sulfur_CxxC': { bg: '#10b981', text: '#ffffff', label: 'Iron-Sulfur (CxxC)' },
    'Ferredoxin_FeS': { bg: '#f97316', text: '#ffffff', label: 'Ferredoxin FeS' },
    'Mo_MGD_Binding': { bg: '#8b5cf6', text: '#ffffff', label: 'Mo-MGD Binding' },
    'Rossmann_Fold': { bg: '#4ade80', text: '#1e293b', label: 'Rossmann Fold' },
    'NADP_Basic': { bg: '#60a5fa', text: '#ffffff', label: 'NADP Basic' },
    'NAD_Acidic': { bg: '#facc15', text: '#1e293b', label: 'NAD Acidic' }
};

const priorityList = [
    'Heme_Binding_CXXCH',
    'Iron_Sulfur_CxxC',
    'Ferredoxin_FeS',
    'Mo_MGD_Binding',
    'Rossmann_Fold',
    'NADP_Basic',
    'NAD_Acidic'
];

export default class MotifTable extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedSampleId: null,
            sequence: null,
            loading: false,
            error: null,
            activeFilter: 'all' // 'all' or specific motif key
        };
    }

    componentDidMount() {
        const { motifData } = this.props;
        if (motifData && motifData.length > 0) {
            const firstId = motifData[0].SampleID;
            this.selectSample(firstId);
        }
    }

    componentDidUpdate(prevProps, prevState) {
        // If the motifData changes (e.g., new run), reset to the first item
        if (prevProps.motifData !== this.props.motifData && this.props.motifData && this.props.motifData.length > 0) {
            const firstId = this.props.motifData[0].SampleID;
            this.selectSample(firstId);
        }
    }

    selectSample = async (sampleId) => {
        this.setState({ selectedSampleId: sampleId, loading: true, error: null, sequence: null });
        try {
            const response = await axios.get(`${env.BACKEND}/api/sequence`, {
                params: {
                    namer: this.props.namer,
                    acc_extract: sampleId
                }
            });
            this.setState({ sequence: response.data.sequence, loading: false });
        } catch (err) {
            console.error("Error fetching sequence for motif highlight:", err);
            this.setState({ error: "Failed to load sequence for visual highlight.", loading: false });
        }
    };

    getResidueHighlights = (sequence) => {
        if (!sequence) return [];
        const residues = sequence.split('').map((char, index) => ({
            char,
            pos: index + 1,
            motifs: []
        }));

        Object.entries(motifRegexes).forEach(([motifName, regex]) => {
            regex.lastIndex = 0;
            let match;
            while ((match = regex.exec(sequence)) !== null) {
                const start = match.index;
                const end = start + match[0].length;
                for (let i = start; i < end; i++) {
                    if (residues[i]) {
                        residues[i].motifs.push(motifName);
                    }
                }
                if (match.index === regex.lastIndex) {
                    regex.lastIndex++;
                }
            }
        });

        return residues;
    };

    renderSequenceHighlight = (residues) => {
        const { activeFilter } = this.state;
        const lines = [];
        const lineLength = 60;

        for (let i = 0; i < residues.length; i += lineLength) {
            lines.push(residues.slice(i, i + lineLength));
        }

        const aaNames = {
            'A': 'Alanine', 'R': 'Arginine', 'N': 'Asparagine', 'D': 'Aspartate',
            'C': 'Cysteine', 'E': 'Glutamate', 'Q': 'Glutamine', 'G': 'Glycine',
            'H': 'Histidine', 'I': 'Isoleucine', 'L': 'Leucine', 'K': 'Lysine',
            'M': 'Methionine', 'F': 'Phenylalanine', 'P': 'Proline', 'S': 'Serine',
            'T': 'Threonine', 'W': 'Tryptophan', 'Y': 'Tyrosine', 'V': 'Valine'
        };

        return (
            <div className="font-monospace text-dark p-3 rounded border bg-light shadow-sm" style={{ fontSize: '14px', lineHeight: '2.2', overflowX: 'auto' }}>
                {lines.map((line, lineIdx) => {
                    const startPos = lineIdx * lineLength + 1;
                    return (
                        <div key={lineIdx} className="d-flex align-items-center mb-1 hover-line-bg" style={{ minWidth: 'fit-content', whiteSpace: 'nowrap' }}>
                            <span className="text-muted text-end me-3 select-none" style={{ width: '40px', fontSize: '12px', fontFamily: 'monospace' }}>
                                {startPos}
                            </span>
                            <div className="d-flex align-items-center">
                                {line.map((res, resIdx) => {
                                    // Determine which motif to show based on active filter or priority list
                                    let activeMotif = null;
                                    if (activeFilter === 'all') {
                                        activeMotif = priorityList.find(m => res.motifs.includes(m));
                                    } else if (res.motifs.includes(activeFilter)) {
                                        activeMotif = activeFilter;
                                    }

                                    const colorInfo = activeMotif ? motifColors[activeMotif] : null;
                                    const style = colorInfo ? {
                                        backgroundColor: colorInfo.bg,
                                        color: colorInfo.text,
                                        fontWeight: 'bold',
                                        borderRadius: '3px',
                                        padding: '1px 0',
                                        cursor: 'help',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                                        width: '12px',
                                        textAlign: 'center',
                                        display: 'inline-block'
                                    } : {
                                        width: '12px',
                                        textAlign: 'center',
                                        display: 'inline-block',
                                        color: '#334155'
                                    };

                                    const tooltipText = `Residue ${res.pos}: ${aaNames[res.char] || res.char} (${res.char})` +
                                        (res.motifs.length > 0 ? ` | Motifs: ${res.motifs.map(m => motifColors[m].label).join(', ')}` : '');

                                    const isSpacer = (resIdx + 1) % 10 === 0 && resIdx !== line.length - 1;

                                    return (
                                        <React.Fragment key={resIdx}>
                                            <span
                                                style={style}
                                                title={tooltipText}
                                                className="seq-char-hover"
                                            >
                                                {res.char}
                                            </span>
                                            {isSpacer && <span style={{ width: '10px', display: 'inline-block' }}></span>}
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    render() {
        const { motifData } = this.props;
        const { selectedSampleId, sequence, loading, error, activeFilter } = this.state;

        if (!motifData || motifData.length === 0) {
            return (
                <div className="text-center my-4">
                    <h5>No motif scanning data available for this run.</h5>
                </div>
            );
        }

        const headers = [
            { key: 'SampleID', label: 'Sample ID' },
            { key: 'Sequence_Length', label: 'Length (aa)' },
            { key: 'Rossmann_Fold', label: 'Rossmann Fold' },
            { key: 'NADP_Basic', label: 'NADP Basic' },
            { key: 'NAD_Acidic', label: 'NAD Acidic' },
            { key: 'Ferredoxin_FeS', label: 'Ferredoxin FeS' },
            { key: 'Mo_MGD_Binding', label: 'Mo-MGD' },
            { key: 'Heme_Binding_CXXCH', label: 'Heme (CXXCH)' },
            { key: 'Iron_Sulfur_CxxC', label: 'Iron-Sulfur (CxxC)' }
        ];

        const residues = this.getResidueHighlights(sequence);

        return (
            <div className="my-4">
                <Divider>Biological Motif Scanning Results</Divider>
                <p className="text-muted text-center small mb-3">
                    Click any sequence row below to view its primary sequence and highlight identified structural motifs.
                </p>
                <div className="table-responsive shadow-sm rounded border mb-4">
                    <Table hover className="text-center kbl-table mb-0">
                        <thead className="kbl-thead">
                            <tr>
                                {headers.map(h => (
                                    <th key={h.key}>{h.label}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {motifData.map((row, idx) => {
                                const isSelected = selectedSampleId === row.SampleID;
                                return (
                                    <tr
                                        key={idx}
                                        onClick={() => this.selectSample(row.SampleID)}
                                        style={{ cursor: 'pointer', backgroundColor: isSelected ? '#f1f5f9' : '' }}
                                        className={isSelected ? 'table-active' : ''}
                                    >
                                        {headers.map(h => (
                                            <td key={h.key} style={{ fontWeight: isSelected && h.key === 'SampleID' ? 'bold' : 'normal' }}>
                                                {row[h.key] !== null ? row[h.key] : 0}
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </Table>
                </div>

                {selectedSampleId && (
                    <Card className="shadow-sm border border-light rounded p-4 my-4">
                        <h5 className="mb-3 d-flex align-items-center justify-content-between">
                            <span>
                                Sequence Motif Highlights: <strong className="text-primary">{selectedSampleId}</strong>
                            </span>
                            {sequence && (
                                <Button
                                    size="sm"
                                    variant="outline-secondary"
                                    onClick={() => this.setState({ activeFilter: 'all' })}
                                    disabled={activeFilter === 'all'}
                                >
                                    Show All Motifs
                                </Button>
                            )}
                        </h5>

                        {loading && (
                            <div className="text-center py-5">
                                <Spinner animation="border" role="status" variant="primary" />
                                <div className="mt-2 text-muted">Retrieving primary sequence...</div>
                            </div>
                        )}

                        {error && (
                            <div className="alert alert-warning my-2">{error}</div>
                        )}

                        {!loading && !error && sequence && (
                            <div className="row g-4">
                                <div className="col-lg-9">
                                    {this.renderSequenceHighlight(residues)}
                                </div>
                                <div className="col-lg-3">
                                    <Card className="p-3 rounded border bg-white shadow-xs">
                                        <div className="font-weight-bold mb-2 small text-uppercase text-muted">Filter Highlight:</div>
                                        <div className="d-flex flex-column gap-2">
                                            {priorityList.map(motifKey => {
                                                const colorInfo = motifColors[motifKey];
                                                const isActive = activeFilter === motifKey;
                                                const hasMotif = residues.some(r => r.motifs.includes(motifKey));

                                                return (
                                                    <button
                                                        key={motifKey}
                                                        onClick={() => this.setState({ activeFilter: motifKey })}
                                                        className="btn btn-sm text-start d-flex align-items-center justify-content-between p-2 rounded border"
                                                        style={{
                                                            borderColor: isActive ? '#3b82f6' : '#e2e8f0',
                                                            backgroundColor: isActive ? '#f0f7ff' : '#ffffff',
                                                            opacity: hasMotif ? 1 : 0.6
                                                        }}
                                                    >
                                                        <div className="d-flex align-items-center gap-2">
                                                            <span style={{
                                                                display: 'inline-block',
                                                                width: '12px',
                                                                height: '12px',
                                                                borderRadius: '50%',
                                                                backgroundColor: colorInfo.bg,
                                                                border: '1px solid rgba(0,0,0,0.1)'
                                                            }}></span>
                                                            <span className="small text-dark" style={{ fontWeight: isActive ? 'bold' : 'normal' }}>
                                                                {colorInfo.label}
                                                            </span>
                                                        </div>
                                                        {hasMotif && <span className="badge bg-light text-dark border small">found</span>}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </Card>
                                </div>
                            </div>
                        )}
                    </Card>
                )}
            </div>
        );
    }
}
