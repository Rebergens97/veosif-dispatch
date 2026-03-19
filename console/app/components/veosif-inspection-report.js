import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { task } from 'ember-concurrency';

export default class VeosifInspectionReportComponent extends Component {
    @service fetch;
    @service notifications;

    @tracked inspections = [];
    @tracked stats = { total: 0, withDefects: 0, satisfactory: 0 };
    @tracked isLoading = true;
    @tracked selectedDate = new Date().toISOString().split('T')[0];

    constructor() {
        super(...arguments);
        this.loadInspections.perform();
    }

    @task *loadInspections() {
        this.isLoading = true;
        try {
            const result = yield this.fetch.get(`fleet-ops/vehicle-inspections?date=${this.selectedDate}`);
            if (result) {
                this.inspections = result.inspections || [];
                this.stats = {
                    total: result.total || 0,
                    withDefects: result.with_defects || 0,
                    satisfactory: result.satisfactory || 0,
                };
            }
        } catch (e) {
            this.inspections = [];
        } finally {
            this.isLoading = false;
        }
    }

    @action
    changeDate(event) {
        this.selectedDate = event.target.value;
        this.loadInspections.perform();
    }

    @action
    async approveInspection(inspection) {
        try {
            await this.fetch.patch(`fleet-ops/vehicle-inspections/${inspection.uuid}/status`, { status: 'approved' });
            inspection.status = 'approved';
            this.notifications.success('Inspection approved.');
            this.loadInspections.perform();
        } catch (e) {
            this.notifications.serverError(e);
        }
    }

    @action
    async rejectInspection(inspection) {
        try {
            await this.fetch.patch(`fleet-ops/vehicle-inspections/${inspection.uuid}/status`, { status: 'rejected' });
            this.notifications.warning('Inspection rejected.');
            this.loadInspections.perform();
        } catch (e) {
            this.notifications.serverError(e);
        }
    }
}
