import Component from '@glimmer/component';
import { action } from '@ember/object';

export default class SetupWizardProgressBarComponent extends Component {
    get stepsWithStatus() {
        const { steps, currentStep, completedSteps } = this.args;
        const currentIdx = steps.findIndex((s) => s.id === currentStep);

        return steps.map((step, idx) => ({
            ...step,
            index: idx,
            isCurrent: step.id === currentStep,
            isCompleted: (completedSteps || []).includes(step.id),
            isPast: idx < currentIdx,
            isFuture: idx > currentIdx,
            isClickable: (completedSteps || []).includes(step.id) || idx < currentIdx,
        }));
    }

    get progressPercent() {
        const { steps, currentStep } = this.args;
        const idx = steps.findIndex((s) => s.id === currentStep);
        if (idx < 0) return 0;
        return Math.round((idx / (steps.length - 1)) * 100);
    }

    @action
    handleStepClick(step) {
        if (step.isClickable && this.args.onStepClick) {
            this.args.onStepClick(step.id);
        }
    }
}
