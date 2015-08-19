csvtojson = Meteor.npmRequire('csvtojson')
fs = Meteor.npmRequire('fs')

// Parsing a csv directly from filesystem works with modweb:baby-parse

// filePath = process.env.PWD + "/public/data/test.csv";
// // parsed = Baby.parseFiles(filePath, {header:true, dynamicTyping: true});
// // console.log(parsed);
// //


// fileStream = fs.createReadStream(filePath);
// converter = new csvtojson.Converter();
// converter.on("end_parsed", function (jsonObj) {
//    console.log(jsonObj); //here is your result json object
// });
// fileStream.pipe(converter);


// Using CollectionFS requires streaming the data. Somehow the data is not valid.
// Cool reactive util from CollectionFS has a reactive callback to when a file is uploaded.
// help: https://forums.meteor.com/t/reading-an-uploaded-file-with-collectionfs/8630
Images.on('uploaded', function (fileObj) {
  //checking that something happens
  console.log('FileID just stored: ' + fileObj._id, fileObj.isUploaded(), fileObj.hasStored());
  console.log('waiting 0.1s');

  Meteor.setTimeout(function() {
    readStream = fileObj.createReadStream();
    //delimiter is for tabs '\t', fork is to spawn a new system process to move out of the single loop
    converter = new csvtojson.Converter({delimiter:"\t", fork:true});
    converter
      .on("end_parsed", function (jsonObj) {
         //console.log(jsonObj);
         //TODO: insert into transcations fails with Error: Meteor code must always run within a Fiber.
        Transactions.insert(jsonObj);
      });
    readStream.pipe(converter);
  }, 100);
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
//      })
//      .on("end", function(){
//          console.log("done with csv");
//      });
//
//   }, 100);
// });
//
