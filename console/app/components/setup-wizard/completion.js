import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { task } from 'ember-concurrency';

export default class SetupWizardCompletionComponent extends Component {
    @service('workspace-setup') setup;
    @service router;
    @service notifications;

    @tracked showReview = true;
    @tracked isComplete = false;
    @tracked error = null;

    get businessDetails() {
        return this.setup.data.businessDetails || {};
    }

    get branding() {
        return this.setup.data.branding || {};
    }

    get subscription() {
        return this.setup.data.subscription || {};
    }

    get planName() {
        const plans = { starter: 'Starter', growth: 'Growth', pro: 'Pro' };
        return plans[this.subscription.planId] || this.subscription.planId || 'None selected';
    }

    get billingLabel() {
        return this.subscription.billingCycle === 'yearly' ? 'Yearly' : 'Monthly';
    }

    @action
    editStep(stepId) {
        this.setup.goToStep(stepId);
    }

    @task *completeSetup() {
        this.error = null;
        try {
            yield this.setup.finalizeSetup();
            this.showReview = false;
            this.isComplete = true;
        } catch (err) {
            this.error = 'Something went wrong. Please try again.';
        }
    }

    @action
    goToDashboard() {
        this.router.transitionTo('console');
    }

    @action
    goBack() {
        this.setup.prevStep();
    }
}
