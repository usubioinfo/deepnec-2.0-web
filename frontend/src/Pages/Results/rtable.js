// Author: Naveen Duhan
import React from 'react';
import axios from 'axios';
import { env } from '../../env';
import test from './test.gif';
import { Table, Button } from 'react-bootstrap';
import { Divider } from 'antd';
import './Results.scss'
import '../../scss/components/buttons.scss';
import '../../scss/components/forms.scss';
import '../../scss/style.scss'

export default class PhaseTable extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            phaseData: props.phaseData || '',
            namer: props.namer || '',
            phase: props.phase || '',
            ecnumber: props.ecnumber || '',
            predmethod: props.predmethod || '',
            loadingState: {},  // State to manage loading for each row for both tertiary and secondary structure
        };
        this.predictTertiaryStructure = this.predictTertiaryStructure.bind(this);
        this.predictSecondaryStructure = this.predictSecondaryStructure.bind(this);
    }

    getTopThreeValues(row) {
        const numericValues = {};

        for (let key in row) {
            if (!isNaN(row[key]) && key !== "pred") {
                numericValues[key] = parseFloat(row[key]);
            }
        }

        const sortedKeys = Object.keys(numericValues).sort((a, b) => numericValues[b] - numericValues[a]);
        return sortedKeys.slice(0, 3);
    }

    getHeaders(phaseData, phase) {
        let headers = Object.keys(phaseData[0]);

        if (phase === 'Phase3') {
            headers = [
                'SampleID',
                'Prediction',
                'Nitrogen Fixation',
                'Anammox',
                'Assimilatory',
                'Dissimilatory',
                'Denitrification',
                'Nitrification',
                'ADDN',
                'DN',
                'DDN',
                'DD'
            ];
        }

        headers.push('Secondary Structure', 'Tertiary Structure');

        if (phase === 'Phase4') {
            headers.push('Annotation');
        }

        return headers;
    }

    getLink(value, type) {
        const baseUrls = {
            'NCBI': 'https://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?db=protein&id=',
            'UniProt': 'https://www.uniprot.org/uniprotkb?query=',
            'Brenda': 'https://www.brenda-enzymes.org/enzyme.php?ecno=',
            'KEGG': 'https://www.genome.jp/dbget-bin/www_bget?ec:',
            'JGI IMG/M': 'https://img.jgi.doe.gov/cgi-bin/m/main.cgi?section=FindFunctions&page=EnzymeGenomeList&gtype=isolate&ec_number=EC:',
        };
        return `${baseUrls[type]}${value}`;
    }

    getEnzymeName(ecNumber) {
        const enzymeMap = {
            '1.18.6.1': 'Nitrogenase',
            '1.7.7.2': 'Ferredoxin-nitrate reductase',
            '1.7.1.1': 'Nitrate reductase (NADH)',
            '1.7.1.2': 'Nitrate reductase [NAD(P)H]',
            '1.7.1.3': 'Nitrate reductase (NADPH)',
            '1.7.1.4': 'Nitrite reductase [NAD(P)H]',
            '1.7.7.1': 'Ferredoxin-nitrite reductase',
            '1.7.1.15': 'Nitrite reductase (NADH)',
            '1.7.2.2': 'Nitrite reductase (cytochrome; ammonia-forming)',
            '1.7.2.5': 'Nitric oxide reductase (cytochrome c)',
            '1.7.2.4': 'Nitrous-oxide reductase',
            '1.7.2.6': 'Hydroxylamine dehydrogenase',
            '1.7.2.7': 'Hydrazine synthase',
            '1.7.2.8': 'Hydrazine dehydrogenase',
            '1.14.99.39': 'Ammonia monooxygenase',
            '1.7.99.4': 'Nitrate reductase',
            '1.7.99.-': 'With unknown physiological acceptors',
            '1.7.5.1': 'Nitrate reductase (quinone)',
            '1.7.2.1': 'Nitrite reductase (NO-forming)',
            '1.9.6.1': 'Nitrate reductase (cytochrome)'
        };
        return enzymeMap[ecNumber] || '';
    }

    getNames(ec) {
        const p3name = {
            "nitri": "Nitrification",
            "nfix": "Nitrogen Fixation",
            "assim": "Assimilatory",
            "dissim": "Dissimilatory",
            "denitri": "Denitrification",
            "addn": "Assimilatory + Dissimilatory + Denitrification + Nitrification",
            "ddn": "Dissimilatory + Denitrification + Nitrification",
            "dn": "Denitrification + Nitrification",
            "dd": "Dissimilatory + Denitrification"
        };
        return p3name[ec] || '';
    }

    async predictTertiaryStructure(sampleId, index) {
        try {
            this.setState(prevState => ({
                loadingState: {
                    ...prevState.loadingState,
                    [index]: {
                        ...prevState.loadingState[index],
                        tertiaryLoading: true,
                        tertiaryStructureUrl: ''
                    }
                }
            }));

            if (this.props.onViewStructure) {
                this.props.onViewStructure(sampleId);
            }
        } catch (error) {
            console.error("Error predicting tertiary structure:", error);
            this.setState(prevState => ({
                loadingState: {
                    ...prevState.loadingState,
                    [index]: {
                        ...prevState.loadingState[index],
                        tertiaryLoading: false,
                        tertiaryStructureUrl: ''
                    }
                }
            }));
        }
    }

    async predictSecondaryStructure(sampleId, index) {
        try {
            this.setState(prevState => ({
                loadingState: {
                    ...prevState.loadingState,
                    [index]: {
                        ...prevState.loadingState[index],
                        secondaryLoading: true,
                        secondaryStructureUrl: ''
                    }
                }
            }));

            const response = await axios.get(`${env.BACKEND}/api/secstruct`, {
                params: {
                    namer: this.state.namer,
                    phase: this.state.phase,
                    ecnumber: this.state.ecnumber,
                    acc_extract: sampleId
                }
            });

            const structureUrl = JSON.stringify(response.data);
            const localStorageKey = `secondaryStructureUrl_${sampleId}`;
            localStorage.setItem(localStorageKey, structureUrl);
            console.log(structureUrl)
            const viewUrl = `/deepnec-2.0/sstruct?sec=${encodeURIComponent(localStorageKey)}`;
            window.open(viewUrl, '_blank');

            this.setState(prevState => ({
                loadingState: {
                    ...prevState.loadingState,
                    [index]: {
                        ...prevState.loadingState[index],
                        secondaryLoading: false,
                        secondaryStructureUrl: structureUrl
                    }
                }
            }));
        } catch (error) {
            console.error("Error predicting secondary structure:", error);
            this.setState(prevState => ({
                loadingState: {
                    ...prevState.loadingState,
                    [index]: {
                        ...prevState.loadingState[index],
                        secondaryLoading: false,
                        secondaryStructureUrl: ''
                    }
                }
            }));
        }
    }

    getPredictionCountsByPhase(phaseData, phase) {
        const phaseCounts = {};

        phaseData.forEach(row => {
            const prediction = row['Prediction'];

            if (!phaseCounts[phase]) {
                phaseCounts[phase] = { total: 0, predictions: {} };
            }

            phaseCounts[phase].total += 1;

            if (prediction) {
                phaseCounts[phase].predictions[prediction] = (phaseCounts[phase].predictions[prediction] || 0) + 1;
            }
        });

        return phaseCounts;
    }

    render() {
        const { phaseData, phase } = this.props;
        const { loadingState } = this.state;

        if (!phaseData || phaseData.length === 0) {
            let message = "No Enzyme sequence predicted";

            if (phase === 'Phase3') {
                message = "No nitrogen metabolism related enzyme predicted";
            } else if (phase === 'Phase4') {
                const pathwayNames = {
                    'nitri': 'Nitrification',
                    'anammox': 'Anammox',
                    'assim': 'Assimilatory Nitrate Reduction',
                    'dissim': 'Dissimilatory Nitrate Reduction',
                    'denitri': 'Denitrification',
                    'addn': 'Assimilatory/Dissimilatory Denitrification/Nitrification',
                    'ddn': 'Dissimilatory Denitrification Nitrification',
                    'dn': 'Denitrification Nitrification',
                    'dd': 'Dissimilatory Denitrification',
                    'nfix': 'Nitrogen Fixation',
                    'all_models': 'All Pathways'
                };
                const ecKey = (this.state.ecnumber || '').toLowerCase();
                const fullName = pathwayNames[ecKey] || this.state.ecnumber;
                message = `No EC number predicted for ${fullName}`;
            }

            return <div>{message}</div>;
        }

        const headers = this.getHeaders(phaseData, phase, );
        const phaseCounts = this.getPredictionCountsByPhase(phaseData, phase);

        return (
            <div>
                <div className='row justify-content-center'>
                    {this.state.predmethod === 'DNN' && (
                        <>
                            <span>
                                Your Selected method for prediction: <b>Deep Neural Network</b>
                            </span>
                        </>
                    )}
                    {this.state.predmethod === 'Homology' && (
                        <>
                            <span>Your Selected method for prediction:  <b>Homology</b></span>
                        </>
                    )}

                    {this.state.predmethod === 'Combined' && (
                        <>
                           <span> Your Selected method for prediction: <b>Deep Neural Network + Homology</b></span>
                        </>
                    )}


                </div>
                <Divider />
                <div className='row justify-content-center' style={{ maxWidth: '100%', wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                    {Object.entries(phaseCounts).map(([phase, counts]) => (
                        <div key={phase} style={{ marginBottom: '10px' }}>
                            {phase === 'Phase1' && (
                                <span>Total Number of Input Protein Sequences: {counts.total} | </span>
                            )}
                            {phase === 'Phase2' && (
                                <span>Total Number of Enzyme Sequences: {counts.total} | </span>
                            )}
                            {phase === 'Phase3' && (
                                <span>Total Number of Mineralization Enzyme Sequences: {counts.total} | </span>
                            )}
                            {phase === 'Phase4' && (
                                <span>Total Number of {this.getNames(this.state.ecnumber)} Sequences: {counts.total} | </span>
                            )}

                            {Object.entries(counts.predictions).map(([prediction, count], index) => (
                                <span key={prediction}>
                                    {prediction.replace(/_/g, ' ')}: {count}
                                    {index < Object.entries(counts.predictions).length - 1 && " | "}
                                </span>
                            ))}
                        </div>
                    ))}
                    <Divider />
                </div>
                <Table responsive className="kbl-table table table-borderless">
                    <thead className="kbl-thead">
                        <tr>
                            {headers.map((header) => (
                                <th key={header}>{header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {phaseData.length === 0 ? (
                            <tr>
                                <td colSpan={headers.length} style={{ textAlign: 'center' }}>
                                    No Enzyme sequence predicted
                                </td>
                            </tr>
                        ) : (
                            phaseData.map((row, index) => {
                                const topThreeKeys = this.getTopThreeValues(row);
                                const { secondaryLoading, secondaryStructureUrl, tertiaryLoading, tertiaryStructureUrl } = loadingState[index] || {};
                                const sampleId = row['SampleID'];
                                const isTertiaryLoaded = Boolean(
                                    tertiaryStructureUrl ||
                                    (this.props.loadedStructuresMap && this.props.loadedStructuresMap[sampleId]) ||
                                    sessionStorage.getItem(`tertiaryStructureUrl_${sampleId}`)
                                );
                                const isTertiaryGenerating = tertiaryLoading || (this.props.loadingSampleId === sampleId);

                                return (
                                    <tr key={index}>
                                        {headers.map((header) => {
                                            let displayValue = row[header] !== undefined ? row[header] : row[header.replace(/ /g, '_')];
                                            if (header === 'Prediction' && typeof displayValue === 'string') {
                                                displayValue = displayValue.replace(/_/g, ' ');
                                            }
                                            return (
                                                <td key={header} style={{
                                                    fontWeight: topThreeKeys.indexOf(header) === 0 ? '700' : 'normal',
                                                    color: topThreeKeys.indexOf(header) === 0 ? '#1b4d3e' : '#2b2b2b',
                                                    backgroundColor: topThreeKeys.indexOf(header) === 0 ? '#e8f5e9' : 'transparent',
                                                    borderRadius: '4px',
                                                    padding: '6px 8px'
                                                }}>
                                                    {header === 'Prediction' && phase === 'Phase4'
                                                        ? <>
                                                            {displayValue} (<strong>{this.getEnzymeName(displayValue)}</strong>)
                                                        </>
                                                    : header === 'Tertiary Structure'
                                                        ? (
                                                            isTertiaryGenerating
                                                                ? (
                                                                    <span className="d-flex align-items-center justify-content-center" style={{ fontSize: '11px', color: '#2B6CB0', fontWeight: 'bold' }}>
                                                                        <img src={test} alt="Loading..." style={{ width: '30px', height: '15px', marginRight: '4px' }} />
                                                                        Generating...
                                                                    </span>
                                                                )
                                                                : isTertiaryLoaded
                                                                    ? (
                                                                        <Button
                                                                            variant="info"
                                                                            className='kbl-btn-6 mx-auto d-block'
                                                                            style={{ fontSize: '12px', padding: '4px 12px' }}
                                                                            onClick={() => {
                                                                                if (this.props.onViewStructure) {
                                                                                    this.props.onViewStructure(sampleId);
                                                                                }
                                                                            }}
                                                                        >
                                                                            View 3D
                                                                        </Button>
                                                                    )
                                                                    : (
                                                                        <Button
                                                                            variant="primary"
                                                                            className='kbl-btn-4 mx-auto d-block'
                                                                            style={{ fontSize: '12px', padding: '4px 12px' }}
                                                                            onClick={() => this.predictTertiaryStructure(sampleId, index)}
                                                                        >
                                                                            Predict 3D
                                                                        </Button>
                                                                    )
                                                        )
                                                        : header === 'Secondary Structure'
                                                            ? (
                                                                secondaryLoading
                                                                    ? <img src={test} alt="Loading..." style={{ width: '50px', height: '20px' }} />
                                                                    : secondaryStructureUrl
                                                                        ? <Button
                                                                            variant="info"
                                                                            className='kbl-btn-6 mx-auto d-block'
                                                                            style={{ fontSize: '12px', padding: '4px 12px' }}
                                                                            onClick={() => {
                                                                                const localStorageKey = `secondaryStructureUrl_${row['SampleID']}`;
                                                                                const viewUrl = `/deepnec-2.0/sstruct?sec=${encodeURIComponent(localStorageKey)}`;
                                                                                window.open(viewUrl, '_blank');
                                                                            }}
                                                                        >
                                                                            View
                                                                        </Button>
                                                                        : <Button
                                                                            variant="primary"
                                                                            className='kbl-btn-4 mx-auto d-block'
                                                                            style={{ fontSize: '12px', padding: '4px 12px' }}
                                                                            onClick={() => this.predictSecondaryStructure(row['SampleID'], index)}
                                                                        >
                                                                            Predict
                                                                        </Button>
                                                            )
                                                            : header === 'Annotation'
                                                                ? (
                                                                    <div style={{ display: 'flex', flexWrap: 'nowrap' }}>
                                                                        <Button
                                                                            variant="link"
                                                                            className='mx-1 my-1'
                                                                            size="sm"
                                                                            href={this.getLink(row['Prediction'], 'NCBI')}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                        >
                                                                            NCBI
                                                                        </Button>
                                                                        <Button
                                                                            variant="link"
                                                                            className='mx-1 my-1'
                                                                            size="sm"
                                                                            href={this.getLink(row['Prediction'], 'UniProt')}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                        >
                                                                            UniProt
                                                                        </Button>
                                                                        <Button
                                                                            variant="link"
                                                                            className='mx-1 my-1'
                                                                            size="sm"
                                                                            href={this.getLink(row['Prediction'], 'Brenda')}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                        >
                                                                            Brenda
                                                                        </Button>
                                                                        <Button
                                                                            variant="link"
                                                                            className='mx-1 my-1'
                                                                            size="sm"
                                                                            href={this.getLink(row['Prediction'], 'KEGG')}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                        >
                                                                            KEGG
                                                                        </Button>
                                                                        <Button
                                                                            variant="link"
                                                                            className='mx-1 my-1'
                                                                            size="sm"
                                                                            href={this.getLink(row['Prediction'], 'JGI IMG/M')}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                        >
                                                                            JGI IMG/M
                                                                        </Button>
                                                                    </div>
                                                                )
                                                                : displayValue}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </Table>
<Divider />
                { phase === 'Phase3' && (
        <div style={{ textAlign: 'left' }}>
        <p><strong>* ADDN:</strong> Assimilatory + Dissimilatory + Denitrification + Nitrification</p>
        <p><strong>* DN:</strong> Denitrification + Nitrification</p>
        <p><strong>* DDN:</strong> Dissimilatory + Denitrification + Nitrification</p>
        <p><strong>* DD:</strong> Dissimilatory + Denitrification</p>
    </div>
    )}

            </div>
        );
    }
}
