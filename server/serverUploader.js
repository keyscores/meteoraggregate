// Parsing a csv directly from filesystem works with modweb:baby-parse

filePath = process.env.PWD + "/public/data/test.csv";
parsed = Baby.parseFiles(filePath, {header:true, dynamicTyping: true});
console.log(parsed);


// Using CollectionFS requires streaming the data. Somehow the data is not valid.
// Cool reactive util from CollectionFS has a reactive callback to when a file is uploaded.
// help: https://forums.meteor.com/t/reading-an-uploaded-file-with-collectionfs/8630
Images.on('uploaded', function (fileObj) {
  //checking that something happens
  console.log('FileID just uploaed: ' + fileObj._id, fileObj.isUploaded(), fileObj.hasStored());
  console.dir(fileObj);

  console.log('waiting 10s');
  Meteor.setTimeout(function() {

    //create files from streams http://www.sitepoint.com/basics-node-js-streams/#piping
    var readStream = fileObj.createReadStream();
    var csvPieces = [];
    readStream.on('data', function(d) {
      csvPieces.push(d.toString());
    });
    readStream.on('end', function() {
      console.log('stream end?');
      var test = Baby.parse(csvPieces.join(''));
      console.log(test);
    });
    // var writeStream = fileObj.createWriteStream('newwhatever.csv');
    // readStream.pipe(writeStream)

  }, 10000);
});
