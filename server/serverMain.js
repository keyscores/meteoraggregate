function backfillTotals(cb) {
  cb = cb || _.noop;
  var timerDone = Util.timerReadout('backfillReadout');
  var now = new Date();
  var thisYear = 1900 + now.getYear();
  var thisMonth = now.getMonth() + 1;
  var firstYear = thisYear - 3;

  var yearMonths = {};
  Totals.find({}).forEach(function(t) {
    yearMonths[t.ContractID + '::' + t.y + '::' + t.m] = 1;
  });

  var bulkOp = ScratchTotals.rawCollection().initializeUnorderedBulkOp();
  var bulkReady = false;

  Contract.find({}).forEach(function(contract) {
    for (var y = firstYear; y <= thisYear; y++) {
      var maxMonth = (y === thisYear) ? thisMonth : 12;
      for (var m = 1; m <= maxMonth; m++) {
        var criteria = {m:m, y:y, ContractID:contract.ContractID};
        if (!yearMonths[contract.ContractID + '::' + y + '::' + m]) {
          criteria._id = ScratchTotals._makeNewID();
          bulkOp.insert(criteria);
          bulkReady = true;
        }
      }
    }
  });


  if (bulkReady) {
    bulkOp.execute(Meteor.bindEnvironment(function(err, result) {
      timerDone();
      if (!err) {
        cb();
      } else {
        console.error('backfillTotals ERROR', err);
      }
    }));
  } else {
    timerDone();
    cb();
  }

}

function runTotalNetSalesPipeline(cb) {
  cb = cb || _.noop;
  var timerDone = Util.timerReadout('runTotalNetSalesPipelineReadout');
  var pipeline = [
                  {
                    $match:{
                      $and:[
                        {ContractID:{$ne:null}},
                        {ContractID:{$exists:true}}
                      ]
                    }
                  },
                  { $group:
                    {
                      _id:{
                        m:"$m",
                        y:"$y",
                        ContractID:"$ContractID"
                      },
                      TotalNetSales: {
                        $sum:"$NetSaleValue"
                      }
                    }
                  },
                  {
                    $sort:{
                      '_id.ContractID':1,
                      '_id.y':1,
                      '_id.m':1
                    }
                  }
                ];

  var result = Transactions.aggregate(pipeline);

  var bulkOp = ScratchTotals.rawCollection().initializeUnorderedBulkOp();
  var bulkReady = false;

  console.info('salesTotals results', result.length);
  for (var i=0; i < result.length; i++) {

    if (!isNaN(result[i].TotalNetSales)) {
      bulkReady = true;
      // bulkOp.find(
      //   {
      //     m: result[i]._id.m,
      //     y: result[i]._id.y,
      //     ContractID: result[i]._id.ContractID
      //   }).upsert().update(
      //   {
      //     $set:{TotalNetSales:result[i].TotalNetSales}
      //   }
      // );
      bulkOp.insert({
        m: result[i]._id.m,
        y: result[i]._id.y,
        ContractID: result[i]._id.ContractID,
        TotalNetSales:result[i].TotalNetSales,
        _id:ScratchTotals._makeNewID(),

        TotalMedia:0.0,
        TotalEncoding:0.0
      });
    }
  }

  console.info('salesTotals running bulkOp', bulkReady);

  if (bulkReady) {
    bulkOp.execute(Meteor.bindEnvironment(function(err, result) {
      timerDone();
      if (!err) {
        cb();
      } else {
        console.error('runTotalNetSalesPipeline ERROR', err);
      }
    }));
  } else {
    timerDone();
    cb();
  }

}

