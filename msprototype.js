


/*
      console.log('started');
      var files = e.target.files || e.dataTransfer.files;
      for (var i = 0, file; file = files[i]; i++) {
        if (file.type.indexOf("text") == 0) {
          var reader = new FileReader();
          reader.onloadend = function (e) {
            var text = e.target.result;
            //console.log(text);

            lines = text.split(/\r\n|\n/);

            for(var j=0; j<lines.length; j++){
              var data = lines[j].split(',');
              console.log(data);


              if(data.length > 1){
          var assignor = Meteor.users.findOne({emails: {$elemMatch: {address: data[7]}}});
          var assignee = Meteor.users.findOne({emails: {$elemMatch: {address: data[10]}}});
          console.log(assignor);
          var multiId = new Meteor.uuid();
          var counter = 0;
          var Comp = Company.findOne({name: data[2]});
          var Div = Division.findOne({name: data[3]});
          //if('priority' in Comp && 'priority' in Div && 'profile' in assignee){
            var tmpPriority = ( parseInt(Div.priority) + parseInt(Comp.priority) + parseInt(data[6]))/3;


              Tasks.insert({
                name: data[0],
                tnotes: data[1],
                company: data[2],
                division: data[3],
                department: data[4],
                compPriority: parseInt(Comp.priority),
                divPriority: parseInt(Div.priority),
                compId: Comp._id,
                divId: Div._id,
                priority: data[6],
                priorityAvg: parseInt(Math.round(tmpPriority)),
                userid: Meteor.userId(),
                assignedTo: assignee._id,
                assignor: assignor.profile.name,
                assignee: assignee.profile.name,
                date: new Date(data[9].trim()),
                project: data[5],
                isDone: 0,
                dateCreated: new Date(),
                dateModified: new Date(),
                multiId: multiId,
                multiOption: ''
              });
          }
            }



          }


          reader.readAsText(file);
        }
      }*/
