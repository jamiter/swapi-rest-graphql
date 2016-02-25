import React, { Component } from 'react';
import { List } from './List.jsx';
import { client } from './client.js';

import { createList } from '../imports/schema/methods.js';

export class App extends Component {
  static getFragment() {
    return client.createFragment(`
      fragment on Query {
        allLists {
          ...${List.getFragment()}
        }
      }
    `);
  }

  renderLists(lists) {
    return lists.map(list => <List data={list} />);
  }

  addList() {
    createList.call((err, res) => {
      //
    });
  }

  render() {
    return (
      <div>
        <h1>Lists</h1>
        {this.renderLists(this.props.data.allLists)}
        <button onClick={this.addList}>Add List</button>
      </div>
    );
  }
}
