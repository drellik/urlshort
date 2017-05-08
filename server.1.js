var express = require('express');
var bodyparser = require('body-parser');
var mongo = require('mongodb').MongoClient;
var dbUrl = "mongodb://localhost:27017/urlshort";

    var app = express();
    
    app.use(bodyparser.urlencoded({extended: false}));
    
    app.get('/', function(req, res) {
        res.send("<h3>Enter the url to shorten:</h3><br>\
        <form action='/' method='post'><input type='text' name='myUrl'></input>\
        <button type='submit'>Submit</button>");
    });
    
    app.get('/*', function(req, res) {
        var result;
        mongo.connect(dbUrl, function (err, db) {
            if (err) throw err;
            var collection = db.collection("sites");
            var myCursor = collection.find({'url': req.url.substr(1)}).toArray(function(err, docs){
                if (err) throw err;
                console.log('found '+docs.short);
            });
            //result = myCursor[1];
            //console.log('found '+result+':'+req.url.substr(1));
            //res.send('Shortened URL: https://urlshort-drellik.c9users.io/'+result);
            db.close();
        });
        res.send("going to website");
    });
    
    app.post('/', function(req, res) {
        var result;
        mongo.connect(dbUrl, function (err, db) {
            if (err) console.log("mongo.connect error: "+err);
            var collection = db.collection("sites");
            var myShort = 'a';
            //collection.remove({"short": "b"});
            //start test with find returning a result to use for update
            var shortCollection;
            shortCollection = collection.find({}, {"short": 1});
            shortCollection.forEach(function(err, docs){
                if (err) console.log(err);
                if (docs) myShort = docs.short;
                if (docs) result = String.fromCharCode(myShort.charCodeAt(0)+1);
            });
            
            myShort = String.fromCharCode(myShort+1);
            console.log("first myShort = "+myShort+" and result = "+result);
            //end test with find returning a result to use for update
            /*collection.find({}, {"url": 1, "short": 1}).toArray(function (err, docs){
                if (err) console.log("find short error: "+err);
                console.log(docs);
                var temp = 65;
                temp = docs[docs.length-1].short.charCodeAt(docs[docs.length-1].short.length-1);
                myShort = String.fromCharCode(temp+1);
                console.log("temp = "+temp+" myShort = "+myShort+" short is "+docs[docs.length-1].short+" sent url = "+req.body.myUrl);
                //collection.update({"url": req.body.myUrl}, {"url": req.body.myUrl, "short": "a"}, {upsert:true});
                //console.log(docs);
                result = myShort;
            //});
            //console.log("myShort = "+myShort);
            collection.update({"url": req.body.myUrl}, {"url": req.body.myUrl, "short": myShort}, {upsert:true});
            res.send('Shortened URL: https://urlshort-drellik.c9users.io/'+result);
            });*/
            collection.find({"url": req.body.myUrl}).toArray(function (err, documents){
                if (err) console.log("collection.find error: "+err);
                console.log(documents);
            });

            //res.send('Shortened URL: https://urlshort-drellik.c9users.io/'+result);
            db.close();
        });
        console.log('outside '+result);
      //res.send(result); //req.body.myUrl);
    });
    app.listen(8080);