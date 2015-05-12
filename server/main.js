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
      Util.timerReadout('taxReadout', function() {

        var tmp = Transactions.find({VendorIdentifier: tx}).fetch();
        var tmp2 = Tax.find({VendorIdentifier: tx}).fetch();

        Tax.update({_id: tmp2[0]._id},{$set:{
          TaxRate: txv
        }});

        for(var i=0; i < tmp.length; i++){
          tmp[i].TaxRate = txv;
          tmp[i].TaxValue = tmp[i].CustomerPrice * txv;
          tmp[i].NetSaleValue = ((tmp[i].ConvertedValue)+(tmp[i].FeeValue)+(tmp[i].CustomerPrice*txv))*tmp[i].Units;
        }
        Meteor.wrapAsync(function(cb) {
          bulkCollectionUpdate(Transactions, tmp, {callback:cb});
        })();
      });
    },
    chgCurrValue: function(cr, crv) {
      Util.timerReadout('currencyReadout', function() {
        var arg = cr.split(" ");

        var tmp2 = Currency.find({CountryCode: arg[0], m: parseInt(arg[1]), y: parseInt(arg[2])}).fetch();
        var tmp = Transactions.find({CustomerCurrency: arg[0], m: parseInt(arg[1]), y: parseInt(arg[2])}).fetch();

        crv =  parseInt(crv);

        Currency.update({_id: tmp2[0]._id},{$set:{
          CurrencyValue: crv
        }});

        var t1 = (new Date()).getTime();


        for(var i=0; i < tmp.length; i++){
          tmp[i].CurrencyRate = crv * 1;
          tmp[i].ConvertedValue = tmp[i].CustomerPrice * crv;
          tmp[i].NetSaleValue = ((tmp[i].TaxValue)+(tmp[i].FeeValue)+(tmp[i].ConvertedValue * crv))*tmp[i].Units;
        }

        Meteor.wrapAsync(function(cb) {
          bulkCollectionUpdate(Transactions, tmp, {callback:cb});
        })();

      });
    },

    chgFeeValue: function(fe, fev){
      Util.timerReadout('feeReadout', function() {
        var tmp = Transactions.find({VendorIdentifier: fe}).fetch();
        var tmp2 = Fee.find({VendorIdentifier: fe}).fetch();

        Fee.update({_id: tmp2[0]._id},{$set:{
          FeeRate: fev
        }});


        // see http://docs.mongodb.org/manual/reference/method/Bulk/#Bulk
        for(var i=0; i < tmp.length; i++){
          //console.log(tmp[i]);
          tmp[i].FeeRate = fev*1;
          tmp[i].FeeValue = tmp[i].CustomerPrice*fev;
          tmp[i].NetSaleValue = ((tmp[i].ConvertedValue)+(tmp[i].TaxValue)+(tmp[i].CustomerPrice*fev))*tmp[i].Units;
        }
        Meteor.wrapAsync(function(cb) {
          bulkCollectionUpdate(Transactions, tmp, {callback:cb});
        })();
      });
    },

    updateTransactions: function(f,v) {

      Transactions.update({VendorIdentifier: v},{$set:{
        FeeRate : f*1,
        FeeValue : tmp[i].CustomerPrice*f,
        TaxRate: tmp[i].TaxRate,
        TaxValue: tmp[i].TaxValue,
        CurrencyRate: tmp[i].CurrencyRate,
        CurrencyValue: tmp[i].CuurencyValue,
        CustomerPrice: tmp[i].CustomerPrice,
        CustomerCurrency: tmp[i].CustomerCurrency,
        Units: tmp[i].Units,
        NetSaleValue : (tmp[i].CurrencyValue)+(tmp[i].TaxValue)+(tmp[i].CustomerPrice*f)*tmp[i].CustomerUnits
      }});
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
