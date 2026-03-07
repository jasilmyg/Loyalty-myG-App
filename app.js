/* ─────────────────────────────────────────────
   myG Loyalty – App Logic
   ─────────────────────────────────────────────
   ⚙️  CONFIG: Set your redirect URL below
   ───────────────────────────────────────────── */

const REDIRECT_URL = 'https://your-redirect-link.com'; // 🔁 <-- CHANGE THIS

/* ─── Helpers ─── */
function $(id) { return document.getElementById(id); }

function isValidMobile(val) {
    return /^[6-9]\d{9}$/.test(val.trim());
}

function showError(inputId, errId) {
    $(inputId).classList.add('error');
    $(errId).classList.add('visible');
}
function clearError(inputId, errId) {
    $(inputId).classList.remove('error');
    $(errId).classList.remove('visible');
}

/* ─── Live validation – remove error on input ─── */
['staff-mobile', 'customer-name', 'customer-mobile'].forEach(id => {
    const el = $(id);
    if (!el) return;
    el.addEventListener('input', () => {
        el.classList.remove('error');
        const errMap = {
            'staff-mobile': 'err-staff',
            'customer-name': 'err-name',
            'customer-mobile': 'err-cust-mobile',
        };
        $(errMap[id])?.classList.remove('visible');
    });
    // Allow only digits in phone fields
    if (id !== 'customer-name') {
        el.addEventListener('keypress', e => {
            if (!/[0-9]/.test(e.key)) e.preventDefault();
        });
    }
});

/* ─── Step 1 → Step 2 ─── */
function goToStep2() {
    const mobile = $('staff-mobile').value.trim();
    if (!isValidMobile(mobile)) {
        showError('staff-mobile', 'err-staff');
        $('staff-mobile').focus();
        // Shake animation
        $('staff-mobile').animate(
            [{ transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' },
            { transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' },
            { transform: 'translateX(0)' }],
            { duration: 350, easing: 'ease-in-out' }
        );
        return;
    }

    // Update chip
    $('chip-mobile').textContent = '+91 ' + mobile;

    // Animate out step 1
    const step1 = $('step-1');
    step1.style.animation = 'stepOut 0.3s ease forwards';

    setTimeout(() => {
        step1.classList.add('hidden');
        step1.style.animation = '';

        // Activate progress
        $('prog-2').classList.add('active');
        $('prog-line').classList.add('filled');

        // Show step 2
        $('step-2').classList.remove('hidden');
        $('customer-name').focus();
    }, 280);
}

/* ─── Step 2 → Step 1 ─── */
function goBackToStep1() {
    $('step-2').classList.add('hidden');
    $('prog-2').classList.remove('active');
    $('prog-line').classList.remove('filled');
    $('step-1').classList.remove('hidden');
}

/* ─── Submit ─── */
function handleSubmit() {
    const name = $('customer-name').value.trim();
    const mobile = $('customer-mobile').value.trim();
    let valid = true;

    if (!name) {
        showError('customer-name', 'err-name');
        valid = false;
    }
    if (!isValidMobile(mobile)) {
        showError('customer-mobile', 'err-cust-mobile');
        valid = false;
    }
    if (!valid) return;

    // Disable button to prevent double-submit
    const btn = $('btn-submit');
    btn.disabled = true;
    btn.innerHTML = '<span>Processing…</span>';

    // Show success
    $('step-2').classList.add('hidden');
    $('prog-2').classList.remove('active');
    $('prog-2').classList.add('done');

    $('step-success').classList.remove('hidden');

    // Redirect after animation
    setTimeout(() => {
        window.location.href = REDIRECT_URL;
    }, 2200);
}

/* ─── Step-out keyframe (injected) ─── */
const styleEl = document.createElement('style');
styleEl.textContent = `
  @keyframes stepOut {
    to { opacity: 0; transform: translateX(-20px); }
  }
`;
document.head.appendChild(styleEl);

/* ─── Allow Enter key to advance ─── */
$('staff-mobile').addEventListener('keydown', e => {
    if (e.key === 'Enter') goToStep2();
});
['customer-name', 'customer-mobile'].forEach(id => {
    $(id)?.addEventListener('keydown', e => {
        if (e.key === 'Enter') handleSubmit();
    });
});
