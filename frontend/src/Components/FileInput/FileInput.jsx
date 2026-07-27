// Author: Naveen Duhan
import React, { Component } from 'react';
import InputGroup from 'react-bootstrap/InputGroup';
import Form from 'react-bootstrap/Form';

import './FileInput.scss';

export default class FileInput extends Component {
  constructor(props) {
    super(props);

    this.state = {
      fileName: ''
    }

    this.uploadFile = this.uploadFile.bind(this);
  }

  uploadFile(event) {
    const file = event.target.files[0];
    console.log(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      this.props.handler(event.target.result);
    }

    if (file) {
      this.setState({fileName: file.name});
      reader.readAsText(file);
    }
  }

  render() {
    return (
      <div >
        <InputGroup className="mb-5">
          <Form.Control placeholder="No file selected" className="kbl-form" value={this.state.fileName} readOnly/>

            <label htmlFor="file" className="btn kbl-btn-1">Upload</label>

        </InputGroup>
        <input type="file" id="file" className="real-input" onChange={this.uploadFile} />
      </div>
    )
  }
}
