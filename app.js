var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var qs = require('querystring');

var async = require('async');
var colors = require('colors');
var cors = require('cors');
var jwt = require('jwt-simple');
var moment = require('moment');
var mongoose = require('mongoose');
var request = require('request');
var FB = require('fb');
var graph = require('fbgraph');
var app = express();
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.get('*', function (req, res) {
    console.log("landing page");
    res.sendfile('./public/index.html');

});

app.post('/auth/facebook', function(req, res) {
    var fields = ['id', 'email', 'first_name', 'last_name', 'link', 'name'];
    var accessTokenUrl = 'https://graph.facebook.com/v2.5/oauth/access_token';
    var graphApiUrl = 'https://graph.facebook.com/v2.5/me?fields=' + fields.join(',');
    var params = {
        code: req.body.code,
        client_id: req.body.clientId,
        client_secret: '9b8f448a0c1399537ddd9e330b2f4c22',
        redirect_uri: req.body.redirectUri
    };

    // Step 1. Exchange authorization code for access token.
    request.get({ url: accessTokenUrl, qs: params, json: true }, function(err, response, accessToken) {
        if (response.statusCode !== 200) {
            return res.status(500).send({ message: accessToken.error.message });
        }
        else{
            console.log("token: ",accessToken);
        }

        // Step 2. Retrieve profile information about the current user.
        request.get({ url: graphApiUrl, qs: accessToken, json: true }, function(err, response, profile) {
            var userId = response.body.id;
          console.log("profile id  https://graph.facebook.com/v2.5/"+userId);
            if (response.statusCode !== 200) {
                return res.status(500).send({ message: profile.error.message });
            }
          else{
              var options = {
                  url : "https://graph.facebook.com/v2.5/"+userId+"/feed?message=YAY! Donated..",
                  qs: accessToken,
                  json: true

              };
                request.post(options, function (err,response, id) {
                    console.log("message sent ", response.body);
                    res.send(response.json);
                });
            }

        });
    });
});
app.post('/auth/twitter', function(req, res) {
    var requestTokenUrl = 'https://api.twitter.com/oauth/request_token';
    var accessTokenUrl = 'https://api.twitter.com/oauth/access_token';
    var profileUrl = 'https://api.twitter.com/1.1/account/verify_credentials.json';

    // Part 1 of 2: Initial request from Satellizer.
    if (!req.body.oauth_token || !req.body.oauth_verifier) {
        var requestTokenOauth = {
            consumer_key: 'SYfbUyo8EbH7rpviCAJextJfx',
            consumer_secret: 'KO0ZyG4C3OrdbDzngn1xJBaMqoFrkFsI7NoYqCMzkmgoMm64NX',
            callback: req.body.redirectUri
        };

        // Step 1. Obtain request token for the authorization popup.
        request.post({ url: requestTokenUrl, oauth: requestTokenOauth }, function(err, response, body) {
            var oauthToken = qs.parse(body);
                console.log("oauth token :",oauthToken);
            // Step 2. Send OAuth token back to open the authorization screen.
            res.send(oauthToken);
        });
    } else {
        // Part 2 of 2: Second request after Authorize app is clicked.
        var accessTokenOauth = {
            consumer_key: 'SYfbUyo8EbH7rpviCAJextJfx',
            consumer_secret: 'KO0ZyG4C3OrdbDzngn1xJBaMqoFrkFsI7NoYqCMzkmgoMm64NX',
            token: req.body.oauth_token,
            verifier: req.body.oauth_verifier
        };

        // Step 3. Exchange oauth token and oauth verifier for access token.
        request.post({ url: accessTokenUrl, oauth: accessTokenOauth }, function(err, response, accessToken) {

            accessToken = qs.parse(accessToken);
            console.log("twitter access token: ",accessToken);
            var profileOauth = {
                consumer_key: 'SYfbUyo8EbH7rpviCAJextJfx',
                consumer_secret: 'KO0ZyG4C3OrdbDzngn1xJBaMqoFrkFsI7NoYqCMzkmgoMm64NX',
                token: accessToken.oauth_token,
                token_secret: accessToken.oauth_token_secret,
            };

            // Step 4. Retrieve user's profile information and email address.
            request.get({
                url: profileUrl,
                qs: { include_email: true },
                oauth: profileOauth,
                json: true
            }, function(err, response, profile) {
                request.post({url: 'https://api.twitter.com/1.1/statuses/update.json?status=YAY! Donated',qs: { include_email: true },oauth: profileOauth,
                    json: true}, function (err, response, profile) {
                    console.log("tweet :", response.body);
                    res.send(response.json);
                });
                // Step 5a. Link user accounts.
               //console.log("twitter profile  :",response.body);
            });
        });
    }
});

app.listen(8080);
console.log("listening on port 8080");