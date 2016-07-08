'use strict';

var cs142App = angular.module('cs142App', ['ngRoute', 'ngMaterial', 'ngResource']);

cs142App.config(['$routeProvider',
    function ($routeProvider) {
        $routeProvider.
            when('/users', {
                templateUrl: 'components/user-list/user-listTemplate.html',
                controller: 'UserListController'
            }).
            when('/search/:searchId',{
                templateUrl: 'components/user-search/user-searchTemplate.html',
                controller: 'UserSearchController'
            }).
            when('/users/:userId', {
                templateUrl: 'components/user-detail/user-detailTemplate.html',
                controller: 'UserDetailController'
            }).
            when('/photos/:userId', {
                templateUrl: 'components/user-photos/user-photosTemplate.html',
                controller: 'UserPhotosController'
            }).
            when('/login-register',{
                templateUrl: 'components/login-register/login-registerTemplate.html',
                controller: 'LoginRegisterController'
            }).
            otherwise({

                redirectTo: '/login-register'
            });
    }]);


cs142App.controller('MainController', ['$scope', '$rootScope', '$resource', '$location', '$http',
    function ($scope, $rootScope, $resource, $location, $http) {
        $scope.main = {};
        $scope.main.title = {title: 'Users'};
        $scope.main.currentState = "Introduction";
        $scope.main.search = "";
        //$scope.main.currentUser = "";
        $scope.main.currentUser = "";
        $scope.main.loggedIn = "";
        $scope.main.model = 0;
        $scope.main.version = 0;
        $scope.main.hasLoginAttempt = false;
        $scope.main.fetchModel = function(url, doneCallback){
            var request = new XMLHttpRequest();
            request.onreadystatechange = function(){
                if(request.readyState !== 4){
                    return;
                }
                if(request.status !== 200){
                    return;
                }
                doneCallback(JSON.parse(request.responseText));
            };
            request.open("GET", url);
            request.send();
        };
        $scope.main.fetchModel('/test/info', function(model){
            $scope.main.version = model.version;
            $scope.$apply();
        });

        $scope.main.searchText = function(){
          if($scope.main.search === ""){
              return null;
          }
          else{
              var search = "/search/" + $scope.main.search;
              console.log(search);
             $location.path(search);
              console.log("Changed path");

          }
        };

        $rootScope.$on( "$routeChangeStart", function(event, next, current) {
            if (!$scope.main.loggedIn) {
                console.log("Reloading this page!");
                // no logged user, redirect to /login-register unless already there
                if (next.templateUrl !== "components/login-register/login-registerTemplate.html") {
                    $location.path("/login-register");
                }
            }
        });

        $scope.main.logout = function(){
            $scope.main.hasLoginAttempt = false;
            //console.log("In logout");
            var resource = $resource('/admin/logout');
            resource.get({}, function() {
                console.log("Here for whatever reason");
            }, function errorHandling(err){
                console.log("Got an error");
            });
            $rootScope.$broadcast("Logged out");
            $scope.main.loggedIn = "";
            //$scope.$apply();
            $location.path("/login-register");
        };

        var selectedPhotoFile;   // Holds the last file selected by the user

        // Called on file selection - we simply save a reference to the file in selectedPhotoFile
        $scope.inputFileNameChanged = function (element) {
            selectedPhotoFile = element.files[0];
        };

        // Has the user selected a file?
        $scope.inputFileNameSelected = function () {
            return !!selectedPhotoFile;
        };

        // Upload the photo file selected by the user using a post request to the URL /photos/new
        $scope.uploadPhoto = function () {
            console.log("In upload Photo");
            if (!$scope.inputFileNameSelected()) {
                console.error("uploadPhoto called will no selected file");
                return;
            }
            console.log('fileSubmitted', selectedPhotoFile);

            // Create a DOM form and add the file to it under the name uploadedphoto
            var domForm = new FormData();
            domForm.append('uploadedphoto', selectedPhotoFile);

            // Using $http to POST the form
            $http.post('/photos/new', domForm, {
                transformRequest: angular.identity,
                headers: {'Content-Type': undefined}
            }).success(function(newPhoto){
                //console.log("Successfully added a new photo");
                //console.log(newPhoto);
                //console.log(newPhoto.comments);
                $rootScope.$broadcast('Added Photo');
                $rootScope.$broadcast('Updated Activity');
                // The photo was successfully uploaded. XXX - Do whatever you want on success.
            }).error(function(err){
                // Couldn't upload the photo. XXX  - Do whatever you want on failure.
                console.error('ERROR uploading photo', err);
            });

        };
    }]);
