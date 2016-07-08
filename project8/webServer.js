"use strict";

/* jshint node: true */

/*
 * This builds on the webServer of previous projects in that it exports the current
 * directory via webserver listing on a hard code (see portno below) port. It also
 * establishes a connection to the MongoDB named 'cs142project6'.
 *
 * To start the webserver run the command:
 *    node webServer.js
 *
 * Note that anyone able to connect to localhost:portNo will be able to fetch any file accessible
 * to the current user in the current directory or any of its children.
 *
 * This webServer exports the following URLs:
 * /              -  Returns a text status message.  Good for testing web server running.
 * /test          - (Same as /test/info)
 * /test/info     -  Returns the SchemaInfo object from the database (JSON format).  Good
 *                   for testing database connectivity.
 * /test/counts   -  Returns the population counts of the cs142 collections in the database.
 *                   Format is a JSON object with properties being the collection name and
 *                   the values being the counts.
 *
 * The following URLs need to be implemented:
 * /user/list     -  Returns an array containing all the User objects from the database.
 *                   (JSON format)
 * /user/:id      -  Returns the User object with the _id of id. (JSON format).
 * /photosOfUser/:id' - Returns an array with all the photos of the User (id). Each photo
 *                      should have all the Comments on the Photo (JSON format)
 *
 */
//photos more involved, need to send two requests, need to use find1 or something along those lines
var mongoose = require('mongoose');
var async = require('async');


// Load the Mongoose schema for User, Photo, and SchemaInfo
var User = require('./schema/user.js');
var Photo = require('./schema/photo.js');
var SchemaInfo = require('./schema/schemaInfo.js');

var bodyParser = require('body-parser');
var multer = require('multer');
var processFormBody = multer({storage: multer.memoryStorage()}).single('uploadedphoto');
var session = require('express-session');
var express = require('express');
var app = express();
var fs = require("fs");

mongoose.connect('mongodb://localhost/cs142project6');

// We have the express static module (http://expressjs.com/en/starter/static-files.html) do all
// the work for us.
app.use(express.static(__dirname));
app.use(session({secret: 'secretKey', resave: false, saveUninitialized: false}));
app.use(bodyParser.json());



app.get('/', function (request, response) {
    response.send('Simple web server of files from ' + __dirname);
});

/*
 * Use express to handle argument passing in the URL.  This .get will cause express
 * To accept URLs with /test/<something> and return the something in request.params.p1
 * If implement the get as follows:
 * /test or /test/info - Return the SchemaInfo object of the database in JSON format. This
 *                       is good for testing connectivity with  MongoDB.
 * /test/counts - Return an object with the counts of the different collections in JSON format
 */
app.get('/test/:p1', function (request, response) {
    // Express parses the ":p1" from the URL and returns it in the request.params objects.
    console.log('/test called with param1 = ', request.params.p1);

    var param = request.params.p1 || 'info';

    if (param === 'info') {
        // Fetch the SchemaInfo. There should only one of them. The query of {} will match it.
        SchemaInfo.find({}, function (err, info) {
            if (err) {
                // Query returned an error.  We pass it back to the browser with an Internal Service
                // Error (500) error code.
                console.error('Doing /user/info error:', err);
                response.status(500).send(JSON.stringify(err));
                return;
            }
            if (info.length === 0) {
                // Query didn't return an error but didn't find the SchemaInfo object - This
                // is also an internal error return.
                response.status(500).send('Missing SchemaInfo');
                return;
            }

            // We got the object - return it in JSON format.
            console.log('SchemaInfo', info[0]);
            response.end(JSON.stringify(info[0]));
        });
    } else if (param === 'counts') {
        // In order to return the counts of all the collections we need to do an async
        // call to each collections. That is tricky to do so we use the async package
        // do the work.  We put the collections into array and use async.each to
        // do each .count() query.
        var collections = [
            {name: 'user', collection: User},
            {name: 'photo', collection: Photo},
            {name: 'schemaInfo', collection: SchemaInfo}
        ];
        async.each(collections, function (col, done_callback) {
            col.collection.count({}, function (err, count) {
                col.count = count;
                done_callback(err);
            });
        }, function (err) {
            if (err) {
                response.status(500).send(JSON.stringify(err));
            } else {
                var obj = {};
                for (var i = 0; i < collections.length; i++) {
                    obj[collections[i].name] = collections[i].count;
                }
                response.end(JSON.stringify(obj));

            }
        });
    } else {
        // If we know understand the parameter we return a (Bad Parameter) (400) status.
        response.status(400).send('Bad param ' + param);
    }
});

