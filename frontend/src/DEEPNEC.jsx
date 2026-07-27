// Author: Naveen Duhan
import React, { Component } from "react";
import {Container} from 'react-bootstrap';
import { DNavbar } from "Components/DNavbar/DNavbar";
import Home from "Pages/Home/Home";
import Results from "Pages/Results/Results";
import Prediction from "Pages/Prediction/Prediction";
import SStructure from "Pages/Structure/sec-struct";
import Structure from "Pages/Structure/structure";
import Footer from "Components/Footer/Footer";
import DownloaddeepNEC from "Pages/Download/Download";
import Help from "Pages/Help/Help";

import { env } from "env";


export class DEEPNEC extends Component {
    constructor(props){
        super(props);
        this.state = {
            baseUrlLen: env.BASE_URL.split("/").length
        }
    }
    render(){
        const routeName = document.location.pathname
            .replace(new RegExp(`^${env.BASE_URL}/?`), '')
            .split('/')[0];
        const pages = {
            '': <Home />,
            prediction: <Prediction />,
            results: <Results />,
            structure: <Structure />,
            sstruct: <SStructure />,
            help: <Help />,
            download: <DownloaddeepNEC />,
        };

        return(
            <Container fluid className='App px-4'>
                <DNavbar active={routeName}/>
                {pages[routeName] || <Home />}
                <Footer />
            </Container>
        )
    }
}
