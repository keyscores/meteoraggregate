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

Tasks = new Mongo.Collection("tasks");
//run whats below directly in mongo console. Activate mongo console with: >meteor mongo
//db.tasks.insert({ text: "Hello world!", createdAt: new Date() });

//from collectionfs https://github.com/CollectionFS/Meteor-CollectionFS#getting-started
var name = "~/Desktop/meteoraggregate/uploads"
Images = new FS.Collection("images", {
  stores: [new FS.Store.FileSystem("images", {path: name})]
});
