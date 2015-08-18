//Try parsing csv with modweb:baby-parse

filePath = process.env.PWD + "/public/data/test.csv";
parsed = Baby.parseFiles(filePath, {header:true, dynamicTyping: true});
console.log(parsed);


// Cool reactive util from CollectionFS has a reactive callback to when a file is uploaded.
Images.on('uploaded', function (fileObj) {
  // do something
  console.log(fileObj._id);
  file = fileObj.createReadStream();
  console.log(file);
  // Generating error with parsing the same files as is sucessfully parsed above.
  parsed = Baby.parseFiles(file.pipe());
  console.log(parsed);
  //UploadedFiles.insert({fileid: fileObj._id , name: fileObj.data.blob.name});



});


// Images.deny({
//    update: function(){
//    return false;
//    },
//    insert: function () {
//      // add custom authentication code here
//      return false;
//    }
//  });
