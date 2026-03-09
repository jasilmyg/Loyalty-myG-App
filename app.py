from flask import Flask, request, redirect, render_template_string, abort, jsonify
import os
import sys
import datetime
import requests

# Force UTF-8 encoding for standard output to avoid charmap errors on Windows
if sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8', buffering=1)

app = Flask(__name__, static_folder='.', static_url_path='')

# ──────────────────────────────────────────────
#  ⚙️  CONFIG
# ──────────────────────────────────────────────
REDIRECT_URL = 'https://mygmobile.app.link/'   # 🔁 Update this!

# Paste your deployed Google Apps Script Web App URL here:
APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbztRdHNiG3eVGmvxYf0vyGN-p_1_PVYY1Wlda5LVxEij-koHo6kElOUZeXtOs4_1VEFjg/exec'

# ──────────────────────────────────────────────
#  Serve the landing page
# ──────────────────────────────────────────────
@app.route('/')
def index():
    return app.send_static_file('index.html')

# ──────────────────────────────────────────────
#  Handle form submission (POST)
# ──────────────────────────────────────────────
@app.route('/submit', methods=['POST'])
def submit():
    staff_mobile    = request.form.get('staff_mobile', '').strip()
    customer_name   = request.form.get('customer_name', '').strip()
    customer_mobile = request.form.get('customer_mobile', '').strip()

    errors = {}

    # Validate staff mobile
    if not staff_mobile.isdigit() or len(staff_mobile) != 10 or staff_mobile[0] not in '6789':
        errors['staff_mobile'] = 'Please enter a valid 10-digit staff mobile number.'

    # Validate customer name
    if not customer_name:
        errors['customer_name'] = "Please enter the customer's name."

    # Validate customer mobile
    if not customer_mobile.isdigit() or len(customer_mobile) != 10 or customer_mobile[0] not in '6789':
        errors['customer_mobile'] = 'Please enter a valid 10-digit customer mobile number.'

    if errors:
        # Return validation errors as JSON for the frontend to handle
        from flask import jsonify
        return jsonify({'success': False, 'errors': errors}), 400

    # ── Log the visit to console ──
    print("\n[NEW VISIT LOGGED]")
    print(f"  Staff Mobile   : +91 {staff_mobile}")
    print(f"  Customer Name  : {customer_name}")
    print(f"  Customer Mobile: +91 {customer_mobile}")
    print(f"{'-'*40}")

    # ── Save to Google Sheets via Web App ──
    if APPS_SCRIPT_URL != 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL':
        try:
            timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            payload = {
                "timestamp": timestamp,
                "staff_mobile": staff_mobile,
                "customer_name": customer_name,
                "customer_mobile": customer_mobile
            }
            # Send data to Apps Script
            requests.post(APPS_SCRIPT_URL, json=payload, timeout=5)
            print("✅ Data successfully sent to Google Sheets Web App.")
        except Exception as e:
            print(f"❌ Failed to send to Google Sheets Web App: {e}")
            # We continue anyway so the user still gets redirected
    else:
        print("⚠️ APPS_SCRIPT_URL not configured. Skipping Google Sheets integration.")

    # Return success JSON with redirect URL
    from flask import jsonify
    return jsonify({'success': True, 'redirect_url': REDIRECT_URL}), 200


if __name__ == '__main__':
    print("\n" + "="*50)
    print("  myG Loyalty Server")
    print("  Running at: http://localhost:5000")
    print("  Press Ctrl+C to stop")
    print("="*50 + "\n")
    app.run(debug=True, port=5000, use_reloader=False)

