import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

const PLANS = [
    {
        id: 'starter',
        name: 'Starter',
        description: 'For small teams getting started',
        monthlyPrice: 49,
        yearlyPrice: 39,
        features: [
            { label: 'Up to 5 dispatchers', included: true },
            { label: 'Up to 15 drivers', included: true },
            { label: 'Up to 15 vehicles', included: true },
            { label: 'Mobile app access', included: true },
            { label: 'Basic analytics', included: true },
            { label: 'API access', included: false },
            { label: 'Priority support', included: false },
        ],
        recommended: false,
    },
    {
        id: 'growth',
        name: 'Growth',
        description: 'For growing operations',
        monthlyPrice: 99,
        yearlyPrice: 79,
        features: [
            { label: 'Up to 15 dispatchers', included: true },
            { label: 'Up to 50 drivers', included: true },
            { label: 'Up to 50 vehicles', included: true },
            { label: 'Mobile app access', included: true },
            { label: 'Advanced analytics', included: true },
            { label: 'API access', included: true },
            { label: 'Priority support', included: false },
        ],
        recommended: true,
    },
    {
        id: 'pro',
        name: 'Pro',
        description: 'For professional fleets',
        monthlyPrice: 199,
        yearlyPrice: 159,
        features: [
            { label: 'Unlimited dispatchers', included: true },
            { label: 'Unlimited drivers', included: true },
            { label: 'Unlimited vehicles', included: true },
            { label: 'Mobile app access', included: true },
            { label: 'Full analytics suite', included: true },
            { label: 'Full API access', included: true },
            { label: 'Priority support', included: true },
        ],
        recommended: false,
    },
];

export default class SetupWizardPlanSelectionComponent extends Component {
    @service('workspace-setup') setup;
    @service notifications;

    plans = PLANS;

    @tracked selectedPlan;
    @tracked billingCycle;
    @tracked isTrial;

    constructor() {
        super(...arguments);
        const sub = this.setup.data.subscription || {};
        this.selectedPlan = sub.planId || '';
        this.billingCycle = sub.billingCycle || 'monthly';
        this.isTrial = sub.isTrial ?? false;
    }

    get isMonthly() {
        return this.billingCycle === 'monthly';
    }

    @action
    toggleBillingCycle() {
        this.billingCycle = this.isMonthly ? 'yearly' : 'monthly';
        this._syncToService();
    }

    @action
    selectPlan(planId) {
        this.selectedPlan = planId;
        this._syncToService();
    }

    @action
    toggleTrial() {
        this.isTrial = !this.isTrial;
        this._syncToService();
    }

    @action
    goBack() {
        this._syncToService();
        this.setup.prevStep();
    }

    @action
    continueSetup() {
        if (!this.selectedPlan) {
            this.notifications.warning('Please select a plan to continue.');
            return;
        }

        this._syncToService();
        this.setup.nextStep();
    }

    _syncToService() {
        this.setup.setStepData('subscription', {
            planId: this.selectedPlan,
            billingCycle: this.billingCycle,
            isTrial: this.isTrial,
        });
    }
}
