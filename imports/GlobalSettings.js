export class GlobalSettings {

    static getDefaultEmailSenderAddress() {
        if (Meteor.settings.defaultEMailSenderAddress) {
            return Meteor.settings.defaultEMailSenderAddress;
        }

        throw new Meteor.Error('illegal-state', 'defaultEMailSenderAddress not defined in settings');
    }

    static isEMailDeliveryEnabled() {
        return Meteor.settings.enableMailDelivery;
    }

    static getMailDeliverer() {
        if (Meteor.settings.mailDeliverer) {
            return Meteor.settings.mailDeliverer;
        }

        return "smtp";
    }

    static getMailgunSettings() {
        if (Meteor.Settings.mailgunApiKey
            && Meteor.Settings.mailgunDomain
            && Meteor.Settings.mailgunApiUrl
        ) {
            return {
                apiKey: Meteor.Settings.mailgunApiKey,
                domain: Meteor.Settings.mailgunDomain,
                apiUrl: Meteor.Settings.mailgunApiUrl
            };
        }

        throw new Meteor.Error('illegal-state', 'mailgun settings not defined in meteor settings');
    }

}