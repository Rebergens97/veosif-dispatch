import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class SetupWizardBrandingComponent extends Component {
    @service('workspace-setup') setup;
    @service fetch;
    @service notifications;

    @tracked displayName;
    @tracked primaryColor;
    @tracked secondaryColor;
    @tracked brandInitials;
    @tracked logoUrl;
    @tracked isUploadingLogo = false;

    constructor() {
        super(...arguments);
        const br = this.setup.data.branding || {};
        const bd = this.setup.data.businessDetails || {};
        this.displayName = br.displayName || bd.companyName || '';
        this.primaryColor = br.primaryColor || '#14b8a6';
        this.secondaryColor = br.secondaryColor || '#0f172a';
        this.brandInitials = br.brandInitials || this._initials(this.displayName);
        this.logoUrl = br.logoUrl || '';
    }

    @action
    updateField(field, event) {
        const value = event?.target?.value ?? event;
        this[field] = value;

        if (field === 'displayName') {
            this.brandInitials = this._initials(this[field]);
        }

        this._syncToService();
    }

    @action
    uploadLogo(file) {
        this.isUploadingLogo = true;
        return this.fetch.uploadFile.perform(
            file,
            { path: 'uploads/companies', type: 'company_logo' },
            (uploadedFile) => {
                this.logoUrl = uploadedFile.url;
                this._syncToService();
                this.isUploadingLogo = false;
            },
            () => {
                this.isUploadingLogo = false;
                this.notifications.warning('Logo upload failed. Please try again.');
            }
        );
    }

    @action
    removeLogo() {
        this.logoUrl = '';
        this._syncToService();
    }

    @action
    updateColor(field, event) {
        this[field] = event.target.value;
        this._syncToService();
    }

    @action
    goBack() {
        this._syncToService();
        this.setup.prevStep();
    }

    @action
    skipStep() {
        this._syncToService();
        this.setup.nextStep();
    }

    @action
    continueSetup() {
        this._syncToService();
        this.setup.nextStep();
    }

    _syncToService() {
        this.setup.setStepData('branding', {
            displayName: this.displayName?.trim(),
            primaryColor: this.primaryColor,
            secondaryColor: this.secondaryColor,
            brandInitials: this.brandInitials,
            logoUrl: this.logoUrl,
        });
    }

    _initials(name) {
        if (!name) return '';
        return name
            .split(/\s+/)
            .slice(0, 2)
            .map((w) => w.charAt(0).toUpperCase())
            .join('');
    }
}
