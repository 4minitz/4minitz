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

    static getSMTPMailUrl() {
        if (Meteor.settings.smtpMailUrl) {
            return Meteor.settings.smtpMailUrl;
        }
        return "";
    }

    static getMailgunSettings() {
        if (Meteor.settings.mailgunApiKey
            && Meteor.settings.mailgunDomain
            && Meteor.settings.mailgunApiUrl
        ) {
            return {
                apiKey: Meteor.settings.mailgunApiKey,
                domain: Meteor.settings.mailgunDomain,
                apiUrl: Meteor.settings.mailgunApiUrl
            };
        }

        throw new Meteor.Error('illegal-state', 'mailgun settings not defined in meteor settings');
    }

}