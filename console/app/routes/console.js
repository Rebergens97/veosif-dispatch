import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import removeBootLoader from '../utils/remove-boot-loader';
import '@fleetbase/leaflet-routing-machine';

export default class ConsoleRoute extends Route {
    @service('universe/hook-service') hookService;
    @service('workspace-setup') workspaceSetup;
    @service store;
    @service session;
    @service router;
    @service currentUser;
    @service intl;

    /**
     * Require authentication to access all `console` routes.
     *
     * @param {Transition} transition
     * @return {Promise}
     * @memberof ConsoleRoute
     */
    async beforeModel(transition) {
        await this.session.requireAuthentication(transition, 'auth.login');

        this.hookService.execute('console:before-model', this.session, this.router, transition);

        if (this.session.isAuthenticated) {
            await this.session.promiseCurrentUser(transition);

            // Show setup wizard overlay if not yet completed
            try {
                const localCompleted = localStorage.getItem('veosif_setup_completed') === '1';
                const user = this.currentUser?.user;
                const backendCompleted = user?.company_onboarding_completed === true;
                const isCompleted = localCompleted || backendCompleted;
                if (!isCompleted) {
                    this.workspaceSetup.shouldShow = true;
                    this.workspaceSetup.loadProgress();
                    this.workspaceSetup.prefillFromUser();
                }
            } catch (e) {
                // Silently continue to console if check fails
            }
        }
    }

    /**
     * Register after model hook.
     *
     * @param {DS.Model} model
     * @param {Transition} transition
     * @memberof ConsoleRoute
     */
    async afterModel(model, transition) {
        this.hookService.execute('console:after-model', this.session, this.router, model, transition);
        removeBootLoader();
    }

    /**
     * Route did complete transition.
     *
     * @memberof ConsoleRoute
     */
    @action didTransition() {
        this.hookService.execute('console:did-transition', this.session, this.router);
    }

    /**
     * Get the branding settings.
     *
     * @return {BrandModel}
     * @memberof ConsoleRoute
     */
    model() {
        return this.store.findRecord('brand', 1);
    }
}
