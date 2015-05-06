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

      var tmp = Transactions.find({VendorIdentifier: tx}).fetch();
      var tmp2 = Tax.find({VendorIdentifier: tx}).fetch();

      Tax.update({_id: tmp2[0]._id},{$set:{
        TaxRate: txv
      }});

      for(var i=0; i < tmp.length; i++){
        Transactions.update({_id: tmp[i]._id},{$set:{
          TaxRate: txv,
          TaxValue: tmp[i].CustomerPrice * txv,
          NetSaleValue : ((tmp[i].ConvertedValue)+(tmp[i].FeeValue)+(tmp[i].CustomerPrice*txv))*tmp[i].Units
        }});
      }
    },

    chgCurrValue: function(cr, crv) {
      var arg = cr.split(" ");

      var tmp2 = Currency.find({CountryCode: arg[0], m: parseInt(arg[1]), y: parseInt(arg[2])}).fetch();
      var tmp = Transactions.find({CustomerCurrency: arg[0], m: parseInt(arg[1]), y: parseInt(arg[2])}).fetch();

      crv =  parseInt(crv);

      Currency.update({_id: tmp2[0]._id},{$set:{
        CurrencyValue: crv
      }});

      var t1 = (new Date()).getTime();
      for(var i=0; i < tmp.length; i++){
        //console.log(tmp[i]);
        Transactions.update({_id: tmp[i]._id},{$set:{
          CurrencyRate: crv*1,
          ConvertedValue: tmp[i].CustomerPrice*crv,
          NetSaleValue : ((tmp[i].TaxValue)+(tmp[i].FeeValue)+(tmp[i].ConvertedValue * crv))*tmp[i].Units
        }});
      }
      var t2 = (new Date()).getTime();
      console.info('chgCurrValue took', t2 - t1, 'ms');
    },

    chgFeeValue: function(fe, fev){
      var tmp = Transactions.find({VendorIdentifier: fe}).fetch();
      var tmp2 = Fee.find({VendorIdentifier: fe}).fetch();

      Fee.update({_id: tmp2[0]._id},{$set:{
        FeeRate: fev
      }});


      // see http://docs.mongodb.org/manual/reference/method/Bulk/#Bulk
      for(var i=0; i < tmp.length; i++){
        //console.log(tmp[i]);
        Transactions.update({_id: tmp[i]._id},{$set:{
          FeeRate : fev*1,
          FeeValue : tmp[i].CustomerPrice*fev,
          NetSaleValue : ((tmp[i].ConvertedValue)+(tmp[i].TaxValue)+(tmp[i].CustomerPrice*fev))*tmp[i].Units
        }});
      }
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
      Meteor.call('removeAllTotals');
      var pipeline = [
                      { $group:
                        {
                          _id : { m: "$m", y: "$y" },
                          totalAmount: {
                            $sum:   "$NetSaleValue"
                          }
                        }
                      }
                    ];

      var result = Transactions.aggregate(pipeline);



      for(var i=0; i < result.length; i++){
        if(!isNaN(result[i].totalAmount)){
          Totals.insert(
            {
              totes: result[i].totalAmount,
              m: result[i]._id.m,
              y: result[i]._id.y
            }
          );
        }
      }
    }
  });
});
