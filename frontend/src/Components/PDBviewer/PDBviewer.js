// Author: Naveen Duhan
import React, { Component } from 'react';
import * as NGL from 'ngl';
import { Button } from 'react-bootstrap'; // Ensure the Button component is imported
import { Divider } from 'antd';
class PDBViewer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            representationType: 'cartoon', // Default representation type
            colorscheme: 'atomindex',
            bgcolor: '#f0f0f0'
        };
        this.stage = null; // Reference to NGL stage
        this.viewerContainerRef = React.createRef(); // Reference to the container element
        this.component = null; // Reference to the loaded component
        this.highlightRepresentation = null; // Reference to active site highlight representation
        this.handleColorSchemeChange = this.handleColorSchemeChange.bind(this);
        this.handleRepresentationChange = this.handleRepresentationChange.bind(this);
        this.handleBackgroundColorChange = this.handleBackgroundColorChange.bind(this);
        this.loadStructure = this.loadStructure.bind(this)
    }

    componentDidMount() {
        this.stage = new NGL.Stage(this.viewerContainerRef.current);
        this.updateBackgroundColor()

        this.loadStructure(this.props.pdbData, this.state.representationType, this.state.colorscheme);
    }

    componentDidUpdate(prevProps, prevState) {
        this.stage = new NGL.Stage(this.viewerContainerRef.current);

        // Check if pdbData changed
        if (prevProps.pdbData !== this.props.pdbData) {
            this.loadStructure(this.props.pdbData, this.state.representationType, this.state.colorscheme);
            this.updateBackgroundColor();
        }

        // Check if representationType changed
        if (prevState.representationType !== this.state.representationType) {
            this.loadStructure(this.props.pdbData, this.state.representationType, this.state.colorscheme);
            this.updateBackgroundColor();
        }

        // Check if colorscheme changed
        if (prevState.colorscheme !== this.state.colorscheme) {
            this.loadStructure(this.props.pdbData, this.state.representationType, this.state.colorscheme);
            this.updateBackgroundColor();
        }

        // Check if highlightResidues changed
        if (prevProps.highlightResidues !== this.props.highlightResidues) {
            this.applyHighlights();
        }
    }

    exportSVG = () => {
        const canvas = this.viewerContainerRef.current.querySelector('canvas');
        if (!canvas) {
            console.error('Canvas not found!');
            return;
        }

        // Get canvas as data URL
        const dataURL = canvas.toDataURL('image/png');

        // Create an SVG wrapper
        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}">
                <image href="${dataURL}" width="${canvas.width}" height="${canvas.height}" />
            </svg>
        `;

        // Create a blob and download it
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'structure.svg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    updateBackgroundColor() {
        const canvas = this.viewerContainerRef.current.querySelector('canvas');
        if (canvas) {
            canvas.style.backgroundColor = this.state.bgcolor;
        } else {
            console.error('Canvas element not found');
        }
    }

    applyHighlights() {
        if (!this.component) return;

        // Remove previous active site highlight
        if (this.highlightRepresentation) {
            try {
                this.component.removeRepresentation(this.highlightRepresentation);
            } catch (e) {}
            this.highlightRepresentation = null;
        }

        const residueNumbers = this.props.highlightResidues;
        if (!residueNumbers || residueNumbers.length === 0) {
            this.stage.autoView();
            return;
        }

        console.log(`[NGL] Highlighting residues:`, residueNumbers);

        // Build NGL selection query, e.g. "104 or 105 or 120"
        const selectionString = residueNumbers.map(num => `${num}`).join(' or ');

        // Add a premium ball+stick representation for active site residues colored in bright magenta
        this.highlightRepresentation = this.component.addRepresentation('ball+stick', {
            sele: selectionString,
            color: '#ff00ff', // Bright magenta selection highlight
            multipleBond: 'off',
            aspectRatio: 2.0
        });

        // Zoom the stage camera focus to the active site residues
        this.stage.autoView(selectionString);
    }

    loadStructure(data2, represent, colorschemed) {
        if (!this.stage) return; // Ensure stage is initialized

        let jsonData;
        try {
            jsonData = typeof data2 === 'string' ? JSON.parse(data2) : data2;
        } catch (e) {
            console.error('Invalid JSON data:', e);
            return;
        }

        if (!jsonData.atoms || !Array.isArray(jsonData.atoms)) {
            console.error('Invalid JSON structure:', jsonData);
            return;
        }

        const convertJsonToPdb = (jsonData) => {
            return jsonData.atoms.map(atom => {
                return `${atom.recordName.padEnd(6, ' ')}${atom.serial.toString().padStart(5, ' ')} ${atom.name.padEnd(4, ' ')}${atom.alternateLocation.padEnd(1, ' ')}${atom.residueName.padEnd(3, ' ')} ${atom.chainID.padEnd(1, ' ')}${atom.residueSequenceNumber.toString().padStart(4, ' ')}${atom.insertionCode.padEnd(1, ' ')}   ${atom.x.toFixed(3).padStart(8, ' ')}${atom.y.toFixed(3).padStart(8, ' ')}${atom.z.toFixed(3).padStart(8, ' ')}${atom.occupancy.toFixed(2).padStart(6, ' ')}${atom.tempFactor.toFixed(2).padStart(6, ' ')}${atom.segmentID.padEnd(4, ' ')}${atom.element.padStart(2, ' ')}${atom.charge.padEnd(2, ' ')}\n`;
            }).join('') + 'END\n';
        };

        const pdbData = convertJsonToPdb(jsonData);
        const blob = new Blob([pdbData], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);

        // Clear previous representations
        if (this.component) {
            try {
                this.stage.removeComponent(this.component);
            } catch (e) {}
            this.component = null;
            this.highlightRepresentation = null;
        }

        this.stage.loadFile(url, { ext: 'pdb' }).then(component => {
            console.log(component)
            this.component = component; // Store reference to the loaded component
            this.component.addRepresentation(represent, { color: colorschemed });
            this.component.updateRepresentations({ type: represent, color: colorschemed });
            this.component.autoView();

            // Apply highlights once loaded
            this.applyHighlights();

            URL.revokeObjectURL(url); // Clean up the URL object
        }).catch(err => {
            console.error('Error loading PDB file:', err);
        });
    }

    handleRepresentationChange = (event) => {
        const representationType = event.target.value;
        this.setState({ representationType }, () => {
            if (this.component) {
                this.component.removeAllRepresentations();
                this.component.addRepresentation(this.state.representationType, { color: this.state.colorscheme });
                this.component.updateRepresentations({ type: this.state.representationType, color: this.state.colorscheme });
                if (this.highlightRepresentation) {
                    this.applyHighlights();
                } else {
                    this.component.autoView();
                }
            } else {
                this.loadStructure(this.props.pdbData, this.state.representationType, this.state.colorscheme);
            }
        });
    }

    handleColorSchemeChange(e) {
        const colorscheme = e.target.value;
        this.setState({ colorscheme }, () => {
            if (this.component) {
                this.component.removeAllRepresentations();
                this.component.addRepresentation(this.state.representationType, { color: this.state.colorscheme });
                this.component.updateRepresentations({ type: this.state.representationType, color: this.state.colorscheme });
                if (this.highlightRepresentation) {
                    this.applyHighlights();
                } else {
                    this.component.autoView();
                }
            } else {
                this.loadStructure(this.props.pdbData, this.state.representationType, this.state.colorscheme);
            }
        });
    }

    handleBackgroundColorChange = (e) => {
        const bgcolor = e.target.value;
        this.setState({ bgcolor }, () => {
            this.updateBackgroundColor(); // Update the background color
        });
    }

    convertJsonToPdb = (jsonData) => {
        return jsonData.atoms.map(atom => {
            return `${atom.recordName.padEnd(6, ' ')}${atom.serial.toString().padStart(5, ' ')} ${atom.name.padEnd(4, ' ')}${atom.alternateLocation.padEnd(1, ' ')}${atom.residueName.padEnd(3, ' ')} ${atom.chainID.padEnd(1, ' ')}${atom.residueSequenceNumber.toString().padStart(4, ' ')}${atom.insertionCode.padEnd(1, ' ')}   ${atom.x.toFixed(3).padStart(8, ' ')}${atom.y.toFixed(3).padStart(8, ' ')}${atom.z.toFixed(3).padStart(8, ' ')}${atom.occupancy.toFixed(2).padStart(6, ' ')}${atom.tempFactor.toFixed(2).padStart(6, ' ')}${atom.segmentID.padEnd(4, ' ')}${atom.element.padStart(2, ' ')}${atom.charge.padEnd(2, ' ')}\n`;
        }).join('') + 'END\n';
    }

    downloadPDB = () => {
        let jsonData;
        try {
            jsonData = typeof this.props.pdbData === 'string' ? JSON.parse(this.props.pdbData) : this.props.pdbData;
        } catch (e) {
            console.error('Invalid JSON data:', e);
            return;
        }

        const pdbData = this.convertJsonToPdb(jsonData);

        const blob = new Blob([pdbData], { type: 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'structure.pdb';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }


    saveAsImage = (format) => {
        if (format === 'png') {
            const params = { factor: 4, antialias: true, transparent: true };
            this.stage.makeImage(params).then((blob) => {
                NGL.download(blob, 'structure.png');
            }).catch((err) => {
                console.error('Error saving image:', err);
            });
        } else if (format === 'svg') {
            this.exportSVG();
        }
    }

    render() {
        const viewerStyle = {
            width: '100%',
            height: '600px',
            backgroundColor: this.state.bgcolor,
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            display: 'flex', // Add this line to enable flexbox
            // justifyContent: 'center', // Center content horizontally
            alignItems: 'center' // Optionally center content vertically
        };


        return (
            <div>
                <div className='d-flex flex-wrap align-items-end justify-content-between text-dark mb-3' style={{ gap: '16px' }}>
                    <div style={{ flex: '1 1 180px' }}>
                        <h6 className="mb-2 text-muted small text-uppercase font-weight-bold" style={{ letterSpacing: '0.5px' }}>Representation</h6>
                        <select className="form-control kbl-form" value={this.state.representationType} onChange={this.handleRepresentationChange}>
                            <option value="cartoon">Cartoon</option>
                            <option value="backbone">Backbone</option>
                            <option value="ball+stick">Ball+Stick</option>
                            <option value="contact">Contact</option>
                            <option value="helixorient">Helix Orient</option>
                            <option value="hyperball">Hyperball</option>
                            <option value="label">Label</option>
                            <option value="licorice">Licorice</option>
                            <option value="line">Line</option>
                            <option value="point">Point</option>
                            <option value="ribbon">Ribbon</option>
                            <option value="rocket">Rocket</option>
                            <option value="rope">Rope</option>
                            <option value="spacefill">Spacefill</option>
                            <option value="surface">Surface</option>
                            <option value="trace">Trace</option>
                            <option value="tube">Tube</option>
                        </select>
                    </div>

                    <div style={{ flex: '1 1 180px' }}>
                        <h6 className="mb-2 text-muted small text-uppercase font-weight-bold" style={{ letterSpacing: '0.5px' }}>Color Scheme</h6>
                        <select className="form-control kbl-form" value={this.state.colorscheme} onChange={this.handleColorSchemeChange}>
                            <option value="atomindex">Atom Index</option>
                            <option value="bfactor">B-Factor</option>
                            <option value="chainid">Chain ID</option>
                            <option value="chainindex">Chain Index</option>
                            <option value="chainname">Chain Name</option>
                            <option value="densityfit">Density Fit</option>
                            <option value="electrostatic">Electrostatic</option>
                            <option value="element">Element</option>
                            <option value="entityindex">Entity Index</option>
                            <option value="entitytype">Entity Type</option>
                            <option value="geoquality">Geometric Quality</option>
                            <option value="hydrophobicity">Hydrophobicity</option>
                            <option value="modelindex">Model Index</option>
                            <option value="moleculetype">Molecule Type</option>
                            <option value="occupancy">Occupancy</option>
                            <option value="random">Random</option>
                            <option value="residueindex">Residue Index</option>
                            <option value="resname">Residue Name</option>
                            <option value="sstruc">Secondary Structure</option>
                            <option value="uniform">Uniform</option>
                            <option value="value">Value</option>
                            <option value="volume">Volume</option>
                        </select>
                    </div>

                    <div style={{ flex: '1 1 180px' }}>
                        <h6 className="mb-2 text-muted small text-uppercase font-weight-bold" style={{ letterSpacing: '0.5px' }}>Background Color</h6>
                        <select
                            className="form-control kbl-form"
                            value={this.state.bgcolor}
                            onChange={this.handleBackgroundColorChange}
                        >
                            <option value="#f0f0f0">Very Light Gray</option>
                            <option value="#ddd">Light Gray</option>
                            <option value="#ffffff">White</option>
                            <option value="#000000">Black</option>
                            <option value="#e0e0e0">Light Silver</option>
                        </select>
                    </div>

                    <div style={{ flex: '2 1 320px' }}>
                        <h6 className="mb-2 text-muted small text-uppercase font-weight-bold" style={{ letterSpacing: '0.5px' }}>Export / Download</h6>
                        <div className="d-flex gap-2">
                            <Button className="kbl-btn-1 flex-fill" style={{ padding: '8px 12px', fontSize: '13px' }} onClick={this.downloadPDB}>Download PDB</Button>
                            <Button className="kbl-btn-1 flex-fill" style={{ padding: '8px 12px', fontSize: '13px' }} onClick={() => this.saveAsImage('png')}>Save PNG</Button>
                            <Button className="kbl-btn-1 flex-fill" style={{ padding: '8px 12px', fontSize: '13px' }} onClick={() => this.saveAsImage('svg')}>Save SVG</Button>
                        </div>
                    </div>
                    <Divider className="my-2" />
                </div>
                <div ref={this.viewerContainerRef} style={viewerStyle} key={this.state.representationType + this.state.colorscheme}></div>

            </div>
        );
    }
}

export default PDBViewer;
