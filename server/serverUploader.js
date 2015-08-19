// Parsing a csv directly from filesystem works with modweb:baby-parse

filePath = process.env.PWD + "/public/data/test.csv";
parsed = Baby.parseFiles(filePath, {header:true, dynamicTyping: true});
console.log(parsed);

// Using CollectionFS requires streaming the data. Somehow the data is not valid.
// Cool reactive util from CollectionFS has a reactive callback to when a file is uploaded.
// help: https://forums.meteor.com/t/reading-an-uploaded-file-with-collectionfs/8630
Images.on('uploaded', function (fileObj) {
  //checking that something happens
  console.log('FileID just uploaded: ' + fileObj._id);

  //create files from streams http://www.sitepoint.com/basics-node-js-streams/#piping
  readStream = fileObj.createReadStream('whatever.csv');
  writeStream = fileObj.createWriteStream('newwhatever.csv');
  readStream.pipe(writeStream)

  test = Baby.parseFiles(writeStream)
  console.log(test);
});