/*
 * URL /user/list - Return all the User object.
 */
app.get('/user/list', function (request, response) {
    //console.log("In user list");
    if(typeof request.session.user === 'undefined'){
        console.log("No current user");
        response.status(401).send("No user logged in");
    }
    //console.log("cur user: ", request.session.user);
    User.find(function(error, users){
        if(error){
            response.status(500).send("Error!");
        }
        response.end(JSON.stringify(users));
    });
});

app.get('/search/:searchId', function(request, response){
    if(typeof request.session.user === 'undefined'){
        response.status(401).send("No user logged in");
    }
    if(request.params.searchId === ""){
        console.log("No search term");
        response.status(400).send("No search term");
    }
    var searchTerm = request.params.searchId.toLocaleLowerCase();
    var returnObject = {};
    var calls = [];
    returnObject.photoArray = [];
    Photo.find(function(error, photos){
        var length = photos.length;
        var counter = 0;
        for(var i = 0; i < length; i++){
            var comLength = photos[i].comments.length;
            for(var j = 0; j < comLength; j++){
                var comment = JSON.parse(JSON.stringify(photos[i].comments[j]));
                var commented = photos[i].comments[j].comment;
                commented = commented.toLocaleLowerCase();
                //if(photos[i].comments[j].toLocaleLowerCase().search(searchTerm) !== -1){
                if(commented.search(searchTerm) !== -1){
                    returnObject.photoArray.push(JSON.parse(JSON.stringify(photos[i])));
                    var currSize = returnObject.photoArray.length - 1;
                    console.log(returnObject.photoArray[currSize].user_id);
                    var func3 = function(index2, size2){ //gets the user for the picture
                        calls.push(function(callback){
                            var func2 = function(currId, index){
                                User.findOne({_id: currId}, function(error, user3){
                                    if(error){
                                        response.status(400).send("Could not find user associated with picture");
                                    }
                                    returnObject.photoArray[index].userItem = user3;
                                    callback();
                                })
                            }(photos[index2].user_id, size2);
                        });
                    }(i, currSize);
                    var func4 = function(size3, comment2){ //gets the user for the comment
                        calls.push(function(callback2){
                            var func = function(num1, currComment){
                                User.findOne({_id: currComment.user_id}, function(error, user2){
                                    if(error){
                                        response.status(400).send("Error finding user for this comment!");
                                    }
                                    //console.log(currComment);
                                    currComment.user = user2;
                                    returnObject.photoArray[num1].comment = currComment;
                                    callback2();
                                });
                            }(size3, comment2);
                        });
                    }(currSize, comment);
                    counter++;
                    break;
                }

            }

            if(counter >= 20){
                break;
            }
        }

        async.parallel(calls, function(err, result){
            if(err){
                console.log(err);
            }
            console.log(returnObject.photoArray[0].comment.user);
            response.end(JSON.stringify(returnObject));
        });
    });
});

app.post('/user', function(request, response){
    User.findOne({login_name: request.body.login_name}, function(error, user){
        if(error){
            console.log("Error");
            response.status(400).send("No user found");
        }
        else{
            if(user !== null){
                console.log("Already a user");
                response.status(400).send("Already a user!");
            }
            else{
                User.create({
                    first_name: request.body.first_name,
                    last_name: request.body.last_name,
                    location: request.body.location,
                    description: request.body.description,
                    occupation: request.body.occupation,
                    login_name: request.body.login_name,
                    activity: "Registered",
                    password: request.body.password
                }, function (err, userObj) {
                    if (err) {
                        console.error('Error create user', err);
                    } else {
                        // Set the unique ID of the object. We use the MongoDB generated _id for now
                        // but we keep it distinct from the MongoDB ID so we can go to something
                        // prettier in the future since these show up in URLs, etc.
                        userObj.id = userObj._id;
                        userObj.save();
                        console.log(userObj);
                        request.session.user = userObj;
                        response.end(JSON.stringify(userObj));
                    }
                });
            }
            //need to update express session?
        }
    });
});

