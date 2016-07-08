'use strict';


cs142App.controller('UserSearchController', ['$scope', '$routeParams',
    function ($scope, $routeParams) {
        var searchId = $routeParams.searchId;
        $scope.main.title = 'Search';
        $scope.search = {};
        $scope.search.searchId = searchId;
        $scope.photoArray = {};
        $scope.search.url = '/search/' + searchId;
        $scope.main.fetchModel($scope.search.url, function(model){
            $scope.photoArray = model.photoArray;
            $scope.main.currentState = "Search results for " + searchId;
            $scope.$apply();
        });
        /*$scope.main.fetchModel('/user/list', function(model){
            $scope.users = model;
            $scope.$apply();
        });
        $scope.$on('Logged in', function(){
            console.log("Someone logged in");
            $scope.main.fetchModel('/user/list', function(model){
                $scope.users = model;
                $scope.$apply();
            });
        });*/
    }]);
