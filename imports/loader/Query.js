import EventEmitter from 'tiny-emitter';

export class Query extends EventEmitter {
  constructor({
    query,
    client,
    invalidationEmitter,
  }) {
    super();

    this.query = query;
    this.client = client;
    this.invalidationEmitter = invalidationEmitter;

    this.deps = {};

    this.invalidationEmitter.on('invalidate', (deps) => {
      const invalidated = deps.some((dep) => {
        return this.deps[dep.key];
      });

      if (invalidated) {
        this.fetch();
      }
    });

    this.fetch();
  }

  fetch() {
    this.client.query(this.query).then((result) => {
      this._resetAndUpdateDeps(result);
      this.emit('data', result);
    });
  }

  _resetAndUpdateDeps(result) {
    this.deps = {};
    this._updateDepsFromResult(result);
  }

  _updateDepsFromResult(result) {
    if (! _.isObject(result)) {
      return [];
    }

    _.each(result, (value, key) => {
      if (key === '_dep') {
        this.deps[value.key] = value;
      }

      this._updateDepsFromResult(value);
    });
  }
}
