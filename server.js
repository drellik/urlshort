var express = require('express');
var bodyparser = require('body-parser');
var fs = require('fs');

//returns a new Short URL for the hash.txt file
//Short URLs start at A and increase eg. B then C then E .. Z then a then b then c.
//When you get to z you add a character eg. z then AA then AB .. then zzzz then AAAAA then AAAAB.
function getNextHash(hash) {
    var newHash;
    var change = true;
    var allZ = false;
    var nextNumber = hash.toString().charCodeAt(hash.length-1)+1;

    //we need to adjust for characters inbetween capitols and lowercase A-Z (take out these charaters) a-z
    if (nextNumber == 91) nextNumber = 97;
    if (nextNumber == 123) {
        var temp = '';
        //check if all z's add a new digit
        for (var x = 0; x < hash.length; x++)
        {
            if (hash.toString().charCodeAt(x)+1 == 123) allZ = true;
            else 
            {
                allZ = false;
                x = hash.length;
            }
        }
        //update for various cases
        for (var x = 0; x < hash.length-1; x++)
        {
            if (hash.toString().charCodeAt(x)+1 == 123) 
            {
                if (allZ) change = false;
                if (allZ) temp += 'A';
                else temp += 'z';
            }
            else if (change)
            {
                change = false;
                temp += String.fromCharCode(hash.charCodeAt(x)+1);
            }
            else
            {
                temp += hash[x];
            }
        }
        hash = temp;
        //no matter what last digit should be A.
        hash += 'A';
        //if we need to add a digit do that otherwise reset to A
        if (allZ) hash += String.fromCharCode(64);
        nextNumber = 65;
    }
  
    newHash = hash.toString().substr(0, hash.length-1)+String.fromCharCode(nextNumber);
    return newHash;
}

//function returns your data with http:// if it doesnt exist otherwise if there
//already is a http:// or https:// it returns the original data.
//this function does not verify a website URL 
//eg. http.www.mysite.com will return http://http.www.mysite.com
//eg. thisIsNotARealWebsite will return http://thisIsNotARealWebsite
function addMyHttp(data) {
    var test = data.split('http://');
    var test2 = data.split('https://');

    //if the data passed does not have any http add one.
    if (test.length == 1 && test2.length == 1) return 'http://'+data;
    //if the data passed has http already just send back the data.
    if (test.length == 2 || test2.length == 2) return data;
    //if the data comes back with too many http's lets let the user know.
    return 'format error';
}

//function verify's a valid http format
//returns 'invalid URL format' if it fails
function testHttp(data)
{
    if (/((mailto\:|(news|(ht|f)tp(s?))\:\/\/){1}\S+)/i.test(data)) return true;
    return false;
}

    var app = express();
    
    app.use(bodyparser.urlencoded({extended: false}));
    
    //initial load of website.
    app.get('/', function(req, res) {
        res.send("<h3>Enter the url to shorten:</h3><br>\
        <form action='/' method='post'><input type='text' name='myUrl'></input>\
        <button type='submit'>Submit</button>");
    });
    
    //get the short url and forward to original website.
    app.get('/*', function(req, res) {
        var result = null;
       //get the short url
       var site = req.path.substr(1, req.path.length);
       //console.log(site);
       
       //find the short url in the hash.txt file
       var data = fs.readFileSync('hash.txt');
       var readData = JSON.parse(data.toString());
       for (var i = 0; i < readData.length; i++)
        {
            if (readData[i].short === site) result = readData[i].url;
        }
        
        //if the short url is not in the hash file report that.
        if (result == null) 
        {
            res.send("short url does not exist in the hash.");
        }
       
       //redirect to the new webpage
        res.redirect(result);
    });
    
    //Process the post data from the input form and show the corresponding Short URL.
    app.post('/', function(req, res) {
        var result = null;
        var data = fs.readFileSync('hash.txt');
        var readData = JSON.parse(data.toString());
        
        //Use the following code to correct missing http
        //check to see if the url is a fully qualified url starting with http://
       //if not add it for the user.
       //req.body.myUrl = addMyHttp(req.body.myUrl);
        
        //exit early if the URL is not valid.
        if (!testHttp(req.body.myUrl))
        {
            res.send ('Invalid URL format. Did you remember to include the "http://"?');
            return null;
        }
        
        //try to find a match already listed in the hash file.
        //then set the result to that short url.
        for (var i = 0; i < readData.length; i++)
        {
            if (readData[i].url === req.body.myUrl) result = readData[i].short;
        }
        
        //check if it wasn't found in the hash file add it to the file, and update result
        if (result == null)
        {
            result = getNextHash(readData[readData.length-1].short);
            readData.push({"url": req.body.myUrl, "short": result});
        }
        fs.writeFile('hash.txt', JSON.stringify(readData), (err) => {
            if (err) console.log(err);
        });
        
        //return the result
        console.log('result = '+result);
        res.writeHead(200,{"Content-Type":"text/html"});
        res.write('{"url": "'+req.body.myUrl+'", "short": "https://urlshort-drellik.c9users.io/'+result+'"}');
        res.end('<p>Your short URL is <a href="'+result+'">https://urlshort-drellik.c9users.io/'+result+'</a></p>');
    });
    app.listen(8080);