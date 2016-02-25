import React, { Component } from 'react';
import { client } from './client.js';

export class Task extends Component {
  static getFragment() {
    return client.createFragment(`
      fragment on Task {
        text,
        completed
      }
    `);
  }

  render() {
    return (
      <div>Task: {this.props.data.text}</div>
    );
  }
}
