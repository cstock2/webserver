'use strict';


cs142App.controller('UserListController', ['$scope', '$rootScope',
    function ($scope, $rootScope) {
        $scope.main.title = 'Users';
        $scope.main.fetchModel('/user/list', function(model){
            $scope.users = model;
            $scope.$apply();
        });
        $scope.displayUser = function(id){
        };
        $scope.$on('Logged in', function(){
            //console.log("Someone logged in");
            $scope.main.fetchModel('/user/list', function(model){
                $scope.users = model;
                $scope.$apply();
            });
        });
        $rootScope.$on('Updated Activity', function(){
            $scope.main.fetchModel('/user/list', function(model){
                $scope.users = model;
                $scope.$apply();
            });
        });
        $rootScope.$on('Logged out', function(){
            $scope.users = null;
            //$scope.$apply();
        })
    }]);

