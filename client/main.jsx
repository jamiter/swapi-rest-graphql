import { dataLoaderRoot } from '../imports/loader/ReactLoader.jsx';
import { App } from './App.jsx';
import React from 'react';
import ReactDOM from 'react-dom';
import { client } from './client.js';

window.App = App;

const AppContainer = dataLoaderRoot(App, {
  loader: client,
  name: 'root',
  query: `
    {
      ...${App.getFragment()}
    }
  `
});

Meteor.startup(() => {
  const ref = ReactDOM.render(<AppContainer />, document.getElementById('react-container'));
});
