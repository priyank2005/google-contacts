var google = require('googleapis');
var OAuth2 = google.auth.OAuth2;
var request = require('request');
var gravatar = require('gravatar');
var method = Contacts.prototype;

function Contacts(clientId, clientSecret, redirectUrl) {
    this._clientId = clientId;
    this._clientSecret = clientSecret;
    this._redirectUrl = redirectUrl;
    this._oauth2Client = new OAuth2(this._clientId, this._clientSecret, this._redirectUrl);
}

method.getOAuthURLForContacts = function() {
    var scopes = [
        'https://www.googleapis.com/auth/contacts.readonly'
    ];
    var url = this._oauth2Client.generateAuthUrl({
        access_type: 'offline', // 'online' (default) or 'offline' (gets refresh_token)
        scope: scopes // If you only need one scope you can pass it as string
    });
    return url;
}

method.setRefreshToken = function(code, callback) {
    this._refreshToken = code;
    var that = this;
    this._oauth2Client.getToken(code, function(err, tokens) {
        if (!err) {
            that._accessTokens = tokens;
            that._oauth2Client.setCredentials(tokens);
        }
        if (typeof callback === 'function')
            callback(err, tokens);
    });
}

method.getContacts = function(callback) {
    request.get({
        url: 'https://www.google.com/m8/feeds/contacts/default/full',
        qs: {
            alt: 'json',
            'max-results': 1000,
            'orderby': 'lastmodified'
        },
        headers: {
            'Authorization': 'Bearer ' + this._accessTokens.access_token,
            'GData-Version': '3.0'
        }
    }, function(err, resp, body) {
        if (err) {
            var err = {
                code: 'ErrorRequest',
                text: 'Error Occured in getting results'
            }
            callback(err, undefined);
            return;
        }
        if (resp.statusCode === 401) {
            var err = {
                code: 'TokenInvalid',
                text: 'Got Token as Invalid'
            }
            callback(err, undefined);
            return;
        }
        try {
            var feed = JSON.parse(body);
            var users = (feed.feed.entry || []).map(function(c) {
                var r = {};
                if (c['title']) {
                    r.title = c['title']['$t'];
                }
                if (c['gd$name']) {
                    if (c['gd$name']['gd$fullName'])
                        r.name = c['gd$name']['gd$fullName']['$t'];
                    if (c['gd$name']['gd$givenName'])
                        r.firstName = c['gd$name']['gd$givenName']['$t'];
                    if (c['gd$name']['gd$familyName'])
                        r.lastName = c['gd$name']['gd$familyName']['$t'];
                }
                if (c['gd$email'] && c['gd$email'].length > 0) {
                    r.email = c['gd$email'][0]['address'];
                    //r.nickname = r.email; //c['gd$email'][0]['address'].split('@')[0];
                }
                if (c['link']) {
                    var photoLink = c['link'].filter(function(link) {
                        return link.rel == 'http://schemas.google.com/contacts/2008/rel#photo' &&
                            'gd$etag' in link;
                    })[0];
                    if (photoLink) {
                        r.picture = photoLink.href;
                    } else if (r.email) {
                        r.picture = gravatar.url(r.email, {
                            s: 40
                        });
                    }
                }
                return r;
            }).filter(function(u) {
                return !!u.email && //we can only give access to persons with email at this point
                    !~u.email.indexOf('@reply.'); //adress with @reply. are usually temporary reply address for forum kind of websites.
            });
            callback(undefined, users);
        } catch (err) {
            var err = {
                code: 'Exception',
                text: 'Exception occured while processing contacts'
            }
            callback(err, undefined);
            return;
        }
    });
}

module.exports = Contacts;