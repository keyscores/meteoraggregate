
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