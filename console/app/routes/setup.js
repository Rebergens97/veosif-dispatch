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
    }

    async model() {
        try {
            this.workspaceSetup.loadProgress();
        } catch (e) {
            // ignore
        }
        try {
            this.workspaceSetup.prefillFromUser();
        } catch (e) {
            // ignore
        }
        let brand = null;
        try {
            brand = await this.store.findRecord('brand', 1);
        } catch (e) {
            // ignore
        }
        return brand;
    }

    afterModel() {
        try {
            removeBootLoader();
        } catch (e) {
            // ignore
        }
    }
}
