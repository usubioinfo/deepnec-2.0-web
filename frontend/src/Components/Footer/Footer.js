// Author: Naveen Duhan
import React from "react";
import "./Footer.scss";

export default class Footer extends React.Component {
    render(){
        return(
            <footer className="app-footer text-center">
                <p>
                    &copy; {new Date().getFullYear()}{" "}
                    <a href="https://usu.edu" target="_blank" rel="noopener noreferrer">
                        Utah State University
                    </a>
                    . Developed by{" "}
                    <a href="http://kaabil.net" target="_blank" rel="noopener noreferrer">
                        Kaundal Artificial Intelligence & Advanced Bioinformatics Lab
                    </a>
                    . All rights reserved.
                </p>
            </footer>
        )
    }
}
