import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { task } from 'ember-concurrency';

export default class VeosifPlatformSummaryComponent extends Component {
    @service fetch;
    @service currentUser;

    @tracked stats = {
        organizations: 0,
        users: 0,
        drivers: 0,
        ordersThisWeek: 0,
    };
    @tracked isLoading = true;

    get companyName() {
        return this.currentUser?.user?.company_name || 'VEOSIF Dispatch';
    }

    get isSuperAdmin() {
        return this.currentUser?.user?.type === 'admin';
    }

    constructor() {
        super(...arguments);
        this.loadStats.perform();
    }

    @task *loadStats() {
        this.isLoading = true;
        try {
            if (this.isSuperAdmin) {
                const data = yield this.fetch.get('admin/metrics');
                if (data) {
                    this.stats = {
                        organizations: data.organizations ?? 0,
                        users: data.users ?? 0,
                        drivers: data.drivers ?? 0,
                        ordersThisWeek: data.orders_this_week ?? 0,
                    };
                }
            } else {
                const data = yield this.fetch.get('fleet-ops/metrics');
                if (data) {
                    this.stats = {
                        organizations: null,
                        users: data.dispatchers ?? 0,
                        drivers: data.drivers ?? 0,
                        ordersThisWeek: data.orders_this_week ?? 0,
                    };
                }
            }
        } catch (e) {
            // Keep default zeros if API fails
        } finally {
            this.isLoading = false;
        }
    }
}
