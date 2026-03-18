import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { later } from '@ember/runloop';

export default class ConsoleAdminOrganizationsIndexUsersController extends Controller {
    @service filters;
    @service intl;
    @service router;
    @service fetch;
    @service notifications;
    @service modalsManager;
    @service session;

    /**
     * The current page of data being viewed
     *
     * @var {Integer}
     */
    @tracked nestedPage = 1;

    /**
     * The maximum number of items to show per page
     *
     * @var {Integer}
     */
    @tracked nestedLimit = 20;

    /**
     * The filterable param `sort`
     *
     * @var {Array|String}
     */
    @tracked nestedSort = '-created_at';

    /**
     * The filterable param `sort`
     *
     * @var {String}
     */
    @tracked nestedQuery = '';

    /**
     * The company loaded.
     *
     * @memberof ConsoleAdminOrganizationsIndexUsersController
     */
    @tracked company;

    /**
     * The overlay context API.
     *
     * @memberof ConsoleAdminOrganizationsIndexUsersController
     */
    @tracked contextApi;

    /**
     * Queryable parameters for this controller's model
     *
     * @var {Array}
     */
    queryParams = ['nestedPage', 'nestedLimit', 'nestedSort', 'nestedQuery'];

    /**
     * Columns to render to the table.
     *
     * @memberof ConsoleAdminOrganizationsIndexUsersController
     */
    columns = [
        {
            label: this.intl.t('common.name'),
            valuePath: 'name',
        },
        {
            label: this.intl.t('common.role'),
            valuePath: 'roleName',
        },
        {
            label: this.intl.t('common.phone'),
            valuePath: 'phone',
        },
        {
            label: this.intl.t('common.email'),
            valuePath: 'email',
        },
        {
            label: this.intl.t('common.status'),
            valuePath: 'status',
            cellComponent: 'table/cell/status',
        },
        {
            label: '',
            cellComponent: 'table/cell/dropdown',
            ddButtonText: false,
            ddButtonIcon: 'ellipsis-h',
            ddButtonIconPrefix: 'fas',
            ddMenuLabel: 'User Actions',
            cellClassNames: 'overflow-visible',
            wrapperClass: 'flex items-center justify-end mx-2',
            width: '9%',
            actions: [
                {
                    label: 'Impersonate',
                    icon: 'user-secret',
                    fn: this.impersonateUser,
                },
                {
                    label: 'Change Password',
                    icon: 'lock-open',
                    fn: this.changeUserPassword,
                },
                {
                    label: 'Activate',
                    icon: 'check-circle',
                    fn: this.activateUser,
                },
                {
                    label: 'Deactivate',
                    icon: 'ban',
                    fn: this.deactivateUser,
                },
            ],
            sortable: false,
            filterable: false,
            resizable: false,
            searchable: false,
        },
    ];

    /**
     * Impersonate the selected user.
     *
     * @param {UserModel} user
     * @memberof ConsoleAdminOrganizationsIndexUsersController
     */
    @action async impersonateUser(user) {
        try {
            const { token } = await this.fetch.post('auth/impersonate', { user: user.id });
            await this.router.transitionTo('console');
            this.session.manuallyAuthenticate(token);
            this.notifications.info(`Now impersonating ${user.email}...`);
            later(
                this,
                () => {
                    window.location.reload();
                },
                600
            );
        } catch (error) {
            this.notifications.serverError(error);
        }
    }

    /**
     * Change password for a user
     *
     * @void
     */
    @action changeUserPassword(user) {
        this.modalsManager.show('modals/change-user-password', {
            keepOpen: true,
            user,
        });
    }

    /**
     * Activate a user account.
     *
     * @param {UserModel} user
     */
    @action async activateUser(user) {
        try {
            await this.fetch.patch(`users/${user.id}`, { status: 'active' });
            user.set('status', 'active');
            this.notifications.success(`${user.name} has been activated.`);
        } catch (error) {
            this.notifications.serverError(error);
        }
    }

    /**
     * Deactivate a user account.
     *
     * @param {UserModel} user
     */
    @action async deactivateUser(user) {
        this.modalsManager.confirm({
            title: 'Deactivate User',
            body: `Are you sure you want to deactivate ${user.name}? They will no longer be able to log in.`,
            acceptButtonText: 'Deactivate',
            acceptButtonScheme: 'danger',
            confirm: async (modal) => {
                modal.startLoading();
                try {
                    await this.fetch.patch(`users/${user.id}`, { status: 'inactive' });
                    user.set('status', 'inactive');
                    this.notifications.warning(`${user.name} has been deactivated.`);
                    modal.done();
                } catch (error) {
                    modal.stopLoading();
                    this.notifications.serverError(error);
                }
            },
        });
    }

    /**
     * Update search query param and reset page to 1
     *
     * @param {Event} event
     * @memberof ConsoleAdminOrganizationsController
     */
    @action search(event) {
        this.nestedQuery = event.target.value ?? '';
        this.nestedPage = 1;
    }

    /**
     * Set the overlay component context object.
     *
     * @param {Object} contextApi
     * @memberof ConsoleAdminOrganizationsIndexUsersController
     */
    @action setOverlayContext(contextApi) {
        this.contextApi = contextApi;
    }

    /**
     * Handle closing the overlay.
     *
     * @return {Promise<Transition>}
     * @memberof ConsoleAdminOrganizationsIndexUsersController
     */
    @action onPressClose() {
        if (this.contextApi && typeof this.contextApi.close === 'function') {
            this.contextApi.close();
        }

        return this.router.transitionTo('console.admin.organizations.index');
    }
}
