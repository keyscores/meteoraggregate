Meteor.publish("Totals", function () {
    //testing server side filtering

    return Totals.find(
        {y:2015, ContractID: 373},
        {fields: {'months.TotalNetSales':1, 'months.m':1}}
    );
  });
