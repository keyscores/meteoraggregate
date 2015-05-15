Meteor.publish('Raw', function(){
  return Raw.find();
});

Meteor.publish('Transactions', function(){
  return Transactions.find();
});

Meteor.publish('Fee', function(){
  return Fee.find();
});

Meteor.publish('Tax', function(){
  return Tax.find();
});

Meteor.publish('Currency', function(){
  return Currency.find();
});

Meteor.publish('Totals', function(){
  return Totals.find();
});

Meteor.publish('Timers', function(){
  return Timers.find();
});

Meteor.startup(function () {
  return Meteor.methods({
    removeAllFee: function() {
      return Fee.remove({});
    },
    removeAllTax: function() {
      return Tax.remove({});
    },
    removeAllCurrency: function() {
      return Currency.remove({});
    },
    removeAllRaw: function() {
      return Raw.remove({});
    },
    removeAllTransactions: function() {
      return Transactions.remove({});
    },
    removeAllTotals: function() {
      return Totals.remove({});
    },
    chgTaxValue: function(tx, txv) {
      var timerDone = Util.timerReadout('taxReadout');

      var tmp = Transactions.find({VendorIdentifier: tx});
      var tmp2 = Tax.find({VendorIdentifier: tx}).fetch();

      Tax.update({_id: tmp2[0]._id},{$set:{
        TaxRate: txv
      }});

      var coll = Transactions.rawCollection();
      var bulkOp = coll.initializeUnorderedBulkOp();

      tmp.forEach(function(tr) {
        bulkOp.find({_id: tr._id}).update({$set:{
          TaxRate:txv,
          TaxValue:tr.CustomerPrice * txv,
          NetSaleValue:((tr.ConvertedValue)+(tr.FeeValue)+(tr.CustomerPrice*txv))*tr.Units
        }});
      });
      bulkOp.execute(Meteor.bindEnvironment(function (err, result) {
        timerDone();
        if (err) {
          console.error('Exception updating Transactions', err);
        }
      }));

    },
    enrichTransactions: function(cr, crv) {
      var timerDone = Util.timerReadout('enrichTransactionsReadout');
      var coll = Transactions.rawCollection();
      var bulkOp = coll.initializeUnorderedBulkOp();


      Transactions.find({}).forEach(function(tr) {

        var region = Region.findOne({'CountryCode':tr.CountryCode});
        if (!region) {
          console.error('no region for country', tr.CountryCode);
        }

        var contract = null;

        if (region) {
          contract = Contract.findOne({
            VendorIdentifier:tr.VendorIdentifier,
            Region:region.Region
          });
          if (!contract) {
            console.error('no contract for vendor', tr.VendorIdentifier, 'region', region.Region);
          }
        }
        

        bulkOp.find({_id: tr._id}).update({$set:{
          Region:     (region)    ? region.Region         : null,
          ContractID: (contract)  ? contract.ContractID   : null,
          FeeRate:    (contract)  ? contract.Fee          : tr.FeeRate,
          Regime:     (contract)  ? Regime.findOne(
                                    {Regime:contract.Regime, Year:tr.y})      
                                                          : null,


        }});

      });

      bulkOp.execute(Meteor.bindEnvironment(function (err, result) {
        timerDone();
        if (err) {
          console.error('Exception enriching Transactions', err);
        }
      }));

    },
    chgCurrValue: function(cr, crv) {
      var timerDone = Util.timerReadout('currencyKickoffReadout');
      var timerDone2 = Util.timerReadout('currencyReadout');
      var arg = cr.split(" ");

      var tmp2 = Currency.find({CountryCode: arg[0], m: parseInt(arg[1]), y: parseInt(arg[2])}).fetch();
      var tmp = Transactions.find({CustomerCurrency: arg[0], m: parseInt(arg[1]), y: parseInt(arg[2])});

      // crv =  parseInt(crv);

      Currency.update({_id: tmp2[0]._id},{$set:{
        CurrencyValue: crv
      }});

      var t1 = (new Date()).getTime();

      var coll = Transactions.rawCollection();
      var bulkOp = coll.initializeUnorderedBulkOp();

      tmp.forEach(function(tr) {
        bulkOp.find({_id: tr._id}).update({$set:{
          CurrencyRate: crv*1,
          ConvertedValue: tr.CustomerPrice*crv,
          NetSaleValue : ((tr.TaxValue)+(tr.FeeValue)+(tr.ConvertedValue * crv))*tr.Units
        }});

      });

      timerDone();
      bulkOp.execute(Meteor.bindEnvironment(function (err, result) {
        console.info('Bulk op done', (new Date()).getTime());
        timerDone2();
        if (err) {
          console.error('Exception updating Transactions', err);
        }
      }));
      console.info('starting bulk op done', (new Date()).getTime());

    },

    chgFeeValue: function(fe, fev){
      var timerDone = Util.timerReadout('feeReadout');
      var tmp = Transactions.find({VendorIdentifier: fe});
      var tmp2 = Fee.find({VendorIdentifier: fe}).fetch();

      Fee.update({_id: tmp2[0]._id},{$set:{
        FeeRate: fev
      }});


      var coll = Transactions.rawCollection();
      var bulkOp = coll.initializeUnorderedBulkOp();

      tmp.forEach(function(tr) {
        bulkOp.find({_id: tr._id}).update({$set:{
          FeeRate:fev*1,
          FeeValue:tr.CustomerPrice*fev,
          NetSaleValue:((tr.ConvertedValue)+(tr.TaxValue)+(tr.CustomerPrice*fev))*tr.Units
        }});
      });

      bulkOp.execute(Meteor.bindEnvironment(function (err, result) {
        timerDone();
        if (err) {
          console.error('Exception updating Transactions', err);
        }
      }));


    },


    salesTotals: function() {
      // Meteor.call('removeAllTotals');
      Util.timerReadout('salesTotalsReadout', function() {

        Totals.remove({});
        var pipeline = [
                        { $group:
                          {
                            _id : { m: "$m", y: "$y" },
                            totalAmount: {
                              $sum:   "$NetSaleValue"
                            }
                          }
                        },
                        {
                          $sort:{
                            '_id.y':1,
                            '_id.m':1
                          }
                        }
                      ];

        var result = Transactions.aggregate(pipeline);


        var balance = 0.0;
        for (var i=0; i < result.length; i++) {
          if (!isNaN(result[i].totalAmount)) {
            balance += result[i].totalAmount;
            Totals.insert(
              {
                balance:balance,
                totes: result[i].totalAmount,
                m: result[i]._id.m,
                y: result[i]._id.y
              }
            );
          }
        }
      });
    }
  });
});
