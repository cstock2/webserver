'use strict';

cs142App.controller('UserDetailController', ['$scope', '$routeParams', '$rootScope',
  function ($scope, $routeParams, $rootScope) {
    /*
     * Since the route is specified as '/users/:userId' in $routeProvider config the
     * $routeParams  should have the userId property set with the path from the URL.
     */
    $scope.userId = $routeParams.userId;
    $scope.url = '/user/' + $scope.userId;
    $scope.user = {};
    $scope.url2 = '/photosOfUser/' + $scope.userId;
    $scope.photoArray = {};
    $scope.mostRecent = {};
    $scope.mostCommented = {};
    $scope.commentText = "Comments";
    $scope.main.fetchModel($scope.url, function(model){
      $scope.user = model;
      $scope.main.currentState = $scope.user.first_name + " " + $scope.user.last_name + "'s Page";
      $scope.main.currentUser = $scope.user.first_name + " " + $scope.user.last_name;
      $scope.$apply();
    });
    $scope.main.fetchModel($scope.url2, function(model){
      $scope.photoArray = model.photoArray;
      var photoSize = model.photoArray.length;
      for(var i = 0; i < photoSize; i++){
        if(typeof $scope.mostRecent.file_name === 'undefined'){
          $scope.mostRecent = model.photoArray[i];
        }
        else if($scope.mostRecent.date_time < model.photoArray[i].date_time){
          $scope.mostRecent = model.photoArray[i];
        }
        if(typeof $scope.mostCommented.file_name === 'undefined'){
          $scope.mostCommented = model.photoArray[i];
        }
        else if(model.photoArray[i].comments.length > $scope.mostCommented.comments.length){
          $scope.mostCommented = model.photoArray[i];
        }
      }
      if(typeof $scope.mostCommented.comments !== 'undefined' && $scope.mostCommented.comments.length === 1){
        $scope.commentText = "Comment";
      }
      $scope.$apply();
    });
    $rootScope.$on('Updated Activity', function(){
      $scope.main.fetchModel($scope.url2, function(model){
        $scope.photoArray = model.photoArray;
        var photoSize = model.photoArray.length;
        for(var i = 0; i < photoSize; i++){
          if(typeof $scope.mostRecent.file_name === 'undefined'){
            $scope.mostRecent = model.photoArray[i];
          }
          else if($scope.mostRecent.date_time < model.photoArray[i].date_time){
            $scope.mostrecent = model.photoArray[i];
          }
          if(typeof $scope.mostCommented.file_name === 'undefined'){
            $scope.mostCommented = model.photoArray[i];
          }
          else if(model.photoArray[i].comments.length > $scope.mostCommented.comments.length){
            $scope.mostCommented = model.photoArray[i];
          }
        }
        if($scope.mostCommented.comments.length === 1){
          $scope.commentText = "Comment";
        }
        $scope.$apply();
      });
    });
  }]);
