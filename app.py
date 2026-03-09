from flask import Flask, request, redirect, render_template_string, abort, jsonify
import os
import sys
import datetime
import gspread
from google.oauth2.service_account import Credentials

# Force UTF-8 encoding for standard output to avoid charmap errors on Windows
if sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8', buffering=1)

app = Flask(__name__, static_folder='.', static_url_path='')

# ──────────────────────────────────────────────
#  ⚙️  CONFIG — Change this to your redirect URL
# ──────────────────────────────────────────────
REDIRECT_URL = 'https://mygmobile.app.link/'   # 🔁 Update this!
SHEET_ID = '1cdVrhFTixKgU0ja4W_jxH3BAe2knQ4okIiZNbAmcJbA'

# ──────────────────────────────────────────────
#  Google Sheets Initialization
# ──────────────────────────────────────────────
SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive'
]
gclient = None
try:
    if os.path.exists('credentials.json'):
        creds = Credentials.from_service_account_file('credentials.json', scopes=SCOPES)
        gclient = gspread.authorize(creds)
        print("✅ Google Sheets connection successful.")
    else:
        print("⚠️ Warning: credentials.json not found. Google Sheets integration will be skipped.")
except Exception as e:
    print(f"❌ Error connecting to Google Sheets: {e}")

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

    # ── Save to Google Sheets ──
    if gclient:
        try:
            sheet = gclient.open_by_key(SHEET_ID).sheet1
            timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            row = [timestamp, staff_mobile, customer_name, customer_mobile]
            sheet.append_row(row)
            print("✅ Data successfully saved to Google Sheets.")
        except Exception as e:
            print(f"❌ Failed to save to Google Sheets: {e}")
            # We continue anyway so the user still gets redirected

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

