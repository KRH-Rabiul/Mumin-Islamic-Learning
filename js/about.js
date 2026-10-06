/* ==========================================================================
   about.js — "আমাদের সম্পর্কে" page
   Feedback form: validates, sends the message by email (FormSubmit) and shows a thank-you popup.
   To change the receiving email, edit the address in the formsubmit.co URL below.
   ========================================================================== */

(() => {
  const form = document.getElementById('feedbackForm');
  const status = document.getElementById('formStatus');
  const button = form?.querySelector('button[type="submit"]');
  const success = document.getElementById('feedbackSuccess');
  const closeSuccess = document.getElementById('closeFeedbackSuccess');
  const closeSuccess2 = document.getElementById('closeFeedbackSuccess2');
  if (!form) return;

  // Small status line under the form (kind: '', 'is-error' or 'is-success').
  const setStatus = (message, kind = '') => {
    if (!status) return;
    status.textContent = message;
    status.className = `form-status ${kind}`.trim();
  };

  // Thank-you popup: open / close helpers.
  const openSuccess = () => {
    if (!success) return;
    success.classList.add('is-visible');
    success.setAttribute('aria-hidden', 'false');
    document.body.classList.add('feedback-modal-open');
  };

  const closeSuccessModal = () => {
    if (!success) return;
    success.classList.remove('is-visible');
    success.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('feedback-modal-open');
  };

  // Close the popup with either button, by clicking the backdrop, or with Esc.
  closeSuccess?.addEventListener('click', closeSuccessModal);
  closeSuccess2?.addEventListener('click', closeSuccessModal);
  success?.addEventListener('click', (event) => {
    if (event.target === success) closeSuccessModal();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeSuccessModal();
  });

  // Submit: validate -> disable button -> POST -> show success or error.
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (button?.disabled) return;

    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    const email = String(data.get('email') || '').trim();
    const type = String(data.get('type') || '').trim();
    const message = String(data.get('message') || '').trim();

    if (!name || !message) {
      setStatus('নাম ও বার্তা লিখুন।', 'is-error');
      return;
    }

    if (button) {
      button.disabled = true;
      button.classList.add('is-sending');
      button.querySelector('.button-label')?.replaceChildren(document.createTextNode('পাঠানো হচ্ছে…'));
    }
    setStatus('আপনার বার্তা পাঠানো হচ্ছে…');

    const payload = {
      name,
      email: email || 'দেওয়া হয়নি',
      type,
      message,
      _subject: `Mumin Website — ${type || 'নতুন বার্তা'}`,
      _template: 'table',
      _replyto: email || '',
      _honey: '',
    };

    try {
      const response = await fetch('https://formsubmit.co/ajax/de264131a27a0a6fd607a4b4194eeff1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      let result = {};
      try {
        result = await response.json();
      } catch {
        /* response was not JSON: fall through to the response.ok check */
      }

      if (!response.ok || result.success === false) {
        throw new Error(result.message || 'Email delivery failed');
      }

      form.reset();
      setStatus('বার্তা সফলভাবে পাঠানো হয়েছে।', 'is-success');
      openSuccess();
    } catch (error) {
      console.error('Mumin feedback send error:', error);
      setStatus('বার্তা পাঠানো যায়নি। ইন্টারনেট সংযোগ বা email service আবার চেষ্টা করুন।', 'is-error');
    } finally {
      if (button) {
        button.disabled = false;
        button.classList.remove('is-sending');
        button.querySelector('.button-label')?.replaceChildren(document.createTextNode('ইমেইলে পাঠান'));
      }
    }
  });
})();
