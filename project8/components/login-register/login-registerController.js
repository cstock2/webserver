'use strict';

cs142App.controller('LoginRegisterController', ['$scope', '$routeParams', '$resource', '$http', '$rootScope',
    function ($scope, $routeParams, $resource, $http, $rootScope) {

        //$scope.main.title = {title ||"Login"};
        $scope.login = {};
        $scope.newuser = {};
        $scope.login.login_name = "";
        $scope.login.password = "";
        $scope.username = "";
        $scope.login.falser = "Invalid username or password";
        $scope.login.hasClicked = false;
        $scope.newuser.login_name = "";
        $scope.newuser.first_name = "";
        $scope.newuser.last_name = "";
        $scope.newuser.location = "";
        $scope.newuser.occupation = "";
        $scope.newuser.description = "";
        $scope.newuser.password = "";
        $scope.login.failedRegister = false;
        $scope.main.currentState = "Login";
        //console.log($scope.username);
        //$scope.login = {};
        $scope.isCurrentUser = function(){
          if($scope.main.loggedIn === ""){
              return false;
          }
            return true;
        };

        $scope.failedToRegister = function(){
            //console.log($scope.login.failedRegister);
            return $scope.login.failedRegister;
        };


        $scope.submit = function(){
            $scope.main.hasLoginAttempt = true;
            //console.log($scope.login.login_name);
          //$scope.main.currentUser = $scope.login.username;
            var resource = $resource('/admin/login');
            var user = resource.save($scope.login, function(returnObject, err){
                /*if(err){
                    console.log("Error logging in");
                }*/
                //console.log(returnObject);
                if(returnObject !== null){
                    $scope.main.loggedIn = returnObject.first_name;
                    $scope.login.falser = "";
                    $rootScope.$broadcast('Logged in');
                }
                else{
                    //console.log("No user");
                    $scope.login.falser = "Incorrect username or password";
                }

                //console.log("Success!");
                //console.log(returnObject);
                //$scope.main.currentUser = $scope.login.username;
            });
            //username
        };

        $scope.register = function(){
          console.log("Registering a user");
            if($scope.newuser.login_name === "" || $scope.newuser.first_name === "" || $scope.newuser.last_name === "" || $scope.newuser.location === "" || $scope.newuser.occupation === "" || $scope.newuser.description === "" || $scope.newuser.password === ""){
                //console.log("Failed to register a user");
                $scope.login.failedRegister = true;
                return;
            }
            //console.log($scope.newuser);
            var resource = $resource('/user');
            var uselessvar = resource.save($scope.newuser, function(returnObject, err){
                //console.log(returnObject);
                //console.log(err);
                if(returnObject !== null){
                    $scope.main.loggedIn = returnObject.login_name;
                    $scope.login.falser = "";
                    $rootScope.$broadcast('Logged in');
                }
                else{
                    //console.log("No user");
                    $scope.login.falser = "Incorrect username or password";
                }
               /*if(err){
                   console.log("Error registering a user");
               }*/

            });
        };
        /*
         * Since the route is specified as '/users/:userId' in $routeProvider config the
         * $routeParams  should have the userId property set with the path from the URL.
         */

    }]);