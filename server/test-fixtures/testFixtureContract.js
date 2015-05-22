if (process.env.IS_MIRROR && Contract.find().count() === 0) {  
  Contract.insert({"ContractID":294,"VendorIdentifier":"0498_20141610_SOFA_TIMMAIA","RightsHolder":"RT Features","Regime":"BR Entity","Region":"Brazil","Fee":0.25,"Release":"04/01/2015","Titles":"Tim Maia","Genre":"Drama","Type":"New Release","Origin":"Brazil","Awards":"None","Theatrical":"None"});
}
