csvtojson = Meteor.npmRequire('csvtojson')
fs = Meteor.npmRequire('fs')

// fileStream = fs.createReadStream(filePath);
// converter = new csvtojson.Converter();
// converter.on("end_parsed", function (jsonObj) {
//    console.log(jsonObj); //here is your result json object
// });
// fileStream.pipe(converter);


// Using CollectionFS requires streaming the data.
// Cool reactive util from CollectionFS has a reactive callback to when a file is uploaded.
// help: https://forums.meteor.com/t/reading-an-uploaded-file-with-collectionfs/8630
Images.on('uploaded', function (fileObj) {
  //checking that something happens
  console.log('FileID just stored: ' + fileObj._id, fileObj.isUploaded(), fileObj.hasStored());
    readStream = fileObj.createReadStream();
    //delimiter is for tabs '\t', fork is to spawn a new system process to move out of the single loop
    converter = new csvtojson.Converter({delimiter:"\t", fork:true});
    converter
      .on("end_parsed", function (jsonObj) {
        console.log(jsonObj);
        //Transactions.insert({name: 1})
        //Transaction.insert(jsonobj)
      })
      .on("end", function (){
        console.log('end');
      });
    readStream.pipe(converter);
});


// Images.on('uploaded', function (fileObj) {
//   //checking that something happens
//   console.log('FileID just stored: ' + fileObj._id, fileObj.isUploaded(), fileObj.hasStored());
//   console.dir(fileObj);
//
//   console.log('waiting 0.1s');
//   Meteor.setTimeout(function() {
//
//     //create files from streams http://www.sitepoint.com/basics-node-js-streams/#piping
//     var readStream = fileObj.createReadStream();
//
//
//     csv
//      .fromStream(readStream, {headers : true, delimiter:'\t'})
//      .on("data", function(data){
//          console.log('csv data', data);
//          Transactions.insert(data)
//      })
//      .on("end", function(){
//          console.log("done with csv");
//      });
//
//   }, 100);
// });
//
