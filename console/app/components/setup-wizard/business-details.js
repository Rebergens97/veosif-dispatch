import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

const BUSINESS_TYPES = [
    { value: 'dispatch_company', label: 'Dispatch Company' },
    { value: 'courier_delivery', label: 'Courier / Delivery' },
    { value: 'trucking', label: 'Trucking' },
    { value: 'medical_transport', label: 'Medical Transportation' },
    { value: 'taxi_ride_service', label: 'Taxi / Ride Service' },
    { value: 'mixed_operations', label: 'Mixed Operations' },
    { value: 'other', label: 'Other' },
];

const LANGUAGES = [
    { value: 'en', label: 'English' },
    { value: 'fr', label: 'Français' },
    { value: 'es', label: 'Español' },
    { value: 'pt', label: 'Português' },
    { value: 'ht', label: 'Kreyòl Ayisyen' },
];

const COUNTRIES = [
    { value: 'US', label: 'United States' },
    { value: 'CA', label: 'Canada' },
    { value: 'HT', label: 'Haiti' },
    { value: 'DO', label: 'Dominican Republic' },
    { value: 'FR', label: 'France' },
    { value: 'GB', label: 'United Kingdom' },
    { value: 'MX', label: 'Mexico' },
    { value: 'BR', label: 'Brazil' },
    { value: 'JM', label: 'Jamaica' },
    { value: 'TT', label: 'Trinidad & Tobago' },
    { value: 'BS', label: 'Bahamas' },
    { value: 'PR', label: 'Puerto Rico' },
];

export default class SetupWizardBusinessDetailsComponent extends Component {
    @service('workspace-setup') setup;
    @service notifications;

    businessTypes = BUSINESS_TYPES;
    languages = LANGUAGES;
    countries = COUNTRIES;

    @tracked companyName;
    @tracked businessType;
    @tracked businessEmail;
    @tracked businessPhone;
    @tracked country;
    @tracked language;
    @tracked timezone;
    @tracked errors = [];

    constructor() {
        super(...arguments);
        const bd = this.setup.data.businessDetails || {};
        this.companyName = bd.companyName || '';
        this.businessType = bd.businessType || '';
        this.businessEmail = bd.businessEmail || '';
        this.businessPhone = bd.businessPhone || '';
        this.country = bd.country || '';
        this.language = bd.language || 'en';
        this.timezone = bd.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    }

    get filled() {
        return this.companyName?.trim() && this.businessType && this.businessEmail?.trim() && this.businessPhone?.trim() && this.country;
    }

    @action
    updateField(field, event) {
        const value = event?.target?.value ?? event;
        this[field] = value;
        this._syncToService();
    }

    @action
    selectBusinessType(type) {
        this.businessType = type;
        this._syncToService();
    }

    @action
    selectCountry(country) {
        this.country = country;
        this._syncToService();
    }

    @action
    selectLanguage(lang) {
        this.language = lang;
        this._syncToService();
    }

    @action
    goBack() {
        this._syncToService();
        this.setup.prevStep();
    }

    @action
    continueSetup() {
        this._syncToService();

        const errors = this.setup.validateStep('business-details');
        if (errors.length > 0) {
            this.errors = errors;
            this.notifications.warning(errors[0]);
            return;
        }

        this.errors = [];
        this.setup.nextStep();
    }

    _syncToService() {
        this.setup.setStepData('businessDetails', {
            companyName: this.companyName?.trim(),
            businessType: this.businessType,
            businessEmail: this.businessEmail?.trim(),
            businessPhone: this.businessPhone?.trim(),
            country: this.country,
            language: this.language,
            timezone: this.timezone,
        });
    }
}
