// counter starts at 0

Meteor.subscribe('Currency');
Meteor.subscribe('Regime');
Meteor.subscribe('Contract');
Meteor.subscribe('Raw');
//Totals ends up being too big for chrome to handle even if we don't render it.
//Meteor.subscribe('Totals'); 
Meteor.subscribe('Timers');

Template.currency.helpers({
  getCurrency: function () {
    return Currency.find({});
  }

});

Template.taxrates.helpers({
  getTaxes: function () {
    return Regime.find({},{sort:{Regime: 1, Year:1}});
  }

});

Template.contracts.helpers({
  getContracts: function () {
    return Contract.find({},{sort:{VendorIdentifier: 1, Region:1}});
  }
});

Template.totals.helpers({

  getTotals: function () {
    //Meteor.call(salesTotals)
    //Meteor.call('removeAllTotals');
    var criteria;
    var filter = Session.get('totalsContractFilter');
    if (filter === 'any' || typeof filter === 'undefined') {
      criteria = {};
    } else {
      criteria = {ContractID:parseInt(filter)};
    }

    return Totals.find(criteria, {sort:{ContractID:1, y:1, m:1}});
  },

  tasks: function () {
    return Tasks.find({}).count()
  },

  asCurrency: function(n) {
    var currency = numeral(n).format('$0,0.00');
    return currency;
  },

  getContracts: function () {
    return Contract.find({},{sort:{ContractID:1, VendorIdentifier: 1, Region:1}});
  }
});

Template.timers.helpers({
  backfillReadout:function() {
    return Timers.findOne({name:'backfillReadout'});
  },
  currencyReadout:function() {
    return Timers.findOne({name:'currencyReadout'});
  },
  currencyKickoffReadout:function() {
    return Timers.findOne({name:'currencyKickoffReadout'});
  },
  taxReadout:function() {
    return Timers.findOne({name:'taxReadout'});
  },
  feeReadout:function() {
    return Timers.findOne({name:'feeReadout'});
  },
  salesTotalsReadout:function() {
    return Timers.findOne({name:'salesTotalsReadout'});
  },
  enrichTransactionsReadout:function() {
    return Timers.findOne({name:'enrichTransactionsReadout'});
  },
  enrichTransactionsSetupReadout:function() {
    return Timers.findOne({name:'enrichTransactionsSetupReadout'});
  },
  runRecoupablePipelineReadout:function() {
    return Timers.findOne({name:'runRecoupablePipelineReadout'});
  },
  runTotalNetSalesPipelineReadout:function() {
    return Timers.findOne({name:'runTotalNetSalesPipelineReadout'});
  },
  runBalancesReadout:function() {
    return Timers.findOne({name:'runBalancesReadout'});
  }

});

Template.totals.events({
  "click #calc": function (e) {
    // Meteor.call("removeAllTotals");
    Meteor.call("salesTotals", function() {
      console.log('calc button done');
    });
  },
  "change #contract-filter": function (ev) {
    Session.set('totalsContractFilter', $(ev.target).val());
  }
});

Template.taxrates.events({
  "change #tax": function(e, t) {
    var _id = t.find('#tax').value;
    var tmp = Regime.findOne({_id:_id});
    t.find('#taxValue').value = tmp.Offshore;
  },

  "change #taxValue": function(e,t) {
    var _id = t.find('#tax').value;
    var txv = t.find('#taxValue').value;

    Meteor.call('chgTaxValue', _id, txv);
  }
});

Template.currency.events({
  "change #currency": function(e,t) {
    var _id = t.find('#currency').value;
    var tmp = Currency.findOne({_id:_id});
    t.find('#currValue').value = tmp.CurrencyValue;
  },

  "change #currValue": function(e,t) {
    var _id = t.find('#currency').value;
    var crv = t.find('#currValue').value;

    Meteor.call('chgCurrValue', _id, crv);
  }
});

Template.contracts.events({
  "change #fee": function(e,t) {
    var _id = t.find('#fee').value;
    var tmp = Contract.findOne({_id:_id});
    t.find('#feeValue').value = tmp.Fee;
  },

  "change #feeValue": function(e,t) {
    var _id = t.find('#fee').value;
    var fev = t.find('#feeValue').value;

    Meteor.call('chgFeeValue', _id, fev);
  },
});

