import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { Random } from 'meteor/random';

import {
  invalidateDep,
  getDepObj
} from './deps.js';

import {
  Lists,
  Tasks
} from '../schema/schema.js';

export const createList = new ValidatedMethod({
  name: 'createList',
  validate: null,
  run() {
    Lists.insert({
      name: 'New List ' + Random.id()
    });

    if (Meteor.isServer) {
      invalidateDep('allLists');
    }
  }
});

export const createTask = new ValidatedMethod({
  name: 'createTask',
  validate: null,
  run({
    listId,
    text,
  }) {
    const task = {
      text,
      listId,
      completed: false,
    };

    if (Meteor.isClient) {
      task.text = task.text + ' ...fake';
      return task;
    }

    Tasks.insert(task);
    invalidateDep(listId);

    return {
      deps: [getDepObj(listId)]
    };
  }
});
