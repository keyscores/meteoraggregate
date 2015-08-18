Transactions = new Meteor.Collection('transactions');
Currency = new Meteor.Collection('currency');
Raw = new Meteor.Collection('raw');
Totals = new Meteor.Collection('totals');
ScratchTotals = new Meteor.Collection('scratchtotals');
Timers = new Meteor.Collection('timers');
Contract = new Meteor.Collection('contract');
Region = new Meteor.Collection('region');
Regime = new Meteor.Collection('regime');
Recoupable = new Meteor.Collection('recoupable');

// Tasks = new Mongo.Collection("tasks");

UploadedFiles = new Mongo.Collection("uploaded");
UploadedFiles.allow({
  insert: function(){
    return true;
  },
  update: function(){
    return true;
  }
});





//from collectionfs https://github.com/CollectionFS/Meteor-CollectionFS#getting-started
var name = "~/Desktop/meteoraggregate/uploads"
Images = new FS.Collection("images", {
  stores: [new FS.Store.FileSystem("images", {path: name})]
});

// Allow Deny rules for collection FS. Only are needed for client to insert directly.
// client side inserts need to be authorized with collection.allow() on server-side code (ok if it in shared code)
// CollectionFS inserts from client directly to mongo.
// from docs: " When you need to insert a file that's located on a client, always call myFSCollection.insert on the client. While you could define your own method, pass it the fsFile, and call myFSCollection.insert on the server, the difficulty is with getting the data from the client to the server. When you pass the fsFile to your method, only the file info is sent and not the data.
Images.allow({
  update: function () {
    // add custom authentication code here
    return true;
  },
  insert: function () {
    // add custom authentication code here
    return true;
  }
});
