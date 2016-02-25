import React, { Component } from 'react';
import { Loader } from './Loader.js';

export function dataLoaderRoot(Child, { query, loader, name }) {
  return class DataLoaderRoot extends Component {
    constructor() {
      super();

      this.state = {
        data: null
      };

      this.query = loader.fetchReactive(query);

      this.query.on('data', (data) => {
        this.setState({
          data: data
        });
      });
    }

    componentWillUnmount() {
      // TODO: clean up
    }

    refresh() {
      this.query.fetch();
    }

    render() {
      return this.state.data ?
        <Child {...this.props} data={this.state.data} /> :
        <div>Loading...</div>;
    }
  }
}
