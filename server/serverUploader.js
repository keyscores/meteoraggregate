//Try parsing csv with modweb:baby-parse

filePath = process.env.PWD + "/public/data/test.csv";
parsed = Baby.parseFiles(filePath, {header:true, dynamicTyping: true});
console.log(parsed.data);

// Allow Deny rules for collection FS. Do they need to be only on the serverside?

Images.allow({
  'insert': function () {
    // add custom authentication code here
    return true;
  }
});
