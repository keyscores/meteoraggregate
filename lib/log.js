/* Lucas' experiment, logging all URLS called on meteor.

WebApp.rawConnectHandlers.use(function (req, res, next) {
  Log.info(req.connection.remoteAddress + ': ' + req.method + ' ' + req.url);
  //Requests.insert({ip:req.connection.remoteAddress});
  //Requests.insert({"ip":"req.connection.remoteAddress"});
  next();
});

*/