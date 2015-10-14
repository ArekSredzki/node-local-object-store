var ObjectStore = require('../'),
  temp = require('temp'),
  fs = require('graceful-fs'),
  path = require('path'),
  async = require('async'),
  assert = require('chai').assert;

// Automatically track and cleanup files at exit
temp.track();

env = {
  test: true
};

describe("ObjectStore", function() {
  var dir;
  var store;

  beforeEach(function() {
    dir = temp.mkdirSync('store');
    store = ObjectStore(dir);
  });

  it('should store in specified dir', function() {
    assert.equal(store.dir, dir);
  });

  it('should store data in process.cwd/store when dir is not specified', function() {
    store = ObjectStore();
    assert.equal(store.dir, path.join(process.cwd(), 'store'));
  });

  describe('#list()', function() {
    it('should return no objects', function() {
      store.list(function(err, entries) {
        assert.isNull(err);
        assert.deepEqual(entries, []);
      });
    });
    it('should list three objects', function(done) {
      var adds = [1, 2, 3].map(function(i) {
        return function(cb) {
          store.add({
            id: i,
            name: "OBJ" + i
          }, cb);
        };
      });

      async.parallel(adds, function() {
        store.list(function(err, entries) {
          assert.isNull(err);
          assert.equal(entries.length, 3);
          assert.deepEqual(entries[0], {
            id: 1,
            name: "OBJ1"
          });
          assert.deepEqual(entries[1], {
            id: 2,
            name: "OBJ2"
          });
          assert.deepEqual(entries[2], {
            id: 3,
            name: "OBJ3"
          });
          done();
        });
      });
    });
  });

  describe('#add()', function() {
    it('should save object', function(done) {
      var obj = {
        id: 'donkey',
        name: 'burro'
      };
      store.add(obj, function(err) {
        assert.ok(!err);

        var file = path.join(dir, 'donkey.json');
        assert.isTrue(fs.existsSync(file));

        fs.readFile(file, 'utf8', function(err, content) {
          assert.isNull(err);
          try {
            assert.deepEqual(obj, JSON.parse(content));
            done();
          } catch (e) {
            console.log(e);
            done(e);
          }
        });

      });
    });
  });

  describe('#remove()', function() {
    it('should remove object', function(done) {
      var obj = {
        id: 'donkey',
        name: 'burro'
      };
      var file = path.join(store.dir, obj.id + '.json');
      store.add(obj, function(err) {
        assert.ok(!err, 'error on save: ' + err);
        assert.isTrue(fs.existsSync(file), 'create file');
        store.remove(obj, function(err) {
          assert.ok(!err, 'error on remove: ' + err);
          assert.isFalse(fs.existsSync(file), 'remove file');
          done();
        });
      });
    });
  });
});
