//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

// Create a new db
mongoose.connect("mongodb+srv://admin-jouni:test123@cluster09712.lleg3sz.mongodb.net/todolistDB", {
  useNewUrlParser: true
});
// mongoose.connect("mongodb://localhost:27017/todolistDB", {
//   useNewUrlParser: true
// });

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];

// Create 3 Item documents
const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item"
});

const item3 = new Item({
  name: "<-- Hit this to delete an item"
});

const defaultItems = [item1, item2, item3];

// Create a list schema
const listSchema = {
  name: String,
  items: [itemsSchema]
};

// Create a list model
const List = mongoose.model("List", listSchema);

// Item.insertMany(defaultItems, function(err) {
//   if(err) {
//     console.log(err);
//   } else {
//     console.log("Succesfully saved default items to DB.");
//   }
// });

app.get("/", function(req, res) {

  // const day = date.getDate();
  // res.render("list", {listTitle: day, newListItems: items});

  Item.find({}, function(err, foundItems) {
    // console.log(foundItems);
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Succesfully saved default items to DB.");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: foundItems
      });
    }
  });
});
// Item.find({}, function(err, foundItems){
//
//   if (foundItems.length === 0) {
//     Item.insertMany(defaultItems, function(err){
//       if (err) {
//         console.log(err);
//       } else {
//         console.log("Successfully savevd default items to DB.");
//       }
//     });
//     res.redirect("/");
//   } else {
//     res.render("list", {listTitle: "Today", newListItems: foundItems});
//   }
// });
// });

// Create a new list
app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({
    name: customListName
  }, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        // Create a new list

        const list = new List({
          name: customListName,
          items: defaultItems
        });

        list.save();
        res.redirect("/" + customListName);
        // console.log("Doesn't exist");
      } else {
        // Show an existing list
        // console.log("Exists");

        // Send to list.ejs
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        });

      }
    }
  })


});

app.post("/", function(req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save()
    // Show the item in the list by redirecting into the root route
    res.redirect("/");
  } else {
    List.findOne({
      name: listName
    }, function(err, foundList) {
      foundList.items.push(item);
      foundList.save();
      // Show the item in the list by redirecting into a custom route
      res.redirect("/" + listName);
    });
  }

});

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if (!err) {
        console.log("Succesfully deleted checked item.");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({
        name: listName
      }, {
        $pull: {
          items: {
            _id: checkedItemId
          }
        }
      },
      function(err, foundList) {
        if (!err) {
          res.redirect("/" + listName);
        }
      });
  }
  // console.log(req.body.checkbox);

});

app.get("/work", function(req, res) {
  res.render("list", {
    listTitle: "Work List",
    newListItems: workItems
  });
});

app.get("/about", function(req, res) {
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
