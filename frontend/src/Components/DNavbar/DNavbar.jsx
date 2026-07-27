// Author: Naveen Duhan
import React from "react";
import Navbar from "react-bootstrap/Navbar";
import Nav from "react-bootstrap/Nav";
import { env } from "env";
import './DNavbar.scss';

import lablogo from './lab_logo_red.png';
import usulogo from './usulogo2.png';
// import dblogo from './minpred.png';

class DNavbar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      active: this.props.active
    };
    this.activeLink = this.activeLink.bind(this);
  }

  activeLink(link) {


    if (link === this.props.active) {
      return true;
    }

    return false;
  }

    render() {
        let className = 'mx-1'
        let active = 'mx-1 current'
        console.log(env.BASE_URL)
return(
  <div className="container contain">
  <div className="row flex-lg-row align-items-center g-2 mt-2">

    <div className="col-md-2 imglab">
      <a href="http://kaabil.net" target="_blank" rel="noopener noreferrer">
        <img className="imglab" src={lablogo} height={50} alt='KAABIL Lab' style={{ cursor: 'pointer' }}></img>
      </a>
    </div>
    <div className="col-md-2">
    {/* <img src={dblogo} height={60} alt=''></img> */}

    <h3>deepNEC-2.0</h3>

    </div>
    <div className=" col-md-6 mt-2 nav-wrapper mx-auto">
        <Navbar className="justify-content-center">

          <Nav className="">
            <Nav.Link href= {`${env.BASE_URL}/`} className={'/' === this.props.active ? active : className}>
            <i className="bi bi-info-square-fill mx-2"></i><span>About</span>
            </Nav.Link>
            <Nav.Link href={`${env.BASE_URL}/prediction`} className={'prediction' === this.props.active ? active : className}>
              Prediction
            </Nav.Link>
            <Nav.Link href={`${env.BASE_URL}/download`} className={'download' === this.props.active ? active : className}>
              Download
            </Nav.Link>
            <Nav.Link href={`${env.BASE_URL}/help`} className={'help' === this.props.active ? active : className}>
              Help
            </Nav.Link>
          </Nav>

        </Navbar>
      </div>
      <div className="col-md-2 text-end">
      <a href="https://usu.edu" target="_blank" rel="noopener noreferrer">
        <img src={usulogo} height={50} alt='Utah State University' style={{ cursor: 'pointer' }}></img>
      </a>
    </div>
    </div>

      </div>

)

    }
}
export {DNavbar};
