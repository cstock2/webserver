'use strict';

cs142App.controller('UserPhotosController', ['$scope', '$routeParams', '$resource', '$rootScope',
  function($scope, $routeParams, $resource, $rootScope) {
    /*
     * Since the route is specified as '/photos/:userId' in $routeProvider config the
     * $routeParams  should have the userId property set with the path from the URL.
     */
    //$scope.hasPhotos = true;
    var userId = $routeParams.userId;
    $scope.user = {};
    $scope.comment = {};
    $scope.url = '/photosOfUser/' + userId;
    $scope.photoArray = {};
    $scope.photos = {};
    $scope.photos.commentText = "";
    $scope.photos.comments = [];

    $scope.compare = function(x, y){
      return y.likes.length - x.likes.length;
    };
    $scope.main.fetchModel($scope.url, function(model){
      $scope.photoArray = model.photoArray;
      $scope.user = model.user;
      $scope.main.currentState = $scope.user.first_name + " " + $scope.user.last_name + "'s Photos";
      $scope.photoArray.sort($scope.compare);
      $scope.$apply();
    });

    $scope.like = function(photo_id, user_id){
      //console.log("Adding a like!");
      var likeManager = {};
      likeManager.user_id = user_id;
      var route = '/toggleLike/' + photo_id;
      var resource = $resource(route);
      var user = resource.save(likeManager, function(returnObject, err){
        $rootScope.$broadcast('Added Comment'); //although we didn't add a comment, this does the same thing for updating
      });
    };

    $scope.hasPhotos = function(){
      //console.log($scope.photoArray.length);
      if($scope.photoArray.length !== 0){
        return true;
      }
      return false;
    };
    $scope.submitComment = function(text, id){
      //console.log("text: ", text, " id ", id);
      var stringer = '/commentsOfPhoto/' + id;
      //console.log('/commentsOfPhoto/' + id);
      var resource = $resource(stringer);
      //console.log("Got here!");
      $scope.comment.text = text;
      var user = resource.save($scope.comment, function(returnObject, err){
        //console.log(returnObject);
        $rootScope.$broadcast('Added Comment');
      });
    };
    $scope.$on('Added Comment', function(){
      //console.log("Success!");
      $scope.main.fetchModel($scope.url, function(model){
        $scope.photoArray = model.photoArray;
        $scope.photoArray.sort($scope.compare);
        $scope.user = model.user;
        $rootScope.$broadcast('Updated Activity');
        //$scope.main.currentState = $scope.user.first_name + " " + $scope.user.last_name + "'s Photos";
        $scope.$apply();
      });
    });
    $scope.$on('Added Photo', function(){
      console.log("Added a photo succesfully");
      $scope.main.fetchModel($scope.url, function(model){
        $scope.photoArray = model.photoArray;
        $scope.photoArray.sort($scope.compare);
        $scope.$apply();
      });
    });
  }]);
