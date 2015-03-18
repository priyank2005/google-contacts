# Google Contacts NodeJS Library
Its a simple NodeJS library to get contacts from Google.

## Usage

    var contactsObjFile = require('../../includes/googleContacts.js');
    var contactsObj = new contactsObjFile(<clientId>,<clientSecret>, <redirectUrl>);
    
If you do not have oAuth2 token for the user, you need to start with:
    
    var url = contactsObj.getOAuthURLForContacts();
    res.redirect(url);

This will take to Google OAuth2 screen and after successful login user is redirected to redirect URL with code. In Redirected Page code:
    
    var code = req.param('code');
        contactsObj.setRefreshToken(code, function(err, data) {
                if (err) {
                    console.log('Error occured while getting tokens from bearer token, Error: ' + err);
                    //HANDLE ERROR HERE
                    return;
                } else {
                    contactsObj.getContacts(function(err, data) {
                        if (err) {
                           console.log('Error Occured while getting data from Google: ' + data);
                            //HANDLE ERROR HERE
                            return;
                        } else {
                            //You got contacts in data
                            res.json(data);
                        }
                    })
                }
            });

Sample output:

    [
     {
        "title": "TITLE",
        "name": "FULL NAME",
        "firstName": "FIRST NAME",
        "lastName": "LAST NAME",
        "email": "EMAIL",
        "picture": "Google Image URL if present, else gavatar URL"
    },
    .....
    ]