app.post('/toggleLike/:photoId', function(request, response){
    if(typeof request.session.user === 'undefined'){
        response.status(401).send("No user logged in");
    }
    var photoId = request.params.photoId;
    console.log("Session user: ", request.session.user);
    var userId = request.session.user.id;
    console.log("User id: ", userId);
    Photo.findOne({_id: photoId}, function(error, photo){
        if(error || photo === null){
            response.status(400).send("Error finding photo");
        }
        console.log("Likes: ", photo.likes);
        var index = photo.likes.indexOf(userId);
       if(index === -1){
           console.log("Added a like");
           photo.likes.push(userId);
           photo.save();
           response.end("Added like");
       }
        else{
           console.log("Removed a like");
           photo.likes.splice(index, 1);
           photo.save();
           response.end("Removed a like");
       }
    });
});

/*
 * URL /user/:id - Return the information for User (id)
 */
app.get('/user/:id', function (request, response) {
    if(typeof request.session.user === 'undefined'){
        response.status(401).send("No user logged in");
    }
    User.findOne({_id: request.params.id}, function(error, user){
        //console.log(user);
        if(error){
            console.log("error!");
            response.status(400).send("Error obtaining user!");
        }
        response.end(JSON.stringify(user));
    });
});

app.post('/photos/new', function(request, response){
    if(typeof request.session.user === 'undefined'){
        response.status(401).send("No user logged in");
    }
    //console.log("in new photo!");
    processFormBody(request, response, function (err) {
        if (err || !request.file) {
            response.status(400).send("Error with file");
            return;
        }
        // request.file has the following properties of interest
        //      fieldname      - Should be 'uploadedphoto' since that is what we sent
        //      originalname:  - The name of the file the user uploaded
        //      mimetype:      - The mimetype of the image (e.g. 'image/jpeg',  'image/png')
        //      buffer:        - A node Buffer containing the contents of the file
        //      size:          - The size of the file in bytes
        if(typeof request.file.fieldname === 'undefined' || typeof request.file.originalname === 'undefined' || typeof request.file.mimetype === 'undefined' || typeof request.file.buffer === 'undefined'){
            response.status(400).send("Error with file");
        }
        // XXX - Do some validation here.
        // We need to create the file in the directory "images" under an unique name. We make
        // the original file name unique by adding a unique prefix with a timestamp.
        var timestamp = new Date().valueOf();
        var filename = 'U' +  String(timestamp) + request.file.originalname;

        fs.writeFile("./images/" + filename, request.file.buffer, function (err) {
            if(err){
                response.status(400).send("Error writing file");
            }
            Photo.create({
                file_name: filename,
                date_time: timestamp,
                user_id: request.session.user
            }, function (err, photoObj) {
                if (err) {
                    console.error('Error create user', err);
                } else {
                    // Set the unique ID of the object. We use the MongoDB generated _id for now
                    // but we keep it distinct from the MongoDB ID so we can go to something
                    // prettier in the future since these show up in URLs, etc.
                    photoObj.id = photoObj._id;
                    //photoObj.comments = null;
                    //request.session.user.activity = "Added Photo";
                    User.findOne({login_name: request.session.user.login_name}, function(error, user){
                        if(error){
                            console.log("Could not find user");
                        }
                       user.activity = "Added Photo";
                        user.save();
                    });
                    photoObj.save();
                    //console.log("Made a new photo object");
                    response.end(JSON.stringify(photoObj));
                    //photo.objectID = photoObj._id;
                }
                // XXX - Once you have the file written into your images directory under the name
                // filename you can create the Photo object in the database
            });
        });
    });
});

app.post('/admin/login', function(request, response) {
    console.log(request.body);
    console.log("username", request.body.login_name);
    User.findOne({login_name: request.body.login_name}, function(error, user){
        if(error){
            //console.log("No idea what's happening");
            response.status(400).send("Invalid username or password");
        }
        else{
            //console.log("User: ", user);
            if(user !== null){
                if(request.body.password !== user.password){
                    console.log("Password does not match");
                    response.status(400).send("Invalid username or password");
                }
                //console.log("Found user");
                //console.log(user);
                request.session.user = user;
                user.activity = "Logged in";
                user.save();
                //console.log("Got here, in admin login");
                response.end(JSON.stringify(user));

            }
            else{
                //console.log("No user found");
                response.status(400).send("Invalid username or password");
            }
            //need to update express session?
        }
    });
    //response.status(400).send("Invalid username or password");
});

