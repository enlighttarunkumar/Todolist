const express = require("express");
const bodyParser = require("body-parser");
const mongoose  = require('mongoose');
const { render } = require("ejs");
const app = express();
const _ = require("lodash"); // it is used to capatilised the listname 
const port  = process.env.PORT || 3000 ; 

app.set("view engine","ejs"); // this tell our app to use ejs 

app.use(bodyParser.urlencoded({extended:true}));

app.use(express.static("public")); // to use the public section we have to inherit it 

mongoose.connect("mongodb://localhost:27017/todolistDB");  // getting connected to our local database 

console.log("all good");
const itemSchema = new mongoose.Schema({ // this is the schema of the data which we want to save
    name: String
});


const Item = mongoose.model("Item",itemSchema);

const item1 = new Item({
    name: "Welcome to ToDo List"
});

const item2 = new Item({
    name: "Hit + button to add a new item "
});

const item3 = new Item({
    name: "<--Hit this to delete an item"
});

const defaultItem = [item1,item2,item3];

const listSchema = new mongoose.Schema({ // this is the schema of the data which we want to save
    name: String,
    items: [itemSchema] // array with datatype have itemSchema
});

const List = mongoose.model("List",listSchema);

app.get("/",function(req,res){ // req => request , res => response
    var day = "Today";
    Item.find({},function(err,data){
            if(data.length == 0){
                Item.insertMany(defaultItem,function(err){
                    if(err){
                        console.log(err);
                    }
                    else{
                        console.log("Defaults Item is inserted successfully !");
                    }
                });
                res.render("list",{kindofDay:day , NewListItem:data});
              // if here if i had to make index.html file as a root then i would have use res.sendFile("index.html") something like this 
            }
            else{
                res.render("list",{kindofDay:day , NewListItem:data});
            }
    });
});

app.get("/:customListName",function(req,res){
    const customListName = _.capitalize(req.params.customListName);
    console.log(customListName);
    List.findOne({name:customListName},function(err,data){
        if(!err){
            if(!data){
                const list = new List({
                    name:customListName,
                    items: defaultItem
                });
                list.save();
                res.redirect("/"+customListName);
            }
            else{
                console.log(data);
                res.render("list",{kindofDay:customListName , NewListItem:data.items});
            }
        }
    })
});

// now i have to insert and delete the data 




app.post("/",function(req,res){
    //console.log(req);
    const msg = req.body.ItemInput;
    const listname = req.body.SubmitButton;
    if(listname == "Today"){
        const newitem = new Item({
            name : msg
        });
        newitem.save();
        console.log("Yuhoo The new item is saved ! ");
       // console.log(item);
        res.redirect("/") // we are calling the app.get again 
    
       // req.render("list",{NewListItem:item});
    }
    else{
        List.findOne({name:listname} , function(err,data){
            if(!err){
                const newitem = new Item({
                    name : msg
                });
                data.items.push(newitem);
                data.save();
                res.redirect("/"+listname);
            }
        });
    }

});

app.post("/delete",function(req,res){
    //console.log(req.body.DeleteItem);
    const itemid = req.body.DeleteItem;
    const listname = req.body.Deletelist;
    if(listname == "Today"){
        Item.findByIdAndRemove(itemid,function(err){
            if(!err){
                console.log("Successfully Removed!");
                res.redirect("/");
            }
        });
    }
    else{
        List.findOneAndUpdate({name:listname},{$pull:{items:{_id:itemid}}},function(err,data){
            if(!err){
                res.redirect("/"+listname);
            }
        });
    }
    
})

app.listen(port,function(){
    console.log(`server is running on port ${port}`);
});

function GetDay(){
    var options = {
        weekday : "long",
        day : "numeric",
        month : "long"
    };
    var today = new Date;
    var day = today.toLocaleDateString("en-US",options);
    return day;
}

