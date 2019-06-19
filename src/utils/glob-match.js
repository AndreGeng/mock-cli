const minimatch = require('minimatch');

module.exports = (path, map) => {
  for (const [key, value] of Object.entries(map)) {
    if (minimatch(path, key)) {
      return value;
    }
  }
  return null;
};
