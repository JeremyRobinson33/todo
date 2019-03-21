const express = require('express');
const bodyParser = require('body-parser');
const date = require(__dirname + '/date.js');
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();


app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

mongoose.connect('/mongodb://localhost:27017/todolistDB',{useNewUrlParser:true});


const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model('Item',itemsSchema);

const item1 = new Item({
  name:'Get Food'
});

const item2 = new Item({
  name:'Cook Food'
});

const item3 = new Item({
  name:'Eat Food'
});

const defaultItems = [item1,item2,item3];

const listSchema = new mongoose.Schema ({
  name: String,
  items:[itemsSchema]
});

const List = mongoose.model('List',listSchema);

app.get('/', function(req,res) {
  const day = date.getDate();

  Item.find(function(err,items) {
    if(err) {
      console.log(err);
    } else {
      if (items.length === 0) {
        Item.insertMany(defaultItems,function(err){
          if(err) {
            console.log(err);
          } else {
            console.log("Items successfully stored in the db")
          }
        });
        res.redirect('/');
      } else {
        res.render('list', {listTitle: day, newListItems:items})
      }
    }
  });
});

app.post('/', function(req,res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item ({
    name: itemName
  });

  const day = date.getDay().toString() + ',';

  if(listName === day) {
    item.save();
    res.redirect('/');
  } else {
    List.findOne({name:listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect('/'+listName);
    })
  }
});

app.post('/delete', function(req,res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  const day = date.getDate().toString();

  if(listName === day) {
    Item.findByIdAndRemove(checkedItemId, function(err){
      if(!err){
        console.log("successfully removed item");
        res.redirect('/');
      }
    });
  } else {
    List.findOneAndUpdate({name:listName},{$pull: {items: {_id:checkedItemId}}}, function(err,foundList){
      if(!err) {
        res.redirect("/" + listName);
      }
    });
  }

});

app.get('/:customListName', function(req,res){
  const listName = _.capitalize(req.params.customListName);

  List.findOne({name:listName},function(err,foundList) {
    if(!err){
      if(!foundList) {
        //Create a new list
        const list = new List({
          name:listName,
          items: defaultItems
        });
        list.save();
        res.redirect('/' + listName);
      } else {
        //Show existing list
        res.render('list', {listTitle: foundList.name, newListItems:foundList.items})
      }
    }
  });
});

app.get('/work', function(req,res) {
  res.render('list', {listTitle:"Work List", newListItems: workItems});
});

app.post('/work', function(req,res) {
  const item = req.body.newItem;
  workItems.push(item);
  res.redirect('/work');
});

app.get('/about', function(req,res) {
  res.render('about');
});

app.listen(3003, function() {
  console.log("Server is up and running on port 3003");
});
