import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class SetupWizardWelcomeComponent extends Component {
    @service('workspace-setup') setup;

    @tracked selectedMode = this.setup.data.setupMode || 'scratch';

    @action
    selectMode(mode) {
        this.selectedMode = mode;
        this.setup.setStepData('setupMode', mode);
    }

    @action
    continueSetup() {
        this.setup.setStepData('setupMode', this.selectedMode);
        this.setup.nextStep();
    }
}
