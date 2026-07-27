// Author: Naveen Duhan
import React from "react";
import SecondaryStructure from "../../Components/Sstructure/horiz";
import { Divider } from "antd";
// import './sec.scss'

export default class SStructure extends React.Component {
    constructor(props) {
        super(props);
        const searchParams = new URLSearchParams(window.location.search);
        const pdbUrlFromQuery = searchParams.get('sec');
        // const sample = pdbUrlFromQuery.split("_",2);
        const sample = pdbUrlFromQuery.substring(pdbUrlFromQuery.indexOf("_") + 1);
        // console.log(pdbUrlFromQuery)
        console.log(sample);

        // Retrieve the stored PDB URL from local storage, if available
        const storedPdbUrl = localStorage.getItem(pdbUrlFromQuery) || pdbUrlFromQuery;
        console.log(storedPdbUrl.length)
        this.state = {
            data: JSON.parse(storedPdbUrl),
            sample: sample,
            pp: (storedPdbUrl.match(/confidence/g) || []).length + 1,
            length: 120 * (storedPdbUrl.length / 100 + 1),
        };
        this.horizPlot = React.createRef();
    }

    render() {
        // let a = 180 * ((this.state.data.match(/confidence/g) || []).length + 1) + 120;
        let panel_height = this.state.length
        console.log(this.state.length)

        return (
            <div className="container">


                <div className="row g-2 mb-5">
                    <Divider />

                    <div className="box box-primary collapsed-box" id='psipred_cartoon'>

                        <h4> Secondary Structure Plot : {this.state.sample}</h4>
                        <Divider />



                        <div className="psipred_cartoon" id='psipred_horiz' ref={this.horizPlot}>
                            <SecondaryStructure
                                data={this.state.data}
                                label="psipredChart"
                                opts={{ parent: this.horizPlot.current, margin_scaler: 2, width: 900, container_width: 900, height: panel_height, container_height: panel_height }}
                            />
                        </div>

                    </div>
                </div>
                <Divider />
            </div>
        );
    }
}
