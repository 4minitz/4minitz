AccountsTemplates.removeField('password');
AccountsTemplates.removeField('email');

AccountsTemplates.addFields([
  {
      _id: "username",
      type: "text",
      displayName: "User name",
      required: true,
      minLength: 3,
  },

  {
      _id: 'email',
      type: 'email',
      required: true,
      displayName: "Email",
      re: /.+@(.+){2,}\.(.+){2,}/,
      errStr: 'Invalid email',
  },

  {
      _id: 'password',
      type: 'password',
      placeholder: {
          signUp: "At least six characters"
      },
      required: true,
      minLength: 6,
      re: /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/,
      errStr: 'At least 1 digit, 1 lowercase and 1 uppercase',
  },

]);
