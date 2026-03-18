import Service, { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { A } from '@ember/array';

const STORAGE_KEY = 'veosif_workspace_setup_data';

const STEPS = [
    { id: 'welcome', label: 'Welcome', required: true, skippable: false },
    { id: 'business-details', label: 'Business Details', required: true, skippable: false },
    { id: 'branding', label: 'Branding', required: false, skippable: true },
    { id: 'plan-selection', label: 'Plan', required: true, skippable: false },
    { id: 'completion', label: 'Complete', required: false, skippable: false },
];

function defaultData() {
    return {
        setupMode: 'scratch',
        businessDetails: {
            companyName: '',
            businessType: '',
            businessEmail: '',
            businessPhone: '',
            country: '',
            language: 'en',
            timezone: '',
        },
        branding: {
            displayName: '',
            logoUrl: '',
            primaryColor: '#14b8a6',
            secondaryColor: '#0f172a',
            brandInitials: '',
        },
        subscription: {
            planId: '',
            billingCycle: 'monthly',
            isTrial: false,
        },
    };
}

export default class WorkspaceSetupService extends Service {
    @service store;
    @service fetch;
    @service notifications;
    @service router;
    @service currentUser;

    @tracked currentStep = 'welcome';
    @tracked completedSteps = A([]);
    @tracked data = defaultData();
    @tracked isLoading = false;
    @tracked isSaving = false;
    @tracked isFinalized = false;
    @tracked shouldShow = false;

    get steps() {
        return STEPS;
    }

    get currentStepDef() {
        return STEPS.find((s) => s.id === this.currentStep);
    }

    get currentStepIndex() {
        return STEPS.findIndex((s) => s.id === this.currentStep);
    }

    get totalSteps() {
        return STEPS.length;
    }

    get progress() {
        const idx = this.currentStepIndex;
        if (idx < 0) return 0;
        return Math.round(((idx + 1) / STEPS.length) * 100);
    }

    get canGoBack() {
        return this.currentStepIndex > 0 && this.currentStep !== 'completion';
    }

    get canGoNext() {
        return this.currentStepIndex < STEPS.length - 1;
    }

    get isComplete() {
        return this.currentStep === 'completion';
    }

    getStepData(stepKey) {
        return this.data[stepKey] ?? {};
    }

    setStepData(stepKey, payload) {
        this.data = { ...this.data, [stepKey]: payload };
        this.saveProgress();
    }

    setField(stepKey, field, value) {
        const stepData = { ...(this.data[stepKey] || {}) };
        stepData[field] = value;
        this.data = { ...this.data, [stepKey]: stepData };
        this.saveProgress();
    }

    markStepComplete(stepId) {
        if (!this.completedSteps.includes(stepId)) {
            this.completedSteps = A([...this.completedSteps, stepId]);
        }
        this.saveProgress();
    }

    isStepComplete(stepId) {
        return this.completedSteps.includes(stepId);
    }

    goToStep(stepId) {
        const exists = STEPS.find((s) => s.id === stepId);
        if (exists) {
            this.currentStep = stepId;
            this.saveProgress();
        }
    }

    nextStep() {
        const idx = this.currentStepIndex;
        if (idx < STEPS.length - 1) {
            this.markStepComplete(STEPS[idx].id);
            this.currentStep = STEPS[idx + 1].id;
            this.saveProgress();
        }
    }

    prevStep() {
        const idx = this.currentStepIndex;
        if (idx > 0) {
            this.currentStep = STEPS[idx - 1].id;
            this.saveProgress();
        }
    }

    saveProgress() {
        try {
            const state = {
                currentStep: this.currentStep,
                completedSteps: [...this.completedSteps],
                data: this.data,
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
            // localStorage full or unavailable
        }
    }

    loadProgress() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return false;

            const state = JSON.parse(raw);
            if (state.currentStep) this.currentStep = state.currentStep;
            if (state.completedSteps) this.completedSteps = A(state.completedSteps);
            if (state.data) this.data = { ...defaultData(), ...state.data };
            return true;
        } catch (e) {
            return false;
        }
    }

    resetProgress() {
        this.currentStep = 'welcome';
        this.completedSteps = A([]);
        this.data = defaultData();
        this.isFinalized = false;
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (e) {
            // ignore
        }
    }

    prefillFromUser() {
        const user = this.currentUser?.user;
        if (!user) return;

        const bd = { ...this.data.businessDetails };
        if (!bd.companyName && user.company_name) bd.companyName = user.company_name;
        if (!bd.businessEmail && user.email) bd.businessEmail = user.email;
        if (!bd.businessPhone && user.phone) bd.businessPhone = user.phone;
        if (!bd.timezone) bd.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
        this.data = { ...this.data, businessDetails: bd };

        if (!this.data.branding.displayName && bd.companyName) {
            this.data = {
                ...this.data,
                branding: { ...this.data.branding, displayName: bd.companyName, brandInitials: this._initials(bd.companyName) },
            };
        }
    }

    validateStep(stepId) {
        const errors = [];

        if (stepId === 'business-details') {
            const bd = this.data.businessDetails || {};
            if (!bd.companyName?.trim()) errors.push('Company name is required');
            if (!bd.businessType) errors.push('Business type is required');
            if (!bd.businessEmail?.trim()) errors.push('Business email is required');
            if (bd.businessEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bd.businessEmail)) errors.push('Email format is invalid');
            if (!bd.businessPhone?.trim()) errors.push('Phone number is required');
            if (!bd.country?.trim()) errors.push('Country is required');
        }

        if (stepId === 'plan-selection') {
            const sub = this.data.subscription || {};
            if (!sub.planId) errors.push('Please select a plan');
        }

        return errors;
    }

    async finalizeSetup() {
        if (this.isFinalized || this.isSaving) return;

        this.isSaving = true;
        try {
            const user = this.currentUser?.user;
            const company = this.currentUser?.company;

            if (company) {
                const bd = this.data.businessDetails || {};
                const br = this.data.branding || {};
                const sub = this.data.subscription || {};

                company.set('name', bd.companyName || company.name);
                company.set('phone', bd.businessPhone || company.phone);
                company.set('country', bd.country || company.country);
                company.set('timezone', bd.timezone || company.timezone);
                company.set('type', bd.businessType || company.type);
                company.set('currency', this._currencyForCountry(bd.country));

                const opts = company.options || {};
                opts.setupMode = this.data.setupMode;
                opts.branding = {
                    displayName: br.displayName,
                    primaryColor: br.primaryColor,
                    secondaryColor: br.secondaryColor,
                    brandInitials: br.brandInitials,
                    logoUrl: br.logoUrl,
                };
                opts.subscription = {
                    planId: sub.planId,
                    billingCycle: sub.billingCycle,
                    isTrial: sub.isTrial,
                };
                opts.language = bd.language;
                company.set('options', { ...opts });
                company.set('onboarding_completed', true);

                await company.save();
            }

            this.isFinalized = true;
            this.shouldShow = false;
            localStorage.setItem('veosif_setup_completed', '1');
            this.resetProgress();
            this.notifications.success('Your workspace is ready!');
        } catch (error) {
            this.notifications.serverError(error, 'Setup failed. Please try again.');
            throw error;
        } finally {
            this.isSaving = false;
        }
    }

    _initials(name) {
        if (!name) return '';
        return name
            .split(/\s+/)
            .slice(0, 2)
            .map((w) => w.charAt(0).toUpperCase())
            .join('');
    }

    _currencyForCountry(country) {
        const map = { US: 'USD', CA: 'CAD', GB: 'GBP', FR: 'EUR', HT: 'HTG', MX: 'MXN', BR: 'BRL', DO: 'DOP' };
        return map[country] || 'USD';
    }
}
