
Util = {

  timerReadout:function(readoutName, cb) {
    var t1 = (new Date()).getTime();
    var finished = function() {
      var d2 = new Date();
      Timers.upsert(
        {name:readoutName},
        {$set:{
          t:d2.getTime() - t1,
          d:d2
        }});
    }


    if (!cb) {
      return finished;
    } else {
      cb();
      finished();
    }
  }
}

if (Meteor.isServer) {
  _.extend(Util, {
    fixtureData:{},
    addFixture:function(name, collection, data) {
      if (!Util.fixtureData[name]) {
        Util.fixtureData[name] = [];
      }
      Util.fixtureData[name].push({collection:collection, data:data});
    },
    loadFixtures:function(name) {
      var cleared = {};
      _.each(Util.fixtureData[name], function(fixture) {
        var collectionName = fixture.collection._name;
        if (!cleared[collectionName]) {
          fixture.collection.remove({});
          cleared[collectionName] = 1;
        }
        _.each(fixture.data, function(doc) {
          fixture.collection.insert(doc);
        });
      });
      console.info('done loadFixtures');
    },
    clearFixtures:function(name) {
      var cleared = {};
      _.each(Util.fixtureData[name], function(fixture) {
        var collectionName = fixture.collection._name;
        if (!cleared[collectionName]) {
          fixture.collection.remove({});
          cleared[collectionName] = 1;
        }
      });
    },
    meteorCallSync:function() {
      var originalArgs = arguments;
      var sync = Meteor.wrapAsync(Meteor.call);
      sync.apply(Meteor, originalArgs);
    }
  });
}
