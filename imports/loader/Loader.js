import { Lokka } from 'lokka';
import { Transport } from 'lokka-transport-http';
import EventEmitter from 'tiny-emitter';

import { _ } from 'meteor/underscore';
import { Random } from 'meteor/random';

import { Query } from './Query.js';

export class Loader {
  constructor() {
    this.client = new Lokka({
      transport: new Transport('/graphql')
    });

    // Emits all dep invalidations
    this.invalidationEmitter = new EventEmitter();

    this._queries = {};

    this._afterQueryFetchQueue = [];

    this._interval = setInterval(() => {
      const list = this.getAllQueryDeps();

      const variables = {
        deps: list
      };

      this.client.query(`
        query pollDeps($deps: [InputDep]) {
          deps(deps: $deps) {
            key,
            version
          }
        }
      `, variables).then((res) => {
        if (res.deps.length > 0) {
          this.invalidationEmitter.emit('invalidate', res.deps);
        }
      });
    }, 1000);
  }

  getAllQueryDeps() {
    const depObjs = _.pluck(_.values(this._queries), 'deps');
    const list = _.flatten(depObjs.map((depObj) => {
      return _.values(depObj);
    }));

    return list;
  }

  /**
   * Get the result of a static GraphQL query
   * @param  {String} query A GraphQL query
   * @return {Promise}       A promise that will resolve to JSON data
   */
  fetch(query) {
    return this.client.query(query);
  }

  createFragment(fragment) {
    return this.client.createFragment(fragment);
  }

  /**
   * Get the result of a reactive GraphQL query
   * @param  {String} query A GraphQL query
   * @return {EventEmitter}       An event emitter that will emit events when the query updates
   */
  fetchReactive(query) {
    const queryId = Random.id();

    // XXX todo - deduplicate queries?
    const queryHandle = new Query({
      id: queryId,
      query: query,
      client: this.client,
      invalidationEmitter: this.invalidationEmitter,
    });

    this._queries[queryId] = queryHandle;

    // Lets us know when queries are done refetching
    queryHandle.on('data', this._onQueryFetch.bind(this));

    return queryHandle;
  }

  areDepsUpToDateWith(newDeps) {
    const outdated = this.getAllQueryDeps().some((fetchedDep) => {
      const matchingNewDep = _.findWhere(newDeps, { key: fetchedDep.key });

      if (matchingNewDep && matchingNewDep.version > fetchedDep.version) {
        // Fetched one is outdated
        return true;
      }
    });

    return !outdated;
  }

  afterUpdated(deps, callback) {
    if(this.areDepsUpToDateWith(deps)) {
      callback();
    } else {
      // Try again after a query fetch happens
      this._afterQueryFetch(() => {
        this.afterUpdated(deps, callback);
      });
    }
  }

  _onQueryFetch() {
    this._afterQueryFetchQueue.forEach((callback) => {
      callback();
    });

    this._afterQueryFetchQueue = [];
  }

  _afterQueryFetch(callback) {
    this._afterQueryFetchQueue.push(callback);
  }
}
