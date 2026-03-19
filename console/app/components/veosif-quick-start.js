import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';

export default class VeosifQuickStartComponent extends Component {
    @service router;
    @service currentUser;

    get companyName() {
        return this.currentUser?.user?.company_name || 'Your Organization';
    }

    get steps() {
        return [
            {
                id: 1,
                label: 'Workspace Setup',
                description: 'Your workspace has been configured.',
                icon: 'check-circle',
                iconClass: 'text-teal-500',
                done: true,
                route: null,
            },
            {
                id: 2,
                label: 'Add your first driver',
                description: 'Register drivers to start assigning orders.',
                icon: 'user-plus',
                iconClass: 'text-gray-400',
                done: false,
                route: 'console.fleet-ops.drivers',
            },
            {
                id: 3,
                label: 'Add your first vehicle',
                description: 'Set up your fleet vehicles.',
                icon: 'truck',
                iconClass: 'text-gray-400',
                done: false,
                route: 'console.fleet-ops.vehicles',
            },
            {
                id: 4,
                label: 'Create your first order',
                description: 'Dispatch your first delivery order.',
                icon: 'box',
                iconClass: 'text-gray-400',
                done: false,
                route: 'console.fleet-ops.orders',
            },
            {
                id: 5,
                label: 'Invite team members',
                description: 'Add dispatchers and managers to your workspace.',
                icon: 'user-group',
                iconClass: 'text-gray-400',
                done: false,
                route: 'console.settings',
            },
        ];
    }

    @action
    goToRoute(step) {
        if (step.route) {
            try {
                this.router.transitionTo(step.route);
            } catch (e) {
                // Route not available
            }
        }
    }
}
