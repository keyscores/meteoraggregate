// Parsing a csv directly from filesystem works with modweb:baby-parse

filePath = process.env.PWD + "/public/data/test.csv";
parsed = Baby.parseFiles(filePath, {header:true, dynamicTyping: true});
console.log(parsed);

// Using CollectionFS requires streaming the data. Somehow the data is not valid.
// Cool reactive util from CollectionFS has a reactive callback to when a file is uploaded.
Images.on('uploaded', function (fileObj) {
  console.log(fileObj._id);
  readStream = fileObj.createReadStream('whatever.csv');
  writeStream = fileObj.createWriteStream('whatever.csv');

  readStream.pipe(writeStream)
  test = Baby.parseFiles(writeStream)
  console.log(test);
});
