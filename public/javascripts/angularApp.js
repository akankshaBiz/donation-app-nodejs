var app = angular.module('donationApp', ['ui.bootstrap', 'satellizer', 'angular-oauth2']);

app.config(function($authProvider) {

    $authProvider.facebook({
      clientId: '1860156334262951'
    });
  $authProvider.facebook({
  name: 'facebook',
  url: '/auth/facebook',
  authorizationEndpoint: 'https://www.facebook.com/v2.5/dialog/oauth',
  redirectUri: window.location.origin+''+window.location.pathname,
  requiredUrlParams: ['display', 'scope'],
  scope: ['email', 'publish_actions'],
  scopeDelimiter: ',',
  display: 'popup',
  oauthType: '2.0',
  popupOptions: { width: 580, height: 400 }
});
$authProvider.twitter({
  url: '/auth/twitter',
  authorizationEndpoint: 'https://api.twitter.com/oauth/authenticate',
  redirectUri: window.location.origin+''+window.location.pathname,
  oauthType: '1.0',
  popupOptions: { width: 495, height: 645 }
});

  });
app.controller('homeCtrl', ['$scope','$auth', 'OAuth', '$window', '$q', function($scope, $auth, OAuth, $window, $q) {
  $scope.donation = {};
  $scope.donation.max = 1000;
  $scope.donation.totalDonation = 5;
  $scope.donation.amount = 5;
  $scope.donation.members = 0;
  $scope.donation.save = false;
  console.log('auth object : ',$auth);
  console.log('path----- ', $window.location.origin);
  $scope.acceptDonation = function() {
    if($scope.donation.totalDonation <= 1000){

        $scope.donation.totalDonation += parseInt($scope.donation.amount, 10);
        $scope.donation.members++;
    }
    else{
      alert("we reached 1000$ :)... thanks for your support");
    }
  };
  $scope.authenticateFb = function () {
      var deferred = $q.defer();
      $auth.authenticate('facebook').then(function(response) {
          console.log('response facebook', response);
          //swal("Nice!", "message posted!", "success");
          deferred.resolve();
      })
          .catch(function(response) {
              console.log('error ', response);
              deferred.resolve('error');
          });
      return deferred.promise;
  };
  $scope.authenticateTwitter = function () {
      var deferred = $q.defer();
      $auth.authenticate('twitter').then(function(response) {
          console.log('response twitter', response);
          swal("Nice!", "message posted !", "success");
          deferred.resolve();
      })
          .catch(function(response) {
              console.log('error ', response);
              deferred.resolve('error');
          });
      return deferred.promise;
  };
  $scope.tellFrndz = function () {
      $scope.authenticateFb().then(function (response) {
          console.log('location is: ', $window.location);
          // $window.close();
          $scope.authenticateTwitter().then(function (response) {
              console.log('done!');
          })
      });
  };
  $scope.saveForLater = function(){
    swal("message Saved!");
  }
}])