app.post('/commentsOfPhoto/:photo_id', function(request, response){
    if(typeof request.session.user === 'undefined'){
        response.status(401).send("No user logged in");
    }
    if(request.body.text === null){
        response.status(400).send("No comment text");
    }
    console.log("In comment post");
   console.log(request.body);
    console.log("user: ", request.session.user);
    Photo.findOne({_id: request.params.photo_id}, function(error, photo){
        if(error){
            response.status(401).send("Failed to find photo");
        }
        //if photo is found, add a new comment
        photo.comments.push({
            comment: request.body.text,
            date_time: new Date(),
            user_id: request.session.user.id
        });
        photo.save();
        //console.log(photo.comments);
        User.findOne({login_name: request.session.user.login_name}, function(error, user){
            if(error){
                console.log("Could not find user");
            }
            user.activity = "Added Comment";
            user.save();
        });
        response.status(200).send("It worked");
    });
    //response.status(400).send("Not implemented yet");
});

app.get('/admin/logout', function(request, response){
    User.findOne({login_name: request.session.user.login_name}, function(error, user){
        if(error){
            console.log("Could not find user");
        }
        user.activity = "Logged Out";
        user.save();
    });
   request.session.destroy(function(err){
       if(request.session === null){
           console.log("No user logged in");
           response.status(400).send("No User Logged In");
       }
       if(err){
           console.log("Logged out");
           response.status(401).send(JSON.stringify(err));
       }
   });
});

/*
 * URL /photosOfUser/:id - Return the Photos for User (id)
 */
app.get('/photosOfUser/:id', function (request, response) {
    if(typeof request.session.user === 'undefined'){
        response.status(401).send("No user logged in");
    }
    var user = request.params.id;
    console.log("user: " , user);
    var returnObject = {};
    User.findOne({_id: request.params.id}, function(error, user){
        if(error){
            response.status(400).send("Error obtaining user!");
        }
        returnObject.user = user;
    });
    Photo.find(function(error, photos){
        returnObject.photoArray = [];
        returnObject.commentArray = [];
        photos = JSON.parse(JSON.stringify(photos));
        var calls = [];
        var length = photos.length;
        for(var i = 0; i < length; i++) { //loops through the photos
            if (photos[i].user_id === user) {
                //console.log("Found a photo");
                returnObject.photoArray.push(JSON.parse(JSON.stringify(photos[i])));
                var currSize = returnObject.photoArray.length - 1;
                var currComments = [];
                var func = function(num1, currComments){ //capture for relevant variables
                    async.each(returnObject.photoArray[currSize].comments, function (comment, callback2) {
                        //var otherComments = [];
                        calls.push(function(callback){ //this lets async.parallel function properly
                            JSON.parse(JSON.stringify(comment));
                            User.findOne({_id: comment.user_id}, function (error, user2) {
                                if (error) {
                                    response.status(404).send("Comments Error!");
                                }
                                comment.user = user2;
                                currComments.push(comment);
                                //otherComments.push(comment);
                                callback2(); //executes after the comment has been updated
                                callback();
                            });
                        });
                    }, function (error) {
                        if (error) {
                            response.status(400).send("Error in comments asynchronous");
                        }
                        //console.log("Current photo end: ", num1);
                        //console.log("Current comments: ", currComments);
                        //returnObject.photoArray[currSize].comments = currComments;
                        returnObject.photoArray[num1].comments = currComments;
                        //returnObject.photoArray[currSize].comments = otherComments;
                    });
                }(currSize, currComments)
            }
        }
        async.parallel(calls, function(err, result){
           if(err){
               console.log(err);
           }
            response.end(JSON.stringify(returnObject));
        });
    });
});


var server = app.listen(3000, function () {
    var port = server.address().port;
    console.log('Listening at http://localhost:' + port + ' exporting the directory ' + __dirname);
});


