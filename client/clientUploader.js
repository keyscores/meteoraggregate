Template.upload.events({
  'change .myFileInput': function(event, template) {
    console.log('file changes');
    FS.Utility.eachFile(event, function(file) {
      Images.insert(file, function (err, fileObj) {
        // Inserted new doc with ID fileObj._id, and kicked off the data upload using HTTP
      });
    });
  }
});
