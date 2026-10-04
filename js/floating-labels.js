document.addEventListener('DOMContentLoaded', function () {
  // Targets inputs and textareas inside .form containers
  const selector = '.form .form-group input[type="text"], .form .form-group input[type="email"], .form .form-group textarea, .form .form-group input[type="tel"], .form .form-group input[type="search"]';
  document.querySelectorAll(selector).forEach(function (el) {
    // Skip inputs without a placeholder/label text
    const placeholder = el.getAttribute('placeholder') || '';
    if (!placeholder) return;

    // Build wrapper and label
    const wrapper = document.createElement('div');
    wrapper.className = 'floating-field';

    // Move input into wrapper
    const parent = el.parentNode;
    parent.insertBefore(wrapper, el);
    wrapper.appendChild(el);

    // Create visible floating label from placeholder
    const label = document.createElement('label');
    label.className = 'floating-label';
    label.textContent = placeholder;
    wrapper.appendChild(label);

    // Remove native placeholder to avoid duplicate text
    el.removeAttribute('placeholder');

    // Initialize filled state
    if (el.value && el.value.trim() !== '') {
      wrapper.classList.add('filled');
    }

    // Event handlers
    el.addEventListener('focus', function () { wrapper.classList.add('focused'); });
    el.addEventListener('blur', function () { wrapper.classList.remove('focused'); });
    el.addEventListener('input', function () {
      if (el.value && el.value.trim() !== '') wrapper.classList.add('filled');
      else wrapper.classList.remove('filled');
    });
  });
});
