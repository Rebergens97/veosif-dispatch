<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to VEOSIF Dispatch</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #14b8a6, #0f766e); padding: 40px 32px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; }
        .header p { color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 16px; }
        .body { padding: 40px 32px; }
        .body h2 { color: #111827; font-size: 22px; margin: 0 0 16px; }
        .body p { color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 16px; }
        .summary { background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 8px; padding: 20px 24px; margin: 24px 0; }
        .summary h3 { color: #0f766e; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 12px; }
        .summary-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #ccfbf1; }
        .summary-row:last-child { border-bottom: none; }
        .summary-row .label { color: #6b7280; font-size: 14px; }
        .summary-row .value { color: #111827; font-size: 14px; font-weight: 500; }
        .cta { text-align: center; margin: 32px 0; }
        .btn { display: inline-block; background: #14b8a6; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px; }
        .footer { background: #f9fafb; padding: 24px 32px; text-align: center; border-top: 1px solid #e5e7eb; }
        .footer p { color: #9ca3af; font-size: 13px; margin: 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Welcome to VEOSIF Dispatch</h1>
            <p>Your workspace is ready</p>
        </div>
        <div class="body">
            <h2>Hi {{ $name }},</h2>
            <p>Your workspace has been successfully set up. You're ready to start managing your dispatch operations.</p>

            <div class="summary">
                <h3>Setup Summary</h3>
                <div class="summary-row">
                    <span class="label">Organization</span>
                    <span class="value">{{ $companyName }}</span>
                </div>
                <div class="summary-row">
                    <span class="label">Plan</span>
                    <span class="value">{{ ucfirst($planId) ?? 'Starter' }}</span>
                </div>
                <div class="summary-row">
                    <span class="label">Billing</span>
                    <span class="value">{{ ucfirst($billingCycle) ?? 'Monthly' }}</span>
                </div>
                @if($isTrial)
                <div class="summary-row">
                    <span class="label">Trial</span>
                    <span class="value">14-day free trial active</span>
                </div>
                @endif
            </div>

            <p>Here's what you can do next:</p>
            <ul style="color: #6b7280; font-size: 15px; line-height: 1.8; padding-left: 20px;">
                <li>Add your drivers and vehicles</li>
                <li>Create your first dispatch order</li>
                <li>Invite team members</li>
                <li>Configure your notification settings</li>
            </ul>

            <div class="cta">
                <a href="https://veosifwork.com" class="btn">Go to Dashboard →</a>
            </div>
        </div>
        <div class="footer">
            <p>VEOSIF Dispatch · <a href="mailto:support@veosifwork.com" style="color: #14b8a6;">support@veosifwork.com</a></p>
            <p style="margin-top: 6px;">© {{ date('Y') }} VEOSIF. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
