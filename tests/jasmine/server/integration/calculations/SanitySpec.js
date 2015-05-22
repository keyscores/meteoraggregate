describe('Sane integration tests', function() {

  beforeEach(function() {
    Util.loadFixtures('balance');
    Util.meteorCallSync('enrichTransactions', true);
    // Meteor.call('salesTotals');
  });

  afterEach(function() {
    Util.clearFixtures('balance');
  });


  it('should run inside a mirror', function() {
    expect(process.env.IS_MIRROR).toBeTruthy();
  });

  it('should have access to exactly 1 contract from the test fixture', function() {
    expect(Contract.find().count()).toBe(1);
  });

  it('should have run enrichTransactions and put ContractID on each transaction', function() {
    expect(Transactions.find({$and:[
      {ContractID:{$ne:null}},
      {ContractID:{$exists:true}}
    ]}).count()).toBe(Transactions.find({}).count());

    expect(Transactions.find({}).count()).toBeGreaterThan(0);
  });

});
