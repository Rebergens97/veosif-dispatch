import { Widget } from '@fleetbase/ember-core/contracts';
import { debug } from '@ember/debug';

/**
 * Register dashboard and widgets for VEOSIF Dispatch Console
 * Runs after extensions are loaded
 */
export function initialize(appInstance) {
    const widgetService = appInstance.lookup('service:universe/widget-service');

    debug('[Initializing Widgets] Registering VEOSIF dashboard and widgets...');

    // Register the console dashboard
    widgetService.registerDashboard('dashboard');

    // Create widget definitions
    const widgets = [
        new Widget({
            id: 'veosif-quick-start',
            name: 'Getting Started',
            description: 'Step-by-step guide to set up your dispatch workspace.',
            icon: 'rocket',
            component: 'veosif-quick-start',
            grid_options: { w: 8, h: 9, minW: 8, minH: 9 },
            default: true,
        }),
        new Widget({
            id: 'veosif-platform-summary',
            name: 'Platform Overview',
            description: 'Key stats for your VEOSIF Dispatch workspace.',
            icon: 'chart-simple',
            component: 'veosif-platform-summary',
            grid_options: { w: 4, h: 9, minW: 4, minH: 9 },
            default: true,
        }),
    ];

    // Register widgets
    widgetService.registerWidgets('dashboard', widgets);
}

export default {
    name: 'initialize-widgets',
    after: 'load-extensions',
    initialize,
};
