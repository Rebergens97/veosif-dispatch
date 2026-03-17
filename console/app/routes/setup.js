import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import removeBootLoader from '../utils/remove-boot-loader';

export default class SetupRoute extends Route {
    @service session;
    @service store;
    @service('workspace-setup') workspaceSetup;
    @service currentUser;

    async beforeModel(transition) {
        await this.session.requireAuthentication(transition, 'auth.login');

        if (this.session.isAuthenticated) {
            await this.session.promiseCurrentUser(transition);
        }
    }

    async model() {
        this.workspaceSetup.loadProgress();
        this.workspaceSetup.prefillFromUser();
        return this.store.findRecord('brand', 1).catch(() => null);
    }

    afterModel() {
        removeBootLoader();
    }
}
