if (Meteor.isServer) {
    
  /*// Hack to prevent keepalive error in older versions of meteor
  process.argv = _.without(process.argv, '--keepalive');
  Meteor.startup(function () { console.log("LISTENING"); });*/
  
  // An example of how you can add fields when creating a user
  /*Accounts.onCreateUser(function(options, user) {
    user.fieldFromOnCreateUser = true;
    return user;
  });*/
  
  /*// An example of how you can receive data from the client when making a login request
  //   See below (Meteor.isClient) for the other half of the picture
  LDAP.generateSettings = function (request) {
    console.log('organization_id:', request.data.organization_id);
    return {
      "serverDn": "DC=ad,DC=university,DC=edu",
      "serverUrl": "ldap://ad.university.edu:2222",
      "whiteListedFields": [ "displayName", "givenName", "department", "employeeNumber", "mail", "title", "address", "phone", "memberOf"],
      "autopublishFields": [ "displayName", "department", "mail", "title", "address", "phone"]
    };
  }*/
  
}

/*if (Meteor.isClient) {
  // An example of how you can pass data to the server via request.data
  LDAP.data = function () {
    return {organization_id: Session.get('organization_id') || 0};  
  }
}*/