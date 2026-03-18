<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            if (!Schema::hasColumn('companies', 'onboarding_completed')) {
                $table->boolean('onboarding_completed')->default(false)->after('status');
            }
            if (!Schema::hasColumn('companies', 'setup_plan_id')) {
                $table->string('setup_plan_id')->nullable()->after('onboarding_completed');
            }
            if (!Schema::hasColumn('companies', 'setup_billing_cycle')) {
                $table->string('setup_billing_cycle')->nullable()->after('setup_plan_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumnIfExists('onboarding_completed');
            $table->dropColumnIfExists('setup_plan_id');
            $table->dropColumnIfExists('setup_billing_cycle');
        });
    }
};
