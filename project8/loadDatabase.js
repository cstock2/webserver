"use strict";

/* jshint node: true */
/* global Promise */

/*
 * This Node.js program loads the CS142 Project #5 model data into Mongoose defined objects
 * in a MongoDB database. It can be run with the command:
 *     node loadDatabase.js
 * be sure to have an instance of the MongoDB running on the localhost.
 *
 * This script loads the data into the MongoDB database named 'cs142project6'.  In loads
 * into collections named User and Photos. The Comments are added in the Photos of the
 * comments. Any previous objects in those collections is discarded.
 *
 * NOTE: This scripts uses Promise abstraction for handling the async calls to
 * the database. We are not teaching Promises in CS142 so strongly suggest you don't
 * use them in your solution.
 *
 */

// Get the magic models we used in the previous projects.
var cs142models = require('./modelData/photoApp.js').cs142models;

// We use the Mongoose to define the schema stored in MongoDB.
var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/cs142project6');

// Load the Mongoose schema for Use and Photo
var User = require('./schema/user.js');
var Photo = require('./schema/photo.js');
var SchemaInfo = require('./schema/schemaInfo.js');

var versionString = '1.0';

// We start by removing anything that existing in the collections.
var removePromises = [User.remove({}), Photo.remove({}), SchemaInfo.remove({})];

Promise.all(removePromises).then(function () {

    // Load the users into the User. Mongo assigns ids to objects so we record
    // the assigned '_id' back into the cs142model.userListModels so we have it
    // later in the script.

    var userModels = cs142models.userListModel();
    var userIDs = []; // Collect the fake IDs of the user we load
    var userPromises = userModels.map(function (user) {
        userIDs.push(user.id);
        return User.create({
            first_name: user.first_name,
            last_name: user.last_name,
            location: user.location,
            description: user.description,
            occupation: user.occupation,
            login_name: user.last_name.toLowerCase(),
            activity: "Registered",
            password: 'weak'
        }, function (err, userObj) {
            if (err) {
                console.error('Error create user', err);
            } else {
                // Set the unique ID of the object. We use the MongoDB generated _id for now
                // but we keep it distinct from the MongoDB ID so we can go to something
                // prettier in the future since these show up in URLs, etc.
                userObj.id = userObj._id;
                userObj.save();

                user.objectID = userObj._id;
                console.log('Adding user:', user.first_name + ' ' + user.last_name, ' with ID ',
                    user.objectID);
            }
        });
    });


    var allPromises = Promise.all(userPromises).then(function () {
        // Once we've loaded all the users into the User collection we add all the photos. Note
        // that the user_id of the photo is the MongoDB assigned id in the User object.
        var photoModels = [];
        for (var i = 0; i < userIDs.length; i++) {
            photoModels = photoModels.concat(cs142models.photoOfUserModel(userIDs[i]));
        }
        var photoPromises = photoModels.map(function (photo) {
            return Photo.create({
                file_name: photo.file_name,
                date_time: photo.date_time,
                user_id: photo.user.objectID,
                likes: []
            }, function (err, photoObj) {
                if (err) {
                    console.error('Error create user', err);
                } else {
                    // Set the unique ID of the object. We use the MongoDB generated _id for now
                    // but we keep it distinct from the MongoDB ID so we can go to something
                    // prettier in the future since these show up in URLs, etc.
                    photoObj.id = photoObj._id;
                    photoObj.save();

                    photo.objectID = photoObj._id;
                    if (photo.comments) {
                        photo.comments.forEach(function (comment) {
                            photoObj.comments.push({
                                comment: comment.comment,
                                date_time: comment.date_time,
                                user_id: comment.user.objectID
                            });
                            console.log("Adding comment of length %d by user %s to photo %s",
                                comment.comment.length,
                                comment.user.objectID,
                                photo.file_name);
                        });
                    }
                    console.log('Adding photo:', photo.file_name, ' of user ID ', photo.user.objectID);
                }
            });
        });
        return Promise.all(photoPromises).then(function () {
            // Create the SchemaInfo object
            return SchemaInfo.create({
                version: versionString
            }, function (err, schemaInfo) {
                if (err) {
                    console.error('Error create schemaInfo', err);
                } else {
                    console.log('SchemaInfo object created with version ', versionString);
                }
            });
        });
    });

    allPromises.then(function () {
        mongoose.disconnect();
    });
});
