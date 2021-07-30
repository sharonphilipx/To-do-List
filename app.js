//jshint esversion:6
const express = require("express");
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _ = require('lodash');
//const date = require(__dirname + "/date.js");


const app = express();
// const items = ["Web Dev", "Python", "ML and DS", "Kotlin"];  //one of the quirks of JS
// let workItems =[];

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));
mongoose.connect("mongodb+srv://admin-sharon:Mxn5mwFjLPQoiJIs@cluster0.8scmj.mongodb.net/todolistDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
app.set('view engine', 'ejs'); //place only after express

const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Your to do list!"
});
const item2 = new Item({
  name: "+ to add new item"
});
const item3 = new Item({
  name: "<-- Hit check to delete"
});
const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String, //Name of the list like Work List, Home List
  items: [itemsSchema] //An array of itemSchema based items...
}

//Create a mongoose model
const List = mongoose.model("List", listSchema);


app.get("/", function(req, res) {
  //let day = date.getDate();

  Item.find({}, function(err, foundItems) { //This find function returns an array (foundItems)

    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully saved default items");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: "Today",
        newlistItems: foundItems
      });
    }

  });


});



app.post("/", function(req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list; //list is the name of the button in the list ejs

  const item = new Item({
    name: itemName
  });
  if (listName == "Today") {
    item.save();
    res.redirect("/");
  } else { //Our new item comes from a custom list and in the case, we need to search for that list doc in our db and add the item and embed it into the existing array of items.
    List.findOne({
      name: listName
    }, function(err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }


});

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if (listName == "Today") { //If you wanna delete an item from the default today list, do as usual
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Successfully Deleted checked item");
        res.redirect("/");
      }
    });
  } else { //If you wanna delete something from the customList, find the list with that custom listname and delete the item from there
    List.findOneAndUpdate({
      name: listName
    }, {
      $pull: {
        items: {
          _id: checkedItemId
        }
      }
    }, function(err, foundList) {
      if (!err) {
        res.redirect("/" + listName);
      }
    });
  }


});
app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({
    name: customListName
  }, function(err, foundList) { //findOne returns an object.. return one doc if its found
    if (!err) {
      if (!foundList) {
        //This is the path to Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save(function(err, result) { // Log the result parameter to the console to review it
         res.redirect("/" + customListName);
       });
        // list.save();
        // res.redirect("/" + customListName);
      } else {
        //This is the path to Show an existing list
        res.render("list", {
          listTitle: foundList.name,
          newlistItems: foundList.items
        });
      }
    }
  });



});

// app.get("/work", function(req, res) {         Removed to make the dynamic route. Lec 346
//   res.render("list", {
//     listTitle: "Work List",
//     newlistItems: workItems
//   });
// });

app.get("/about", function(req, res) {
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
// app.listen(port);

app.listen(port, function() {
  console.log("Server has started successfully");
});


// var currentDay = today.getDay();
// var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
// var day = " ";
// if (currentDay == 6 || currentDay == 0) {
//   day = days[currentDay];
// } else {
//   day = days[currentDay];
// }
// res.render("list", {
//   kindOfDay: day
// });
