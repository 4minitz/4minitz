import { Template } from 'meteor/templating';

Template.registerHelper('and', (a, b) => {
    return a && b;
});