function runRecoupablePipeline(cb) {
  cb = cb || _.noop;
  var timerDone = Util.timerReadout('runRecoupablePipelineReadout');
  var pipeline = [
                  { $group:
                    {
                      _id:{
                        m:"$m",
                        y:"$y",
                        ContractID:"$ContractID"
                      },
                      TotalEncoding: {
                        $sum:"$EncodingU$"
                      },
                      TotalMedia: {
                        $sum:"$MediaU$"
                      }
                    }
                  },
                  {
                    $sort:{
                      '_id.ContractID':1,
                      '_id.y':1,
                      '_id.m':1
                    }
                  }
                ];

  var result = Recoupable.aggregate(pipeline);

  var bulkOp = ScratchTotals.rawCollection().initializeUnorderedBulkOp();
  var bulkReady = false;

  console.info('runRecoupablePipeline, results length is', result.length);
  for (i=0; i < result.length; i++) {

    var TotalMedia = result[i].TotalMedia;
    var TotalEncoding = result[i].TotalEncoding;

    if (isNaN(TotalMedia) || typeof TotalMedia === 'undefined') {
      TotalMedia = 0.0;
    }

    if (isNaN(TotalEncoding) || typeof TotalEncoding === 'undefined') {
      TotalEncoding = 0.0;
    }

    bulkReady = true;
    bulkOp.insert({
          m: result[i]._id.m,
          y: result[i]._id.y,
          ContractID: result[i]._id.ContractID,
          TotalMedia:TotalMedia,
          TotalEncoding:TotalEncoding,
          _id:ScratchTotals._makeNewID(),

          TotalNetSales:0.0
        });
    // bulkOp.find({
    //       m: result[i]._id.m,
    //       y: result[i]._id.y,
    //       ContractID: result[i]._id.ContractID
    //     }).upsert().update({$set:{
    //         TotalMedia:TotalMedia,
    //         TotalEncoding:TotalEncoding
    //     }});
  }



  if (bulkReady) {
    bulkOp.execute(Meteor.bindEnvironment(function(err, result) {
      timerDone();
      if (!err) {
        cb();
      } else {
        console.error('runRecoupablePipeline ERROR', err);
      }
    }));
  } else {
    timerDone();
    cb();
  }

}

function runBalances(cb) {
  cb = cb || _.noop;
  var timerDone = Util.timerReadout('runBalancesReadout');
  var RawTotals = Totals.rawCollection();
  var bulkOp = RawTotals.initializeUnorderedBulkOp();
  var bulkReady = false;

  var netSalesBalance = 0;
  var encodingBalance = 0;
  var mediaBalance = 0;
  var lastMonthNetBalance = 0;
  var currentContract = null;

  var pipeline = [
                  { $group:
                    {
                      _id:{
                        m:"$m",
                        y:"$y",
                        ContractID:"$ContractID"
                      },
                      // TotalEncoding: {
                      //   $sum:"$EncodingU$"
                      // },
                      // TotalMedia: {
                      //   $sum:"$MediaU$"
                      // }

                      TotalMedia:{
                        $sum:"$TotalMedia"
                      },
                      TotalEncoding:{
                        $sum:"$TotalEncoding"
                      },
                      TotalNetSales:{
                        $sum:"$TotalNetSales"
                      }

                    }
                  },
                  {
                    $sort:{
                      '_id.ContractID':1,
                      '_id.y':1,
                      '_id.m':1
                    }
                  }
                ];

  var result = ScratchTotals.aggregate(pipeline);

  _.each(result, function(tot) {

    if (tot._id.ContractID !== currentContract) {
      netSalesBalance = 0;
      encodingBalance = 0;
      mediaBalance = 0;
      lastMonthNetBalance = 0;
      currentContract = tot._id.ContractID;
    }

    netSalesBalance += (tot.TotalNetSales || 0);
    encodingBalance += (tot.TotalEncoding || 0);
    mediaBalance += (tot.TotalMedia || 0);

    var netBalance = netSalesBalance + (encodingBalance + mediaBalance);

    bulkReady = true;
    bulkOp.insert({
      _id:Totals._makeNewID(),
      m:tot._id.m,
      y:tot._id.y,
      ContractID:tot._id.ContractID,

      TotalMedia:tot.TotalMedia,
      TotalNetSales:tot.TotalNetSales,
      TotalEncoding:tot.TotalEncoding,

      NetBalance:netBalance,
      EncodingBalance:encodingBalance,
      MediaBalance:mediaBalance,
      NetSalesBalance:netSalesBalance,
      AccountPayable:Math.max(0, netBalance - Math.max(0, lastMonthNetBalance))
    });

    lastMonthNetBalance = netSalesBalance + (encodingBalance + mediaBalance);

  });


  if (bulkReady) {
    Totals.remove({});

    bulkOp.execute(Meteor.bindEnvironment(function(err, result) {
      console.info('runBalances insert result.nInserted', result.nInserted);
      timerDone();
      if (err) {
        console.error('Exception running balances', err);
      } else {
        cb();
      }
    }));
  } else {
    timerDone();
    cb();
  }
}


