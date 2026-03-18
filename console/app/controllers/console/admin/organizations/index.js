import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';

/**
 * Controller for managing organizations in the admin console.
 *
 * @class ConsoleAdminOrganizationsController
 * @extends Controller
 */
export default class ConsoleAdminOrganizationsController extends Controller {
    @service store;
    @service intl;
    @service router;
    @service filters;
    @service crud;
    @service fetch;
    @service notifications;
    @service modalsManager;

    /**
     * The search query param value.
     *
     * @var {String|null}
     */
    @tracked query;

    /**
     * The current page of data being viewed
     *
     * @var {Integer}
     */
    @tracked page = 1;

    /**
     * The maximum number of items to show per page
     *
     * @var {Integer}
     */
    @tracked limit = 20;

    /**
     * The filterable param `sort`
     *
     * @var {String|Array}
     */
    @tracked sort = '-created_at';

    /**
     * The filterable param `name`
     *
     * @var {String}
     */
    @tracked name;

    /**
     * The filterable param `country`
     *
     * @var {String}
     */
    @tracked country;

    /**
     * Array to store the fetched companies.
     *
     * @var {Array}
     */
    @tracked companies = [];

    /**
     * Queryable parameters for this controller's model
     *
     * @var {Array}
     */
    queryParams = ['name', 'page', 'limit', 'sort'];

    /**
     * Columns for organization
     *
     * @memberof ConsoleAdminOrganizationsController
     */
    columns = [
        {
            label: this.intl.t('common.name'),
            valuePath: 'name',
            resizable: true,
            sortable: true,
            filterable: true,
            filterComponent: 'filter/string',
        },
        {
            label: this.intl.t('console.admin.organizations.index.owner-name-column'),
            valuePath: 'owner.name',
            width: '200px',
            resizable: true,
            sortable: true,
        },
        {
            label: this.intl.t('console.admin.organizations.index.owner-email-column'),
            valuePath: 'owner.email',
            width: '200px',
            resizable: true,
            sortable: true,
            filterable: true,
        },
        {
            label: this.intl.t('console.admin.organizations.index.phone-column'),
            valuePath: 'owner.phone',
            width: '200px',
            resizable: true,
            sortable: true,
            filterable: true,
            filterComponent: 'filter/string',
        },
        {
            label: this.intl.t('console.admin.organizations.index.users-count-column'),
            valuePath: 'users_count',
            resizable: true,
            sortable: true,
        },
        {
            label: this.intl.t('common.status'),
            valuePath: 'status',
            cellComponent: 'table/cell/status',
            width: '120px',
        },
        {
            label: this.intl.t('common.created-at'),
            valuePath: 'createdAt',
        },
        {
            label: '',
            cellComponent: 'table/cell/dropdown',
            ddButtonText: false,
            ddButtonIcon: 'ellipsis-h',
            ddButtonIconPrefix: 'fas',
            ddMenuLabel: 'Organization Actions',
            cellClassNames: 'overflow-visible',
            wrapperClass: 'flex items-center justify-end mx-2',
            width: '9%',
            actions: [
                {
                    label: 'View Users',
                    icon: 'users',
                    fn: this.goToCompany,
                },
                {
                    label: 'Activate',
                    icon: 'check-circle',
                    fn: this.activateOrganization,
                },
                {
                    label: 'Deactivate',
                    icon: 'ban',
                    fn: this.deactivateOrganization,
                },
            ],
            sortable: false,
            filterable: false,
            resizable: false,
            searchable: false,
        },
    ];

    /**
     * Update search query param and reset page to 1
     *
     * @param {Event} event
     * @memberof ConsoleAdminOrganizationsController
     */
    @action search(event) {
        this.query = event.target.value ?? '';
        this.page = 1;
    }

    /**
     * Navigates to the organization-users route for the selected company.
     *
     * @method goToCompany
     * @param {Object} company - The selected company.
     */
    @action goToCompany(company) {
        this.router.transitionTo('console.admin.organizations.index.users', company.public_id);
    }

    /**
     * Toggles dialog to export `drivers`
     *
     * @void
     */
    @action exportOrganization() {
        const selections = this.table.selectedRows.map((_) => _.id);
        this.crud.export('companies', { params: { selections } });
    }

    /**
     * Deactivate an organization and all its users.
     *
     * @param {CompanyModel} company
     */
    @action deactivateOrganization(company) {
        this.modalsManager.confirm({
            title: 'Deactivate Organization',
            body: `Are you sure you want to deactivate ${company.name}? All users in this organization will also be deactivated and lose access.`,
            acceptButtonText: 'Deactivate',
            acceptButtonScheme: 'danger',
            confirm: async (modal) => {
                modal.startLoading();
                try {
                    await this.fetch.patch(`companies/${company.id}`, { status: 'inactive', deactivate_users: true });
                    company.set('status', 'inactive');
                    this.notifications.warning(`${company.name} and all its users have been deactivated.`);
                    modal.done();
                } catch (error) {
                    modal.stopLoading();
                    this.notifications.serverError(error);
                }
            },
        });
    }

    /**
     * Activate an organization and all its users.
     *
     * @param {CompanyModel} company
     */
    @action async activateOrganization(company) {
        try {
            await this.fetch.patch(`companies/${company.id}`, { status: 'active', activate_users: true });
            company.set('status', 'active');
            this.notifications.success(`${company.name} and all its users have been activated.`);
        } catch (error) {
            this.notifications.serverError(error);
        }
    }
}
