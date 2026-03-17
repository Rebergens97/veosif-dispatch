import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';

export default class SetupWizardContainerComponent extends Component {
    @service('workspace-setup') setup;
    @service router;

    get currentComponent() {
        const stepId = this.setup.currentStep;
        return `setup-wizard/${stepId}`;
    }

    @action
    goToStep(stepId) {
        this.setup.goToStep(stepId);
    }
}
