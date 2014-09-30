/**
 * Created with JetBrains WebStorm.
 * User: richard
 * Date: 12/19/13
 * Time: 9:09 PM
 * To change this template use File | Settings | File Templates.
 */

//   RUN WITH: npm start

var isSDK = require("isSDK");
var config = require("./lib/config.js");
var moment = require("moment");

isSDK.initialize(config.infusionsoft.APIName, config.infusionsoft.APIKey);

var appViewModel = {

    appName:ko.observable("Reschedule Infusionsoft Tasks"),

    dateFilter:ko.observable(),
    changeDate:ko.observable(),
    tasks:ko.observableArray(),

    changeDates:function(){

        if(appViewModel.changeDate()){

            var toDate = moment(appViewModel.changeDate(), "MM-DD-YYYY", true);

            //console.log("Move to date: " + toDate.toISOString());

            appViewModel.tasks().forEach(function(task){
                if(task.changeMe()){

                    // 2013-12-20T07:45:00.000Z
                    var current = moment(task.ActionDate);

                    var newDateString =
                        toDate.year() + "-" +
                        (toDate.month() + 1) + "-" +
                        toDate.date() + "T" +
                        current.hour() + ":" +
                        current.minute() + ":" + "00Z";

                    var newDate = moment(newDateString, "YYYY-MM-DDTHH:mm:ssZ", true);

//                    console.log("Date on task: " + current.toISOString());

//                    console.log("New Date on task: " + newDate.toISOString());


                    isSDK.dsUpdate("ContactAction", task.Id, {ActionDate: newDate.toISOString()}, function(error, result){
                        if(error){
//                            console.log("ERROR: " + error);

                        } else {
  //                          console.log("RESULT: " + result);
                        }

                        appViewModel.changeDate("");
                        appViewModel.getTasksFromServer();

                    });

//                    console.log("Changing date from " + task.ActionDate + " to " + appViewModel.changeDate() + " for task " + task.Id);
                }
            });
        }
    },

    changeAll:ko.observable(true),

    checkAll:function(){

        appViewModel.tasks().forEach(function(task){
            task.changeMe(appViewModel.changeAll());
        });

        return true;
    },

    getTasksFromServer: function(){

        appViewModel.tasks.removeAll();

        var filter = new moment(appViewModel.dateFilter()).format("YYYY-MM-DD") + "%";

        isSDK.dsQuery("ContactAction", 1000, 0, {ActionDate: filter, IsAppointment:0, ObjectType: "Task"}, [
            "Id",
            "ActionType",
            "ActionDescription",
            "ActionDate",
            "ContactId",
            "Priority"], function(error, tasks){

            if(error)
                throw new Error("Error" + error);


            tasks.forEach(function(tsk){


                isSDK.loadCon(tsk.ContactId, ["FirstName", "LastName", "Company"], function(cerror, contact){
                    if(cerror)
                        throw new Error("Error" + cerror);

                    var task = {
                        Id:tsk.Id,
                        Company:contact.Company,
                        ActionDescription:tsk.ActionDescription,
                        fullDescription:tsk.ActionType + "--" + tsk.ActionDescription + " (Priority:" + tsk.Priority + ")",
                        ActionType:tsk.ActionType,
                        ActionDate:tsk.ActionDate,
                        Priority:tsk.Priority,
                        fixDate:function(){
                            var dt = task.ActionDate;
                            return moment(dt).format("MM-DD-YYYY");
                        },
                        fullName:contact.FirstName + " " + contact.LastName,
                        changeMe:ko.observable(true)
                    };

                    appViewModel.tasks.push(task);



                })


            })

        });
    }
};


addEventListener('load', function () {

    var now = new moment().format("MM-DD-YYYY");

    appViewModel.dateFilter(now);

    ko.applyBindings(appViewModel);
    //appViewModel.getTasksFromServer();
});


$(document).foundation();

$(document).ready(function(){

    $('#dp1').fdatepicker({
        format: 'mm-dd-yyyy'
    });
    $('#dp2').fdatepicker({
        format: 'mm-dd-yyyy'
    });

});