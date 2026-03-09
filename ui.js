/* ─────────────────────────────────────────────
   myG Loyalty – UI interactions only
   Form submission is handled by Flask (app.py)
   ───────────────────────────────────────────── */

function $(id) { return document.getElementById(id); }

function isValidMobile(val) { return /^[6-9]\d{9}$/.test(val.trim()); }

function showError(inputId, errId) {
    $(inputId).classList.add('error');
    $(errId).classList.add('visible');
}
function clearError(inputId, errId) {
    $(inputId).classList.remove('error');
    $(errId).classList.remove('visible');
}

/* ── Live validation ── */
['staff-mobile', 'customer-name', 'customer-mobile'].forEach(id => {
    const el = $(id);
    if (!el) return;
    const errMap = { 'staff-mobile': 'err-staff', 'customer-name': 'err-name', 'customer-mobile': 'err-cust-mobile' };
    el.addEventListener('input', () => {
        el.classList.remove('error');
        $(errMap[id])?.classList.remove('visible');
    });
    if (id !== 'customer-name') {
        el.addEventListener('keypress', e => { if (!/[0-9]/.test(e.key)) e.preventDefault(); });
    }
});

/* ── Step 1 → Step 2 ── */
function goToStep2() {
    const mobile = $('staff-mobile').value.trim();
    if (!isValidMobile(mobile)) {
        showError('staff-mobile', 'err-staff');
        $('staff-mobile').animate(
            [{ transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' },
            { transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'translateX(0)' }],
            { duration: 350, easing: 'ease-in-out' }
        );
        return;
    }
    // Pass staff mobile to hidden field + chip
    $('hidden-staff-mobile').value = mobile;
    $('chip-mobile').textContent = '+91 ' + mobile;

    const step1 = $('step-1');
    step1.style.animation = 'stepOut 0.3s ease forwards';
    setTimeout(() => {
        step1.classList.add('hidden');
        step1.style.animation = '';
        $('prog-2').classList.add('active');
        $('prog-line').classList.add('filled');
        $('step-2').classList.remove('hidden');
        $('customer-name').focus();
    }, 280);
}

/* ── Step 2 → Step 1 ── */
function goBackToStep1() {
    $('step-2').classList.add('hidden');
    $('prog-2').classList.remove('active');
    $('prog-line').classList.remove('filled');
    $('step-1').classList.remove('hidden');
}

/* ── Form Submit → POST to Flask ── */
async function handleSubmit(e) {
    e.preventDefault();

    const name = $('customer-name').value.trim();
    const mobile = $('customer-mobile').value.trim();
    const staff = $('hidden-staff-mobile').value.trim();
    let valid = true;

    if (!name) { showError('customer-name', 'err-name'); valid = false; }
    if (!isValidMobile(mobile)) { showError('customer-mobile', 'err-cust-mobile'); valid = false; }
    if (!valid) return false;

    // Loading state
    const btn = $('btn-submit');
    $('btn-label').textContent = 'Processing…';
    btn.disabled = true;
    $('server-error').classList.add('hidden');

    try {
        const formData = new URLSearchParams();
        formData.append('staff_mobile', staff);
        formData.append('customer_name', name);
        formData.append('customer_mobile', mobile);

        const res = await fetch('/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData.toString()
        });

        if (res.ok) {
            const data = await res.json();
            if (data.success) {
                // Show success then follow redirect
                $('step-2').classList.add('hidden');
                $('prog-2').classList.remove('active');
                $('prog-2').classList.add('done');
                $('step-success').classList.remove('hidden');
                setTimeout(() => { window.location.href = data.redirect_url; }, 2000);
            } else {
                const msgs = Object.values(data.errors || {}).join(' ');
                $('server-error-msg').textContent = msgs || 'Submission failed. Please try again.';
                $('server-error').classList.remove('hidden');
                $('btn-label').textContent = 'Submit & Earn Points';
                btn.disabled = false;
            }
        } else {
            const data = await res.json().catch(() => ({}));
            const msgs = Object.values(data.errors || {}).join(' ');
            $('server-error-msg').textContent = msgs || 'Submission failed. Please try again.';
            $('server-error').classList.remove('hidden');
            $('btn-label').textContent = 'Submit & Earn Points';
            btn.disabled = false;
        }
    } catch (err) {
        $('server-error-msg').textContent = 'Network error. Is the server running?';
        $('server-error').classList.remove('hidden');
        $('btn-label').textContent = 'Submit & Earn Points';
        btn.disabled = false;
    }
    return false;
}

/* ── Enter key support ── */
$('staff-mobile').addEventListener('keydown', e => { if (e.key === 'Enter') goToStep2(); });

/* ── Inject stepOut keyframe ── */
const s = document.createElement('style');
s.textContent = `@keyframes stepOut { to { opacity:0; transform:translateX(-20px); } }`;
document.head.appendChild(s);
