Meteor.publish('Raw', function(){
  return Raw.find();
});

Meteor.publish('Transactions', function(){
  return Transactions.find();
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
    enrichTransactions: function() {
      var timerDone = Util.timerReadout('enrichTransactionsReadout');
      var bulkOp, coll;
      Util.timerReadout('enrichTransactionsSetupReadout', function() {

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
            contract = Contract.findOne({
              VendorIdentifier:tr.VendorIdentifier,
              Region:region.Region
            });
            if (!contract) {
              console.error('no contract for vendor', tr.VendorIdentifier, 'region', region.Region);
            }
          }
          
          var regime = (contract) ?
              Regime.findOne({Regime:contract.Regime, Year:tr.y})
              : null;

          if (regime) {
            regime = regime.Offshore;
          }

          tr.Region =     (region)    ? region.Region         : null;
          tr.ContractID = (contract)  ? contract.ContractID   : null;
          tr.TaxRate =    regime;

          var currency = Currency.findOne({
            CountryCode:tr.CustomerCurrency,
            m:tr.m,
            y:tr.y
          });

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

          if (idx < 10) {
            console.info('tr', JSON.stringify(tr, null, 2));
          }

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


      bulkOp.execute(Meteor.bindEnvironment(function (err, result) {
        timerDone();
        console.info('enrichTransactions done');
        if (err) {
          console.error('Exception enriching Transactions', err);
        }
      }));

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

    salesTotals: function() {
      console.info('salesTotals starting');
      // Meteor.call('removeAllTotals');
      Util.timerReadout('salesTotalsReadout', function() {        
        Totals.remove({});


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

        var currentContract = null;
        var balance = 0.0;
        console.info('result.length', result.length);
        for (var i=0; i < result.length; i++) {

          console.info('result', result[i]);
          if (!isNaN(result[i].TotalNetSales)) {
            if (result[i]._id.ContractID !== currentContract) {
              currentContract = result[i]._id.ContractID;
              balance = 0.0;
            }

            balance += result[i].TotalNetSales;
            Totals.insert(
              {
                balance:balance,
                TotalNetSales:result[i].TotalNetSales,
                m: result[i]._id.m,
                y: result[i]._id.y,
                ContractID: result[i]._id.ContractID
              }
            );
          }
        }

        pipeline = [
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

        result = Recoupable.aggregate(pipeline);

        currentContract = null;
        var MediaBalance = 0.0, EncodingBalance = 0.0;
        console.info('second pass: result.length', result.length);
        
        for (i=0; i < result.length; i++) {

          console.info('result', result[i]);
          var TotalMedia = result[i].TotalMedia;
          var TotalEncoding = result[i].TotalEncoding;

          if (isNaN(TotalMedia)) {
            TotalMedia = 0.0;
          }

          if (isNaN(TotalEncoding)) {
            TotalEncoding = 0.0;
          }

          if (result[i]._id.ContractID !== currentContract) {
            currentContract = result[i]._id.ContractID;
            MediaBalance = 0.0;
            EncodingBalance = 0.0;
          }

          MediaBalance += TotalMedia;
          EncodingBalance += TotalEncoding;

          Totals.upsert({
                m: result[i]._id.m,
                y: result[i]._id.y,
                ContractID: result[i]._id.ContractID
              }, {$set:{
                  TotalMedia:TotalMedia,
                  TotalEncoding:TotalEncoding,
                  MediaBalance:MediaBalance,
                  EncodingBalance:EncodingBalance

              }});
        }

      });
    }
  });

  if (Transactions.find({ContractID:{$exists:true}}).count() === 0) {
    console.info('No contract ID on any transaction, running enrichTransactions');
    Meteor.call('enrichTransactions');
  }

});
