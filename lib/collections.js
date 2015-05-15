Transactions = new Meteor.Collection('transactions');
Currency = new Meteor.Collection('currency');
Tax = new Meteor.Collection('tax');
Fee = new Meteor.Collection('fee');
Raw = new Meteor.Collection('raw');
Totals = new Meteor.Collection('totals');
Timers = new Meteor.Collection('timers');
Contract = new Meteor.Collection('contract');
Region = new Meteor.Collection('region');
Regime = new Meteor.Collection('regime');
Recoupable = new Meteor.Collection('recoupable');

Tasks = new Mongo.Collection("tasks");
//run whats below directly in mongo console. Activate mongo console with: >meteor mongo
//db.tasks.insert({ text: "Hello world!", createdAt: new Date() });
