import React, { Component } from 'react';
import { client } from './client.js';
import { Task } from './Task.jsx';
import { Random } from 'meteor/random';

import { createTask } from '../imports/schema/methods.js';

export class List extends Component {
  static getFragment() {
    return client.createFragment(`
      fragment on List {
        _id,
        _dep {
          key,
          version
        },
        name,
        tasks {
          ...${Task.getFragment()}
        }
      }
    `);
  }

  constructor() {
    super();

    this.state = {
      optimisticTasks: []
    };
  }

  renderTasks(tasks) {
    return tasks.map(task => <Task data={task} />);
  }

  _removeOptimisticTask(invocationId) {
    this.setState({
      optimisticTasks: this.state.optimisticTasks.filter((task) => {
        task.invocationId !== invocationId;
      })
    });
  }

  insertTask() {
    const text = 'task ' + Random.id();
    const invocationId = Random.id();

    const optimisticTask = createTask.call({
      text,
      listId: this.props.data._id,
    }, (err, res) => {
      if (err) {
        alert(err);
        this._removeOptimisticTask(invocationId);
      } else {
        const { deps } = res;

        client.afterUpdated(deps, () => {
          this._removeOptimisticTask(invocationId);
        });
      }
    });

    optimisticTask.invocationId = invocationId;

    // Optimistic thing
    const previousOptimisticTasks = this.state.optimisticTasks;

    this.setState({
      optimisticTasks: [optimisticTask, ...previousOptimisticTasks]
    })
  }

  render() {
    return (
      <div>
        <h2>{this.props.data.name}</h2>
        {this.renderTasks(this.props.data.tasks.concat(this.state.optimisticTasks))}
        <button onClick={this.insertTask.bind(this)}>New task</button>
      </div>
    );
  }
}
