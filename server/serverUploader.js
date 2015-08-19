// Parsing a csv directly from filesystem works with modweb:baby-parse

filePath = process.env.PWD + "/public/data/test.csv";
parsed = Baby.parseFiles(filePath, {header:true, dynamicTyping: true});
console.log(parsed);


// Using CollectionFS requires streaming the data. Somehow the data is not valid.
// Cool reactive util from CollectionFS has a reactive callback to when a file is uploaded.
// help: https://forums.meteor.com/t/reading-an-uploaded-file-with-collectionfs/8630
Images.on('uploaded', function (fileObj) {
  //checking that something happens
  console.log('FileID just stored: ' + fileObj._id, fileObj.isUploaded(), fileObj.hasStored());
  console.dir(fileObj);

  console.log('waiting 10s');
  Meteor.setTimeout(function() {

    //create files from streams http://www.sitepoint.com/basics-node-js-streams/#piping
    var readStream = fileObj.createReadStream();


    csv
     .fromStream(readStream, {headers : true})
     .on("data", function(data){
         console.log('csv data', data);
     })
     .on("end", function(){
         console.log("done with csv");
     });

  }, 10000);
});
