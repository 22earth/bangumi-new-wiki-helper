const Fuse = require('fuse.js');

function filterResults(items, searchstring, opts) {
  if (!items) return;
  let results = new Fuse(items, Object.assign({}, opts)).search(searchstring);
  if (!results.length) return;
  if (opts.startDate) {
    for (const result of results) {
      if (result.startDate &&
        new date(result.startDate) - new date(opts.startDate) === 0) {
        return result;
      }
    }
  } else {
    return results[0];
  }
}

module.exports = filterResults;
