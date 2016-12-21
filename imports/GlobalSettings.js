import { Meteor } from 'meteor/meteor'

/**
 * Wrapper to access our Global Settings.
 */
export class GlobalSettings {

    /**
     * Publish designated settings which should be
     * accessible for the client (e.g. enableEmailDelivery).
     * This method should be called on meteor server startup.
     * Caution: do not publish settings like api keys or passwords!
     */
    static publishSettings() {
        if (Meteor.settings.public === undefined) {
            Meteor.settings.public = {};
        }

        Meteor.settings.public.enableMailDelivery =
            (Meteor.settings.email && Meteor.settings.email.enableMailDelivery !== undefined)
                ? Meteor.settings.email.enableMailDelivery
                : false;

        Meteor.settings.public.branding = {};
        Meteor.settings.public.branding.topLeftLogoHTML =
            (Meteor.settings.branding && Meteor.settings.branding.topLeftLogoHTML !== undefined)
                ? Meteor.settings.branding.topLeftLogoHTML
                : "4Minitz.com";
        Meteor.settings.public.branding.showGithubCorner =
            (Meteor.settings.branding && Meteor.settings.branding.showGithubCorner !== undefined)
            ? Meteor.settings.branding.showGithubCorner
            : true;
        Meteor.settings.public.branding.showInfoOnLogin =
            (Meteor.settings.branding && Meteor.settings.branding.showInfoOnLogin !== undefined)
                ? Meteor.settings.branding.showInfoOnLogin
                : true;
        Meteor.settings.public.branding.createDemoAccount =
            (Meteor.settings.branding && Meteor.settings.branding.createDemoAccount !== undefined)
                ? Meteor.settings.branding.createDemoAccount
                : false;    // Security: if this setting is not present, we will *NOT* create a demo user account!

        Meteor.settings.public.attachments = {};
        Meteor.settings.public.attachments.enabled =
            (Meteor.settings.attachments && Meteor.settings.attachments.enabled !== undefined)
                ? Meteor.settings.attachments.enabled
                : false;
        Meteor.settings.public.attachments.allowExtensions =
            (Meteor.settings.attachments && Meteor.settings.attachments.allowExtensions !== undefined)
                ? Meteor.settings.attachments.allowExtensions
                : ".*";
        Meteor.settings.public.attachments.denyExtensions =
            (Meteor.settings.attachments && Meteor.settings.attachments.denyExtensions !== undefined)
                ? Meteor.settings.attachments.denyExtensions
                : "exe|app|bat|sh|cmd|com|cpl|exe|gad|hta|inf|jar|jpe|jse|lnk|msc|msh|msi|msp|pif|ps1|ps2|psc|reg|scf|scr|vbe|vbs|wsc|wsf|wsh";
        Meteor.settings.public.attachments.maxFileSize =
            (Meteor.settings.attachments && Meteor.settings.attachments.maxFileSize !== undefined)
                ? Meteor.settings.attachments.maxFileSize
                : 10 * 1024 * 1024; // default: 10 MB

        // enforce slash "/" at the end
        if (! Meteor.settings.attachments.storagePath.match(/\/$/)) {
            Meteor.settings.attachments.storagePath = Meteor.settings.attachments.storagePath + "/";
            console.log(Meteor.settings.attachments.storagePath);
        }
    }

    static getRootUrl(path) {
        if (Meteor.settings.ROOT_URL) {
            return Meteor.absoluteUrl(path, { rootUrl: Meteor.settings.ROOT_URL });
        }

        return Meteor.absoluteUrl(path);
    }

    static isTrustedIntranetInstallation() {
        // returns false instead of undefined
        return !!Meteor.settings.trustedIntranetInstallation;
    }

    static getDefaultLabels() {
        if (!Meteor.settings.defaultLabels) return [];

        return Meteor.settings.defaultLabels;
    }

    static getDefaultEmailSenderAddress(alternativeSender) {
        let address = (Meteor.settings.email)
            ? Meteor.settings.email.defaultEMailSenderAddress
            : undefined;

        if (address !== undefined) {
            if (address === "") {
                return (alternativeSender)
                    ? alternativeSender
                    : GlobalSettings.getFallbackEMailSenderAddress();
            } else {
                return address;
            }
        }

        throw new Meteor.Error('illegal-state', 'defaultEMailSenderAddress not defined in settings');
    }

    static getFallbackEMailSenderAddress() {
        if (Meteor.settings.email && Meteor.settings.email.fallbackEMailSenderAddress) {
            return Meteor.settings.email.fallbackEMailSenderAddress;
        }

        throw new Meteor.Error('illegal-state', 'fallback email sender address required but not defined in settings');
    }

    static isEMailDeliveryEnabled() {
        if (!Meteor.settings.public) {
            return false;
        }
        return Meteor.settings.public.enableMailDelivery;
    }

    static getMailDeliverer() {
        if (Meteor.settings.email && Meteor.settings.email.mailDeliverer) {
            return Meteor.settings.email.mailDeliverer;
        }

        return "smtp";
    }

    static getSMTPMailUrl() {
        if (Meteor.settings.email && Meteor.settings.email.smtp && Meteor.settings.email.smtp.mailUrl) {
            return Meteor.settings.email.smtp.mailUrl;
        }
        return "";
    }

    static getMailgunSettings() {
        if (Meteor.settings.email && Meteor.settings.email.mailgun) {
            return Meteor.settings.email.mailgun;
        }

        throw new Meteor.Error('illegal-state', 'mailgun settings not defined in meteor settings');
    }

    static getBrandingLogoHTML() {
        return Meteor.settings.public.branding.topLeftLogoHTML;
    }

    static showGithubCorner() {
        return Meteor.settings.public.branding.showGithubCorner;
    }

    static showInfoOnLogin() {
        return Meteor.settings.public.branding.showInfoOnLogin;
    }

    static createDemoAccount() {
        return Meteor.settings.public.branding.createDemoAccount;
    }

    static getAttachmentsEnabled() {
        return Meteor.settings.public.attachmentsEnabled;
    }
}