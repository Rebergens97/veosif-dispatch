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

    model() {
        removeBootLoader();
        return null;
    }
}
