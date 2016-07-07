'use strict';
const async = require('async');
const fs = require('graceful-fs');
const path = require('path');
const uuid = require('node-uuid');
const mkdirp = require('mkdirp');

class LocalObjectStore {
  constructor(dir) {
    this.dir = dir || path.join(process.cwd(), 'store');
  }

  // list all stored objects by reading the file system
  list(cb) {
    var action = (err) => {
      if (err) {
        return cb(err);
      }
      this.readdir(this.dir, (err, files) => {
        if (err) {
          return cb(err);
        }
        files = files.filter((f) => {
          return f.substr(-5) === ".json";
        });
        var fileLoaders = files.map((f) => {
          return (cb) => {
            this.loadFile(f, cb);
          };
        });
        async.parallel(fileLoaders, (err, objs) => {
          if (err) {
            return cb(err);
          }
          this._sort(objs, cb);
        });
      });
    };
    mkdirp(this.dir, action);
  }

  // store an object to file
  add(obj, cb) {
    var action = (err) => {
      if (err) {
        return cb(err);
      }
      var json;
      try {
        json = JSON.stringify(obj, null, 2);
      } catch (e) {
        return cb(e);
      }
      obj.id = obj.id || uuid.v4();
      fs.writeFile(path.join(this.dir, obj.id + '.json'), json, 'utf8', (err) => {
        if (err) {
          return cb(err);
        }
        cb();
      });
    };
    mkdirp(this.dir, action);
  }

  // delete an object's file
  remove(id, cb) {
    var action = (err) => {
      if (err) {
        return cb(err);
      }
      fs.unlink(path.join(this.dir, id + '.json'), (err) => {
        cb(err);
      });
    };

    mkdirp(this.dir, action);
  }


  // load an object from file
  load(id, cb) {
    mkdirp(this.dir, (err) => {
      if (err) {
        return cb(err);
      }
      this.loadFile(path.join(this.dir, id + '.json'), cb);
    });
  }

  readdir(dir, cb) {
    fs.readdir(dir, (err, files) => {
      if (err) {
        return cb(err);
      }
      files = files.map((f) => {
        return path.join(dir, f);
      });
      cb(null, files);
    });
  }

  loadFile(f, cb) {
    fs.readFile(f, 'utf8', (err, code) => {
      if (err) {
        return cb("error loading file" + err);
      }

      try {
        cb(null, JSON.parse(code));
      } catch (e) {
        cb("Error parsing " + f + ": " + e);
      }
    });
  }

  _sort(objs, cb) {
    async.sortBy(objs, (obj, cb) => {
      cb(null, obj.name || '');
    }, cb);
  }
}

module.exports = LocalObjectStore;
