describe('Balance', function() {
  beforeEach(function() {
    Util.loadFixtures('balance');
    Util.meteorCallSync('enrichTransactions', true);
    Util.meteorCallSync('salesTotals', true);
  });

  afterEach(function() {
    Util.clearFixtures('balance');
  });


  it('should get NetBalance of 1581.27', function() {
    var year2015 = Totals.findOne({y:2015, ContractID:294});
    var may2015 = year2015.months[4];
    expect(may2015).toBeTruthy();
    expect(may2015.NetBalance).toBeCloseTo(1581.27, 2);
  });

  // {
  //   "ContractID": 294,
  //   "VendorID": 0498_20141610_SOFA_TIMMAIA,
  //   "Customer Sales": 3699.43,
  //   "Tax Rate": 0.1465,
  //   "Fee Rate": 0.25,
  //   "Tax Value": 541.966495,
  //   "Fee Value": 924.8575,
  //   "Net Sales": 2232.606005,
  //   "Net Sales Balance": 2232.606005,
  //   "Recoupable": -651.34,
  //   "Recoupable Balance": -651.34,
  //   "Net Balance": 1581.266005,
  //   "Accounts Payable": 1581.266005
  // }

});