Template.uploadcsv.events({
  "change #files": function (e) {
    console.log("file selected");

    Meteor.call('removeAllFee');
    Meteor.call('removeAllTax');
    Meteor.call('removeAllCurrency');
    Meteor.call('removeAllTransactions');
    Meteor.call('removeAllRaw');
    Meteor.call('removeAllTotals');

    var files = e.target.files || e.dataTransfer.files;
    for (var i = 0, file; file = files[i]; i++) {
      //console.log('loop');
      if (file.type.indexOf("text") == 0) {
       // console.log('if');
        var reader = new FileReader();
        //console.log(reader);
        reader.onloadend = function (e) {
          //console.log(e);
          var text = e.target.result;
          //console.log(text);

          lines = text.split(/\r\n|\n/);

          for(var j=1; j<lines.length; j++){
            var data = lines[j].split('\t');
            //console.log(data);
            if(data.length > 0){


              tmpD8 = new Date(data[11]);
              charlie3 = Currency.find({m: tmpD8.getMonth()+1, y: tmpD8.getFullYear(), CountryCode: data[17]}).count();
              if(!isNaN(tmpD8.getMonth()+1)){
                if(charlie3 == 0 && !isNaN(tmpD8.getMonth()+1)){

                  var newCurrency = {
                      CountryCode : data[17],
                      DownloadDate : tmpD8,
                      CurrencyValue : 1.2,
                      m: tmpD8.getMonth()+1,
                      y: tmpD8.getFullYear()
                  };
                  Currency.insert(newCurrency);
                  console.log('Currency.insert(' + JSON.stringify(newCurrency) + ');')
                }

                charlie = Fee.find({VendorIdentifier: data[2]}).count();

                if(charlie == 0){
                  var newFee = {
                    VendorIdentifier : data[2],
                    FeeRate : 0.1
                  };
                  Fee.insert(newFee);
                  console.log('Fee.insert(' + JSON.stringify(newFee) + ');')

                  var newTax = {
                    VendorIdentifier : data[2],
                    TaxRate: 0.1
                  };
                  Tax.insert(newTax);
                  console.log('Tax.insert(' + JSON.stringify(newTax) + ');')
                }

                var newRaw = {
                  Provider : data[0],
                  ProviderCountry : data[1],
                  VendorIdentifier : data[2],
                  UPC : data[3],
                  ISRC : data[4],
                  ArtistShow : data[5],
                  Title : data[6],
                  Label : data[7],
                  ProductTypeIdentifier : data[8],
                  Units : data[9],
                  RoyaltyPrice : data[10],
                  DownloadDate : data[11],
                  OrderId : data[12],
                  PostalCode : data[13],
                  CustomerIdentifier : data[14],
                  ReportDate : data[15],
                  SaleReturn : data[16],
                  CustomerCurrency : data[17],
                  CountryCode : data[18],
                  RoyaltyCurrency : data[19],
                  PreOrder : data[20],
                  ISAN : data[21],
                  CustomerPrice : data[22],
                  AppleIdentifier : data[23],
                  CMA : data[24],
                  AssetContentFlavor : data[25],
                  VendorOfferCode : data[26],
                  Grid : data[27],
                  PromoCode : data[28],
                  ParentIdentifier : data[29],
                  ParentTypeId : data[30],
                  AttributablePurchase : data[31],
                  PrimaryGenre : data[32]
                };
                Raw.insert(newRaw);
                console.log('Raw.insert(' + JSON.stringify(newRaw) + ');')

                var newTransactions = {
                  VendorIdentifier : data[2],
                  DownloadDate : tmpD8,
                  CurrencyRate : 1.2,
                  ConvertedValue : data[22]*1.2,
                  TaxRate : .1,
                  TaxValue : data[22]*.1,
                  FeeRate : .1,
                  FeeValue : data[22]*.1,
                  NetSaleValue : (data[22]*1.2)+(data[22]*.1)+(data[22]*.1)*data[9],
                  Units: data[9]*1,
                  CustomerPrice: data[22]*1,
                  CustomerCurrency: data[17],
                  m: tmpD8.getMonth()+1,
                  y: tmpD8.getFullYear()
                };
                Transactions.insert(newTransactions);
                console.log('Transactions.insert(' + JSON.stringify(newTransactions) + ');')
              }

            }
          }
        }
      }
      reader.readAsText(file);
    }

  }

});
