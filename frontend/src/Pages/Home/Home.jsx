// Author: Naveen Duhan
import React from "react";
import { Button } from "react-bootstrap";
import { Divider } from "antd";
import "./Home.scss";
import deepnec from './deepnec.jpg';

const Home = () => {
    return (
        <div className="container main">
            <Divider />

            <h1 className="display-5 fw-bold lh-1 mb-3">What is deepNEC-2.0?</h1>
            <Divider />

            <div className="row justify-content-center">
                <div className="col-md-6">
                    <div className="purpose">

                        <p>This is an alignment-free computational approach to
                            predicted nitrogen biochemical network-related enzymes from the sequence itself.
                            deepNEC-2.0 is a novel end-to-end feature selection and classification model training approach for
                            nitrogen biochemical network-related enzyme prediction. The algorithm was developed using Deep
                            Learning, a class of machine learning algorithms that uses multiple layers to extract
                            higher-level features from the raw input data. The derived protein sequence is used as an input,
                            extracting sequential and convolutional features from raw encoded protein sequences based on
                            classification rather than traditional alignment-based methods for enzyme prediction. </p>
                        <p>deepNEC uses a phase-based classification:</p>
                        <ul>
                            <li>Phase-I: The input query protein sequences are predicted as enzymes or non-enzymes.</li>
                            <li>Phase-II: Further categorizes the predicted enzymes into nitrogen metabolism enzymes or non-nitrogen metabolism enzymes.</li>
                            <li>Phase-III: Classifies the nitrogen metabolism enzymes into ten specific classes.</li>
                            <li>Phase-IV: Assigns EC numbers to the predicted classes from Phase-III.</li>
                        </ul>

                    </div>
                    <div className="button-container my-5">
                        <a href="/deepnec-2.0/prediction">
                            <Button className="mx-2 kbl-btn-3">
                                Prediction
                            </Button>
                        </a>
                        <a href="/deepnec-2.0/download">
                            <Button className="mx-2 kbl-btn-1">
                                Download
                            </Button>
                        </a>
                    </div>
                </div>
                <div className="col-md-6 text-center">
                    <img src={deepnec} alt="DeepNEC 2.0 Architectural Overview (Figure 1)" className="img-fluid rounded shadow-sm" style={{ maxWidth: '100%', height: 'auto' }} />
                </div>
            </div>
            <Divider />
        </div>
    );
};

export default Home;
