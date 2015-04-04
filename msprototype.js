Transactions = new Meteor.Collection('transactions');
Currency = new Meteor.Collection('currency');
Tax = new Meteor.Collection('tax');
Fee = new Meteor.Collection('fee');
Raw = new Meteor.Collection('raw');
Totals = new Meteor.Collection('totals');



if (Meteor.isClient) {
  // counter starts at 0

  Meteor.subscribe('Transactions');
  Meteor.subscribe('Currency');
  Meteor.subscribe('Tax');
  Meteor.subscribe('Fee');
  Meteor.subscribe('Raw');
  Meteor.subscribe('Totals');

  Template.currency.helpers({
    getCurrency: function () {
      return Currency.find({});
    }

  });

  Template.taxrates.helpers({
    getTaxes: function () {
      return Tax.find({},{sort:{VendorIdentifier: 1}});
    }

  }); 

  Template.fees.helpers({
    getFees: function () {    
      return Fee.find({},{sort:{VendorIdentifier: 1}});
    }
  });  

  Template.totals.helpers({
    getTotals: function () {
      //Meteor.call(salesTotals)
      //Meteor.call('removeAllTotals');
      return Totals.find({});
    },

    totescurr: function() {
      var currency = numeral(this.totes).format('$0,0.00');

      //console.log(utcmonth);
    
      return currency;
  },

  });  

  Template.totals.events({
    "click #calc": function (e) {
      Meteor.call("removeAllTotals");
      Meteor.call("salesTotals");
    }
  });

  Template.taxrates.events({
    "change #tax": function(e,t) {
      var tx = t.find('#tax').value;
      console.log(tx);
      var tmp = Tax.find({VendorIdentifier: tx}).fetch();
      console.log(tmp);
      t.find('#taxValue').value = tmp[0].TaxRate;
    },

    "change #taxValue": function(e,t) {
      var tx = t.find('#tax').value;
      var txv = t.find('#taxValue').value;

      Meteor.call('chgTaxValue', tx, txv);
      Meteor.call('salesTotals');
    }  
  });

  Template.currency.events({
    "change #currency": function(e,t) {
      var cr = t.find('#currency').value;
      console.log(cr);
      var arg = cr.split(" ");
      console.log(arg);
      var tmp = Currency.find({CountryCode: arg[0], m: parseInt(arg[1]), y: parseInt(arg[2])}).fetch();
      console.log(tmp);
      t.find('#currValue').value = tmp[0].CurrencyValue;
    },

    "change #currValue": function(e,t) {
      var cr = t.find('#currency').value;
      var crv = t.find('#currValue').value;

      Meteor.call('chgCurrValue', cr, crv);
      Meteor.call('salesTotals');
    }  
  });

  Template.fees.events({
    "change #fee": function(e,t) {
      var fe = t.find('#fee').value;
      console.log(fe);
      var tmp = Fee.find({VendorIdentifier: fe}).fetch();
      console.log(tmp);
      t.find('#feeValue').value = tmp[0].FeeRate;
    },

    "change #feeValue": function(e,t) {
      var fe = t.find('#fee').value;
      var fev = t.find('#feeValue').value;

      Meteor.call('chgFeeValue', fe, fev);
      Meteor.call('salesTotals');
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
                    
                    Currency.insert({
                        CountryCode : data[17],
                        DownloadDate : tmpD8,
                        CurrencyValue : 1.2,
                        m: tmpD8.getMonth()+1,
                        y: tmpD8.getFullYear()
                    });
                  }

                  charlie = Fee.find({VendorIdentifier: data[2]}).count();
                  
                  if(charlie == 0){
                    Fee.insert({
                      VendorIdentifier : data[2],
                      FeeRate : .1
                    }); 

                    Tax.insert({
                      VendorIdentifier : data[2],
                      TaxRate: .1
                    });                                       
                  }

                  Raw.insert({
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
                  });

                  Transactions.insert({
    
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
                  });
                }
                
              }
            }
          }
        }
        reader.readAsText(file);
      }
     
    }

  });  
}

if (Meteor.isServer) {
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

        for(var i=0; i < tmp.length; i++){
          //console.log(tmp[i]);
          Transactions.update({_id: tmp[i]._id},{$set:{
            CurrencyRate: crv*1,
            ConvertedValue: tmp[i].CustomerPrice*crv,
            NetSaleValue : ((tmp[i].TaxValue)+(tmp[i].FeeValue)+(tmp[i].ConvertedValue * crv))*tmp[i].Units
          }}); 
        }
      },

      chgFeeValue: function(fe, fev){
        var tmp = Transactions.find({VendorIdentifier: fe}).fetch();
        var tmp2 = Fee.find({VendorIdentifier: fe}).fetch();

        Fee.update({_id: tmp2[0]._id},{$set:{
          FeeRate: fev
        }});

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
}

/*
      console.log('started');
      var files = e.target.files || e.dataTransfer.files;
      for (var i = 0, file; file = files[i]; i++) {
        if (file.type.indexOf("text") == 0) {
          var reader = new FileReader();
          reader.onloadend = function (e) {
            var text = e.target.result;
            //console.log(text);

            lines = text.split(/\r\n|\n/);

            for(var j=0; j<lines.length; j++){
              var data = lines[j].split(',');
              console.log(data);


              if(data.length > 1){
          var assignor = Meteor.users.findOne({emails: {$elemMatch: {address: data[7]}}});
          var assignee = Meteor.users.findOne({emails: {$elemMatch: {address: data[10]}}});
          console.log(assignor);
          var multiId = new Meteor.uuid();
          var counter = 0;
          var Comp = Company.findOne({name: data[2]});
          var Div = Division.findOne({name: data[3]});
          //if('priority' in Comp && 'priority' in Div && 'profile' in assignee){
            var tmpPriority = ( parseInt(Div.priority) + parseInt(Comp.priority) + parseInt(data[6]))/3;


              Tasks.insert({
                name: data[0],
                tnotes: data[1], 
                company: data[2], 
                division: data[3], 
                department: data[4], 
                compPriority: parseInt(Comp.priority),
                divPriority: parseInt(Div.priority),
                compId: Comp._id,
                divId: Div._id,
                priority: data[6],        
                priorityAvg: parseInt(Math.round(tmpPriority)),
                userid: Meteor.userId(),
                assignedTo: assignee._id,
                assignor: assignor.profile.name,
                assignee: assignee.profile.name,
                date: new Date(data[9].trim()),
                project: data[5],
                isDone: 0,
                dateCreated: new Date(),
                dateModified: new Date(),
                multiId: multiId,
                multiOption: ''
              });   
          }         
            }


          
          }


          reader.readAsText(file);
        }
      }*/