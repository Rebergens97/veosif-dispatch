import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import removeBootLoader from '../utils/remove-boot-loader';

export default class SetupRoute extends Route {
    @service session;
    @service store;
    @service('workspace-setup') workspaceSetup;

    async beforeModel(transition) {
        await this.session.requireAuthentication(transition, 'auth.login');
    }

    async model() {
        this.workspaceSetup.loadProgress();
        return this.store.findRecord('brand', 1).catch(() => null);
    }

    afterModel() {
        removeBootLoader();
    }
}
