<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Mail;

class RouteServiceProvider extends ServiceProvider
{
    /**
     * Define your route model bindings, pattern filters, etc.
     *
     * @return void
     */
    public function boot()
    {
        $this->routes(
            function () {
                Route::get(
                    '/health',
                    function (Request $request) {
                        return response()->json(
                            [
                                'status' => 'ok',
                                'time' => microtime(true) - $request->attributes->get('request_start_time')
                            ]
                        );
                    }
                );

                // Welcome email endpoint after workspace setup
                Route::middleware(['api'])->post(
                    '/int/v1/onboarding/welcome-email',
                    function (Request $request) {
                        try {
                            $data = $request->validate([
                                'email'        => 'required|email',
                                'name'         => 'required|string',
                                'company_name' => 'required|string',
                                'plan_id'      => 'nullable|string',
                                'billing_cycle'=> 'nullable|string',
                                'is_trial'     => 'nullable|boolean',
                            ]);

                            Mail::send(
                                'emails.welcome',
                                [
                                    'name'         => $data['name'],
                                    'companyName'  => $data['company_name'],
                                    'planId'       => $data['plan_id'] ?? 'starter',
                                    'billingCycle' => $data['billing_cycle'] ?? 'monthly',
                                    'isTrial'      => $data['is_trial'] ?? false,
                                ],
                                function ($message) use ($data) {
                                    $message->to($data['email'], $data['name'])
                                            ->subject('Welcome to VEOSIF Dispatch 🚀');
                                }
                            );

                            return response()->json(['status' => 'sent']);
                        } catch (\Exception $e) {
                            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
                        }
                    }
                );
            }
        );
    }
}