Meteor.publish('Raw', function(){
  return Raw.find();
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

Meteor.publish('Contract', function(){
  return Contract.find();
});

Meteor.publish('Regime', function(){
  return Regime.find();
});

Meteor.startup(function () {
  Meteor.methods({
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
    chgTaxValue: function(_id, txv) {
      var timerDone = Util.timerReadout('taxReadout');

      Regime.update({_id:_id}, {$set:{
        Offshore: txv
      }});

      Meteor.call('enrichTransactions', function() {
        timerDone();
        Meteor.call('salesTotals');
      });

    },
    enrichTransactions: function(runSynchronously) {
      var timerDone = Util.timerReadout('enrichTransactionsReadout');
      var bulkOp, coll;
      Util.timerReadout('enrichTransactionsSetupReadout', function() {
        var regimeByYear = {};
        Regime.find({}).forEach(function(r) {
          regimeByYear[r.Regime + '::' + r.Year] = r;
        });

        var contractLookup = {};
        Contract.find({}).forEach(function(c) {
          contractLookup[c.VendorIdentifier + '::' + c.Region] = c;
        });

        var currencyLookup = {};
        Currency.find({}).forEach(function(c) {
          currencyLookup[c.CountryCode + '::' + c.y + '::' + c.m] = c;
        });


        coll = Transactions.rawCollection();
        bulkOp = coll.initializeUnorderedBulkOp();
        var count = 0;

        Transactions.find({}).forEach(function(tr) {
          var idx = count++;

          var region = Region.findOne({'CountryCode':tr.CountryCode});
          if (!region) {
            console.error('no region for country', tr.CountryCode);
          }

          var contract = null;

          if (region) {
            contract = contractLookup[tr.VendorIdentifier + '::' + region.Region];
            // Contract.findOne({
            //   VendorIdentifier:tr.VendorIdentifier,
            //   Region:region.Region
            // });
            if (!contract) {
              console.error('no contract for vendor', tr.VendorIdentifier, 'region', region.Region);
            }
          }

          var regime = (contract) ?
              regimeByYear[contract.Regime + '::' + tr.y]//Regime.findOne({Regime:contract.Regime, Year:tr.y})
              : null;

          if (regime) {
            regime = regime.Offshore;
          }

          tr.Region =     (region)    ? region.Region         : null;
          tr.ContractID = (contract)  ? contract.ContractID   : null;
          tr.TaxRate =    regime;

          var currency = currencyLookup[tr.CustomerCurrency + '::' + tr.y + '::' + tr.m];
          // Currency.findOne({
          //   CountryCode:tr.CustomerCurrency,
          //   m:tr.m,
          //   y:tr.y
          // });

          if (currency) {
            tr.CurrencyRate = currency.CurrencyValue;
            tr.ConvertedValue = tr.CustomerPrice * currency.CurrencyValue;
            // tr.NetSaleValue = ((tr.TaxValue)+(tr.FeeValue)+(tr.ConvertedValue * currency.CurrencyValue))*tr.Units;
          }

          // contract fee
          if (contract) {
            tr.FeeRate = contract.Fee;
            tr.FeeValue = tr.CustomerPrice * tr.FeeRate * tr.CurrencyRate;
            // tr.NetSaleValue = ((tr.ConvertedValue)+(tr.TaxValue)+(tr.CustomerPrice*tr.FeeRate))*tr.Units;
          }

          if (tr.TaxRate) {
            tr.TaxValue = tr.CustomerPrice * tr.TaxRate * tr.CurrencyRate;
            // tr.NetSaleValue = ((tr.ConvertedValue)+(tr.FeeValue)+(tr.CustomerPrice*txv))*tr.Units;
          }

          tr.GrossSales = tr.Units * tr.CustomerPrice * tr.CurrencyRate;

          tr.NetSaleValue = (tr.Units * tr.CustomerPrice * tr.CurrencyRate)
              - (tr.Units * tr.CustomerPrice * tr.CurrencyRate * tr.FeeRate)
              - (tr.Units * tr.CustomerPrice * tr.CurrencyRate * tr.TaxRate);

          bulkOp.find({_id: tr._id}).update({
            $set:{
              Region:tr.Region,
              ContractID:tr.ContractID,
              TaxRate:tr.TaxRate,
              CurrencyRate:tr.CurrencyRate,
              ConvertedValue:tr.ConvertedValue,
              FeeRate:tr.FeeRate,
              FeeValue:tr.FeeValue,
              TaxValue:tr.TaxValue,
              GrossSales:tr.GrossSales,
              NetSaleValue:tr.NetSaleValue
            }
          });

        });

      });

      if (runSynchronously) {
        Meteor.wrapAsync(bulkOp.execute)();
        timerDone();
        console.info('enrichTransactions done');
      } else {
        bulkOp.execute(Meteor.bindEnvironment(function (err, result) {
          timerDone();
          console.info('enrichTransactions done');
          if (err) {
            console.error('Exception enriching Transactions', err);
          }
        }));
      }

    },
    chgCurrValue: function(_id, crv) {
      var timerDone = Util.timerReadout('currencyKickoffReadout');
      var timerDone2 = Util.timerReadout('currencyReadout');

      Currency.update({_id:_id},{$set:{
        CurrencyValue: crv
      }});

      Meteor.call('enrichTransactions', function() {
        timerDone();
        Meteor.call('salesTotals');
      });

    },

    chgFeeValue: function(_id, fev){
      var timerDone = Util.timerReadout('feeReadout');

      Contract.update({_id:_id},{$set:{
        Fee: fev
      }});

      Meteor.call('enrichTransactions', function() {
        timerDone();
        Meteor.call('salesTotals');
      });
    },

    salesTotals: function(runSynchronously) {
      console.info('salesTotals starting');
      // Meteor.call('removeAllTotals');
      var timerDone = Util.timerReadout('salesTotalsReadout')

      ScratchTotals.remove({});

      if (runSynchronously) {

        console.info('backfill totals (sync)');
        Meteor.wrapAsync(backfillTotals)();

        console.info('Running total net sales (sync)');
        Meteor.wrapAsync(runTotalNetSalesPipeline)();

        console.info('Running total recoupable (sync)');
        Meteor.wrapAsync(runRecoupablePipeline)();

        console.info('Running balances (sync)');
        Meteor.wrapAsync(runBalances)();

        timerDone();

      } else {

        console.info('backfill totals');
        backfillTotals(function() {
          console.info('Running total net sales');
          runTotalNetSalesPipeline(function() {
            console.info('Running total recoupable');
            runRecoupablePipeline(function() {
              console.info('Running balances');
              runBalances(timerDone);
            });
          });
        });

      }

    }
  });
  console.info('Checking if we need enrichTransactions...');

  if (Transactions.find().count() > 0 && Transactions.find({
        $and:[
          {ContractID:{$exists:true}},
          {ContractID:{$ne:null}}
        ]
      }).count() === 0) {
    console.info('No contract ID on any transaction, running enrichTransactions');
    Meteor.call('enrichTransactions');
  }

});
