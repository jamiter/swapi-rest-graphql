// Store dependency versions in memory
const deps = {};

export function getDepObj(key) {
  const existingDep = deps[key];

  if (existingDep) {
    // Clone
    return { ...existingDep };
  }

  const newDep = {
    key: key,
    version: 0
  };

  deps[newDep.key] = newDep;

  return newDep;
}

export function invalidateDep(key) {
  const dep = getDepObj(key);

  dep.version = dep.version + 1;

  deps[dep.key] = dep;
}

export function depInvalidated({ key, version }) {
  const currentDep = getDepObj(key);

  if (currentDep.version > version) {
    return true;
  }
}
