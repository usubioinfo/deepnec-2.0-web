// Author: Naveen Duhan
import React, { Component } from 'react';
import { Divider, Radio, Select, Table, Tag, Progress, Alert, Card, Row, Col } from 'antd';
import './Help.scss';

const { Option } = Select;

export default class Help extends Component {
    render() {
        // Table data for Results Preview Card
        const resultPreviewColumns = [
            { title: 'Sample ID', dataIndex: 'sampleId', key: 'sampleId', render: text => <strong>{text}</strong> },
            {
                title: 'Phase 1: Binary Filter',
                dataIndex: 'p1',
                key: 'p1',
                render: val => <Tag color="geekblue" style={{ fontWeight: '600', padding: '4px 10px' }}>{val}</Tag>
            },
            {
                title: 'Phase 2: Nitrogen Filter',
                dataIndex: 'p2',
                key: 'p2',
                render: val => <Tag color="green" style={{ fontWeight: '600', padding: '4px 10px' }}>{val}</Tag>
            },
            {
                title: 'Phase 3: Sub-Pathway',
                dataIndex: 'p3',
                key: 'p3',
                render: val => <Tag color="purple" style={{ fontWeight: '600', padding: '4px 10px' }}>{val}</Tag>
            },
            {
                title: 'Phase 4: Assigned EC',
                dataIndex: 'p4',
                key: 'p4',
                render: val => <Tag color="volcano" style={{ fontWeight: '600', padding: '4px 10px' }}>{val}</Tag>
            }
        ];

        const resultPreviewData = [
            {
                key: '1',
                sampleId: 'AEQ03576.1',
                p1: 'Enzyme (81.94%)',
                p2: 'Nitrogen (99.99%)',
                p3: 'Nitrification (100.0%)',
                p4: '1.14.99.39 (100.0%)'
            },
            {
                key: '2',
                sampleId: 'Q9X0Y2.1',
                p1: 'Enzyme (94.50%)',
                p2: 'Nitrogen (98.75%)',
                p3: 'Denitrification (99.20%)',
                p4: '1.7.2.4 (99.10%)'
            },
            {
                key: '3',
                sampleId: 'P0A964.2',
                p1: 'Enzyme (99.10%)',
                p2: 'Nitrogen (99.95%)',
                p3: 'Assimilatory (97.80%)',
                p4: '6.3.1.2 (98.40%)'
            }
        ];

        return (
            <div className="help-page-container">
                <div className="help-header">
                    <h2>deepNEC 2.0 Help Center</h2>
                    <p className="lead">Interactive documentation and user reference guide for deepNEC 2.0</p>
                </div>

                {/* Navigation Quick Links */}
                <div className="help-nav-buttons">
                    <a href="#intro" className="nav-btn btn kbl-btn-1">Introduction</a>
                    <a href="#data_input" className="nav-btn btn kbl-btn-3">Data Input</a>
                    <a href="#depth" className="nav-btn btn kbl-btn-4">Pipeline Depth</a>
                    <a href="#phases" className="nav-btn btn kbl-btn-5">Hierarchy & Models</a>
                    <a href="#outputs" className="nav-btn btn kbl-btn-7">Results & Provenance</a>
                    <a href="#compatibility" className="nav-btn btn kbl-btn-8">Compatibility</a>
                </div>

                {/* Content Card */}
                <div className="help-content-card">
                    {/* Contact Banner */}
                    <div className="contact-banner">
                        <h5><strong>Need Assistance?</strong></h5>
                        <p className="mb-0">
                            If you have technical questions or need help running batch predictions, please reach out to:
                            <br />
                            <strong>Naveen Duhan:</strong> <a href="mailto:naveen.duhan@outlook.com">naveen.duhan@outlook.com</a>
                            &nbsp;|&nbsp;
                            <strong>Dr. Rakesh Kaundal:</strong> <a href="mailto:rkaundal@usu.edu">rkaundal@usu.edu</a>
                        </p>
                    </div>

                    {/* Introduction Section */}
                    <section id="intro" className="help-section">
                        <h4><span>📖</span> Introduction</h4>
                        <p>
                            Welcome to the user guide for <strong>deepNEC 2.0</strong>. This web server provides an alignment-free,
                            deep learning hierarchical framework for high-precision **Nitrogen Metabolism Enzyme Classification**
                            and **Enzyme Commission (EC) Number Prediction** covering 28 specific EC numbers across 24 ground truth output classes.
                        </p>
                        <p>
                            The web application requires no registration and provides live FASTA sequence validation,
                            asynchronous job queue processing, publication-ready figures (300 DPI), active site motif scanning,
                            GFF3 genomic locus annotation, and 3D PDB structure visualizers.
                        </p>

                        {/* Interactive UI Card: Overview */}
                        <div className="help-ui-preview my-4">
                            <Card className="shadow-sm border-0 bg-light">
                                <div className="text-center py-2">
                                    <h4 className="fw-bold mb-1" style={{ color: '#0f2439' }}>deepNEC-2.0 Prediction Workbench</h4>
                                    <p className="text-muted small mb-3">Alignment-free, deep learning hierarchical classification and EC prediction for nitrogen metabolism</p>

                                    <Row gutter={[16, 16]} className="justify-content-center">
                                        <Col xs={12} sm={6}>
                                            <div className="p-3 bg-white rounded shadow-sm text-center">
                                                <div className="text-primary h4 fw-bold mb-0">Phase 1</div>
                                                <small className="text-muted">Binary Enzyme Filter</small>
                                            </div>
                                        </Col>
                                        <Col xs={12} sm={6}>
                                            <div className="p-3 bg-white rounded shadow-sm text-center">
                                                <div className="text-success h4 fw-bold mb-0">Phase 2</div>
                                                <small className="text-muted">Nitrogen Enzyme Filter</small>
                                            </div>
                                        </Col>
                                        <Col xs={12} sm={6}>
                                            <div className="p-3 bg-white rounded shadow-sm text-center">
                                                <div className="text-info h4 fw-bold mb-0">Phase 3</div>
                                                <small className="text-muted">10 Sub-pathways</small>
                                            </div>
                                        </Col>
                                        <Col xs={12} sm={6}>
                                            <div className="p-3 bg-white rounded shadow-sm text-center">
                                                <div className="text-warning h4 fw-bold mb-0">Phase 4</div>
                                                <small className="text-muted">24 EC Output Classes</small>
                                            </div>
                                        </Col>
                                    </Row>
                                </div>
                            </Card>
                        </div>
                    </section>

                    {/* Data Input Section */}
                    <section id="data_input" className="help-section">
                        <h4><span>📥</span> Data Input & Live Validation</h4>
                        <p>
                            deepNEC 2.0 accepts query input in two modes:
                        </p>
                        <ul>
                            <li><strong>FASTA Sequence:</strong> Protein (amino acid) or Nucleotide (DNA/RNA) sequences in standard FASTA format.</li>
                            <li><strong>Accession IDs:</strong> NCBI Protein or UniProtKB accession identifiers (one per line or space-separated).</li>
                        </ul>

                        {/* Interactive UI Card: Input Selector Preview */}
                        <div className="help-ui-preview my-4">
                            <Card title="Input Configuration & Real-Time Sequence Validator" className="shadow-sm">
                                <Row gutter={[24, 24]}>
                                    <Col md={12}>
                                        <div className="mb-3">
                                            <label className="fw-bold mb-2">1. Select Sequence Type</label>
                                            <div>
                                                <Radio.Group value="prot">
                                                    <Radio value="prot">Protein Sequence</Radio>
                                                    <Radio value="nucl">Nucleotide Sequence</Radio>
                                                </Radio.Group>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="fw-bold mb-2">2. Select Input Mode</label>
                                            <div>
                                                <Radio.Group value="fasta">
                                                    <Radio value="fasta">FASTA Sequence</Radio>
                                                    <Radio value="accession">Accession ID</Radio>
                                                </Radio.Group>
                                            </div>
                                        </div>
                                    </Col>
                                    <Col md={12}>
                                        <div className="p-3 bg-light border rounded text-center small text-primary mb-2">
                                            ✓ <b>1</b> sequence(s) detected | Total length: <b>163</b> aa | Avg length: <b>163</b> aa
                                        </div>
                                        <Alert
                                            message="Input Validation Guard"
                                            description="Sequences are validated in real-time. Sequences containing invalid non-standard characters or shorter than 31 residues are reported immediately."
                                            type="info"
                                            showIcon
                                        />
                                    </Col>
                                </Row>
                            </Card>
                        </div>
                    </section>

                    {/* Pipeline Depth Section */}
                    <section id="depth" className="help-section">
                        <h4>Target Pipeline Depth & Pathway Selection</h4>
                        <p>
                            You can customize how deep the hierarchical pipeline runs using a single target depth dropdown:
                        </p>
                        <ul>
                            <li><strong>Phase 1:</strong> Binary Enzyme vs Non-Enzyme Classifier (Fold 5 LoRA + 2,968 Descriptors).</li>
                            <li><strong>Phase 2:</strong> Nitrogen Metabolism Enzyme Filter (Phases 1 → 2).</li>
                            <li><strong>Phase 3:</strong> 10 Nitrogen Sub-pathway Classifier (Phases 1 → 2 → 3).</li>
                            <li><strong>Phase 4:</strong> Full Pipeline & Fine-Grained EC Assignment (Phases 1 → 2 → 3 → 4).</li>
                        </ul>

                        {/* Interactive UI Card: Pipeline Depth Preview */}
                        <div className="help-ui-preview my-4">
                            <Card title="Hierarchical Depth & Target Pathway Controls" className="shadow-sm">
                                <Row gutter={[24, 24]}>
                                    <Col md={12}>
                                        <label className="fw-bold mb-2">3. Select Target Pipeline Depth</label>
                                        <Select value="Phase4" style={{ width: '100%' }}>
                                            <Option value="Phase1">Phase 1: Binary Enzyme Filter (Enzyme vs Non-Enzyme)</Option>
                                            <Option value="Phase2">Phase 2: Nitrogen Metabolism Enzyme Filter (Phases 1 → 2)</Option>
                                            <Option value="Phase3">Phase 3: Nitrogen Sub-pathway Predictor (Phases 1 → 2 → 3)</Option>
                                            <Option value="Phase4">Phase 4: Full Pipeline & EC Assignment (Phases 1 → 2 → 3 → 4)</Option>
                                        </Select>
                                    </Col>
                                    <Col md={12}>
                                        <label className="fw-bold mb-2">4. Select Target Pathway (Phase 4 Filter)</label>
                                        <Select value="all_models" style={{ width: '100%' }}>
                                            <Option value="all_models">All Predicted Nitrogen Pathways (Default)</Option>
                                            <Option value="nitri">Nitrification</Option>
                                            <Option value="nfix">Nitrogen Fixation</Option>
                                            <Option value="anammox">Anammox</Option>
                                            <Option value="assim">Assimilatory Nitrate Reduction</Option>
                                            <Option value="dissim">Dissimilatory Nitrate Reduction</Option>
                                            <Option value="denitri">Denitrification</Option>
                                        </Select>
                                    </Col>
                                </Row>
                            </Card>
                        </div>
                    </section>

                    {/* Hierarchy & Models Section */}
                    <section id="phases" className="help-section">
                        <h4>Asynchronous Job Queue & Live Status Polling</h4>
                        <p>
                            When a prediction job is submitted, deepNEC 2.0 generates a server-side UUID job ID (``POST /api/jobs`` returning ``202 Accepted``).
                            The client polls ``GET /api/jobs/:id/status`` in the background showing real-time stage descriptions and progress percentages.
                        </p>

                        {/* Interactive UI Card: Async Job Queue Status */}
                        <div className="help-ui-preview my-4">
                            <Card title="Live Progress Polling Indicator" className="shadow-sm text-center">
                                <h5 className="fw-bold mb-2" style={{ color: '#0f2439' }}>Running deepNEC 2.0 Pipeline: 85%</h5>
                                <div className="mx-auto" style={{ maxWidth: '500px' }}>
                                    <Progress percent={85} status="active" strokeColor="#288DC2" />
                                    <p className="text-muted small fw-bold mt-2">Generating publication-ready figures & distribution curves...</p>
                                </div>
                            </Card>
                        </div>
                    </section>

                    {/* Output Example Section */}
                    <section id="outputs" className="help-section">
                        <h4><span>📊</span> Prediction Results & Reproducibility Provenance</h4>
                        <p>
                            Upon job completion, deepNEC 2.0 renders structured results across dedicated view tabs:
                        </p>
                        <ul>
                            <li><strong>Classification Results:</strong> Detailed sample predictions with probability scores and colorblind-accessible badges.</li>
                            <li><strong>Motif Scan:</strong> Active site & cofactor motif analysis (Rossmann fold, Ferredoxin Fe-S, Mo-MGD, Heme CXXCH).</li>
                            <li><strong>Publication Visualizations:</strong> High-resolution (300 DPI) figures for pathway distribution, EC donut chart, and pathway completeness profile.</li>
                            <li><strong>GFF Genomic Annotations:</strong> Downloads GFF3 files annotated with predicted EC numbers and nitrogen pathways.</li>
                            <li><strong>3D Structure Viewer:</strong> Integrated PDB 3D structure renderer.</li>
                        </ul>

                        {/* Interactive UI Card: Results Table */}
                        <div className="help-ui-preview my-4">
                            <Card title="Interactive Results & TSV Provenance Metadata" className="shadow-sm">
                                <Table
                                    columns={resultPreviewColumns}
                                    dataSource={resultPreviewData}
                                    pagination={false}
                                    size="small"
                                    className="mb-3"
                                />
                                <div className="p-3 bg-dark text-light rounded font-monospace small">
                                    # deepNEC 2.0 Run Date: 2026-07-26 | Job UUID: 5da1b716-6c4f-4fc8-9ecc-e9de0d4b26c8<br />
                                    # Target Phase: Phase4 | Model Strategy: ESM-2 LoRA + Descriptors (Fold 5)<br />
                                    SampleID&#9;Pathway&#9;EC_Number&#9;Confidence<br />
                                    AEQ03576.1&#9;Nitrification&#9;1.14.99.39&#9;100.0
                                </div>
                            </Card>
                        </div>
                    </section>

                    {/* Browser Compatibility */}
                    <section id="compatibility" className="help-section">
                        <h4><span>💻</span> Browser Compatibility</h4>
                        <p>
                            deepNEC 2.0 has been tested extensively across major desktop and mobile browsers:
                        </p>

                        <table className="compatibility-table table table-bordered">
                            <thead>
                                <tr>
                                    <th>OS</th>
                                    <th>Version</th>
                                    <th>Chrome</th>
                                    <th>Firefox</th>
                                    <th>Safari</th>
                                    <th>Edge</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Linux</td>
                                    <td>Ubuntu 22.04 / 24.04</td>
                                    <td><Tag color="green">108.0+</Tag></td>
                                    <td><Tag color="green">112.0+</Tag></td>
                                    <td>n/a</td>
                                    <td><Tag color="green">113.0+</Tag></td>
                                </tr>
                                <tr>
                                    <td>macOS</td>
                                    <td>Ventura / Sonoma / Sequoia</td>
                                    <td><Tag color="green">108.0+</Tag></td>
                                    <td><Tag color="green">112.0+</Tag></td>
                                    <td><Tag color="green">16.4+</Tag></td>
                                    <td><Tag color="green">113.0+</Tag></td>
                                </tr>
                                <tr>
                                    <td>Windows</td>
                                    <td>10 / 11</td>
                                    <td><Tag color="green">108.0+</Tag></td>
                                    <td><Tag color="green">112.0+</Tag></td>
                                    <td>n/a</td>
                                    <td><Tag color="green">113.0+</Tag></td>
                                </tr>
                            </tbody>
                        </table>
                    </section>
                </div>
                <Divider />
            </div>
        );
    }
}
