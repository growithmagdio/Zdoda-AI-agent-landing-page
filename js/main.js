// ============================================================
// ZDODA SURVEY — NATIVE MULTI-STEP FORM & GOOGLE FORM SUBMIT
// ============================================================

(function () {
  "use strict";

  var STORAGE_KEY = "zdoda_survey_draft";
  var currentStep = 1;

  var stepNames = {
    1: "About your business",
    2: "Your chatbot today",
    3: "Problems and needs"
  };

  var stepPercents = {
    1: 33,
    2: 66,
    3: 100
  };

  // DOM Elements
  var card = document.getElementById("survey-card");
  var form = document.getElementById("zdoda-survey-form");
  var badgeElem = document.getElementById("survey-step-badge");
  var percentElem = document.getElementById("survey-step-percent");
  var progressFill = document.getElementById("survey-progress-fill");
  var progressBar = document.getElementById("survey-progress-bar");
  var toastElem = document.getElementById("survey-toast");
  var submitBtn = document.getElementById("survey-submit-btn");
  var submitErrorElem = document.getElementById("survey-submit-error");
  var storyTextarea = document.getElementById("field-story");
  var storyCharCount = document.getElementById("story-char-count");

  if (!form || !card) return;

  // ------------------------------------------------------------
  // Helper: prefers-reduced-motion
  // ------------------------------------------------------------
  function isReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  // ------------------------------------------------------------
  // Helper: Smooth scroll survey section
  // ------------------------------------------------------------
  function scrollSurveyToTop() {
    var surveySection = document.getElementById("survey");
    if (surveySection) {
      surveySection.scrollIntoView({
        behavior: isReducedMotion() ? "auto" : "smooth",
        block: "start"
      });
    }
  }

  // ------------------------------------------------------------
  // Step Navigation
  // ------------------------------------------------------------
  function goToStep(step) {
    if (step < 1 || step > 3) return;

    for (var s = 1; s <= 3; s++) {
      var stepDiv = document.getElementById("survey-step-" + s);
      if (stepDiv) {
        if (s === step) {
          stepDiv.hidden = false;
          stepDiv.classList.add("is-active");
        } else {
          stepDiv.hidden = true;
          stepDiv.classList.remove("is-active");
        }
      }
    }

    currentStep = step;

    // Update Top Bar
    if (badgeElem) {
      badgeElem.textContent = "Step " + step + " of 3 · " + stepNames[step];
    }
    if (percentElem) {
      percentElem.textContent = stepPercents[step] + "%";
    }
    if (progressFill) {
      progressFill.style.width = (step === 1 ? "33.33%" : (step === 2 ? "66.66%" : "100%"));
    }
    if (progressBar) {
      progressBar.setAttribute("aria-valuenow", String(stepPercents[step]));
    }

    // Scroll to survey top & focus heading
    scrollSurveyToTop();
    var heading = document.getElementById("step-" + step + "-heading");
    if (heading) {
      heading.focus();
    }

    saveDraft();
  }

  // ------------------------------------------------------------
  // Field Error Management
  // ------------------------------------------------------------
  function showError(fieldId, errorId, message) {
    var input = document.getElementById(fieldId);
    var err = document.getElementById(errorId);
    if (input) {
      input.classList.add("has-error");
    }
    if (err) {
      if (message) err.textContent = message;
      err.hidden = false;
    }
  }

  function clearError(fieldId, errorId) {
    var input = document.getElementById(fieldId);
    var err = document.getElementById(errorId);
    if (input) {
      input.classList.remove("has-error");
    }
    if (err) {
      err.hidden = true;
    }
  }

  function clearAllErrors() {
    var inputs = form.querySelectorAll(".has-error");
    inputs.forEach(function (el) {
      el.classList.remove("has-error");
    });
    var errors = form.querySelectorAll(".field-error");
    errors.forEach(function (el) {
      el.hidden = true;
    });
    if (submitErrorElem) {
      submitErrorElem.hidden = true;
    }
  }

  // ------------------------------------------------------------
  // Validation Functions per Step
  // ------------------------------------------------------------
  var EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function validateStep(step) {
    var isValid = true;
    var firstInvalidElement = null;

    function markInvalid(fieldId, errorId, msg) {
      isValid = false;
      showError(fieldId, errorId, msg);
      if (!firstInvalidElement) {
        firstInvalidElement = document.getElementById(fieldId) || document.getElementById(errorId);
      }
    }

    if (step === 1) {
      // 1. Full name (required)
      var fullName = document.getElementById("field-fullname");
      if (!fullName.value.trim()) {
        markInvalid("field-fullname", "error-fullname", "Please enter your full name.");
      } else {
        clearError("field-fullname", "error-fullname");
      }

      // 2. Work email (required, valid email)
      var email = document.getElementById("field-email");
      if (!email.value.trim() || !EMAIL_REGEX.test(email.value.trim())) {
        markInvalid("field-email", "error-email", "Please enter a valid email address.");
      } else {
        clearError("field-email", "error-email");
      }

      // 3. Company name (required)
      var company = document.getElementById("field-company");
      if (!company.value.trim()) {
        markInvalid("field-company", "error-company", "Please enter your company name.");
      } else {
        clearError("field-company", "error-company");
      }

      // 4. Industry (required radio)
      var industryChecked = form.querySelector('input[name="Industry"]:checked');
      if (!industryChecked) {
        markInvalid(null, "error-industry", "Please select your industry.");
      } else {
        clearError(null, "error-industry");
        // If "Other" chosen, text is required
        if (industryChecked.value === "__other_option__") {
          var indOtherText = document.getElementById("industry-other-text");
          if (!indOtherText.value.trim()) {
            markInvalid("industry-other-text", "error-industry-other", "Please specify your industry.");
          } else {
            clearError("industry-other-text", "error-industry-other");
          }
        }
      }

      // 5. Your role (optional, but if Other chosen, text is required)
      var roleChecked = form.querySelector('input[name="Your role"]:checked');
      if (roleChecked && roleChecked.value === "__other_option__") {
        var roleOtherText = document.getElementById("role-other-text");
        if (!roleOtherText.value.trim()) {
          markInvalid("role-other-text", "error-role-other", "Please specify your role.");
        } else {
          clearError("role-other-text", "error-role-other");
        }
      } else {
        clearError("role-other-text", "error-role-other");
      }

      // 6. Country (required)
      var country = document.getElementById("field-country");
      if (!country.value.trim()) {
        markInvalid("field-country", "error-country", "Please enter your country.");
      } else {
        clearError("field-country", "error-country");
      }
    } else if (step === 2) {
      // 1. Which chatbot do you use? (required radio)
      var botChecked = form.querySelector('input[name="Which chatbot do you use?"]:checked');
      if (!botChecked) {
        markInvalid(null, "error-chatbot", "Please select which chatbot you use.");
      } else {
        clearError(null, "error-chatbot");
        if (botChecked.value === "__other_option__") {
          var botOtherText = document.getElementById("chatbot-other-text");
          if (!botOtherText.value.trim()) {
            markInvalid("chatbot-other-text", "error-chatbot-other", "Please specify which chatbot you use.");
          } else {
            clearError("chatbot-other-text", "error-chatbot-other");
          }
        }
      }

      // 2. How happy are you with it? (required scale 1-5)
      var scaleChecked = form.querySelector('input[name="How happy are you with it?"]:checked');
      if (!scaleChecked) {
        markInvalid(null, "error-satisfaction", "Please rate how happy you are with your chatbot.");
      } else {
        clearError(null, "error-satisfaction");
      }
    } else if (step === 3) {
      // 1. Which problems do you face? (required, at least 1)
      var problemChecks = form.querySelectorAll('input[name="Which problems do you face?"]:checked');
      if (problemChecks.length === 0) {
        markInvalid(null, "error-problems", "Please select at least one problem you face.");
      } else {
        clearError(null, "error-problems");
        var probOtherChecked = form.querySelector('#prob-other:checked');
        if (probOtherChecked) {
          var probOtherText = document.getElementById("problems-other-text");
          if (!probOtherText.value.trim()) {
            markInvalid("problems-other-text", "error-problems-other", "Please describe the other problem.");
          } else {
            clearError("problems-other-text", "error-problems-other");
          }
        } else {
          clearError("problems-other-text", "error-problems-other");
        }
      }

      // 2. Which ONE problem hurts your business most? (required radio)
      var mainProbChecked = form.querySelector('input[name="Which ONE problem hurts your business most?"]:checked');
      if (!mainProbChecked) {
        markInvalid(null, "error-mainproblem", "Please choose which one problem hurts your business most.");
      } else {
        clearError(null, "error-mainproblem");
        if (mainProbChecked.value === "__other_option__") {
          var mainOtherText = document.getElementById("mainproblem-other-text");
          if (!mainOtherText.value.trim()) {
            markInvalid("mainproblem-other-text", "error-mainproblem-other", "Please describe the problem that hurts your business most.");
          } else {
            clearError("mainproblem-other-text", "error-mainproblem-other");
          }
        } else {
          clearError("mainproblem-other-text", "error-mainproblem-other");
        }
      }

      // 3. Consent (required single checkbox)
      var consent = document.getElementById("field-consent");
      if (!consent || !consent.checked) {
        markInvalid("field-consent", "error-consent", "Please agree to the consent statement to continue.");
      } else {
        clearError("field-consent", "error-consent");
      }
    }

    if (!isValid && firstInvalidElement) {
      if (typeof firstInvalidElement.focus === "function") {
        firstInvalidElement.focus();
      } else {
        firstInvalidElement.scrollIntoView({ behavior: isReducedMotion() ? "auto" : "smooth", block: "center" });
      }
    }

    return isValid;
  }

  // ------------------------------------------------------------
  // "Other" Option Toggle Logic
  // ------------------------------------------------------------
  function updateOtherVisibility() {
    var otherToggles = form.querySelectorAll("[data-has-other]");
    otherToggles.forEach(function (toggle) {
      var wrapId = toggle.getAttribute("data-has-other");
      var wrap = document.getElementById(wrapId);
      if (!wrap) return;

      if (toggle.checked) {
        wrap.hidden = false;
        var input = wrap.querySelector("input");
        if (input && document.activeElement === toggle) {
          input.focus();
        }
      } else {
        wrap.hidden = true;
        var otherInput = wrap.querySelector("input");
        if (otherInput) {
          otherInput.classList.remove("has-error");
        }
        var err = wrap.querySelector(".field-error");
        if (err) err.hidden = true;
      }
    });
  }

  // ------------------------------------------------------------
  // LocalStorage Draft Management
  // ------------------------------------------------------------
  function serializeFormData() {
    var data = {
      textInputs: {},
      radios: {},
      checkboxes: {},
      selects: {},
      currentStep: currentStep
    };

    // Text & Email inputs, textareas
    var texts = form.querySelectorAll('input[type="text"], input[type="email"], textarea');
    texts.forEach(function (t) {
      if (t.id) data.textInputs[t.id] = t.value;
    });

    // Selects
    var selects = form.querySelectorAll("select");
    selects.forEach(function (s) {
      if (s.id) data.selects[s.id] = s.value;
    });

    // Radios
    var radios = form.querySelectorAll('input[type="radio"]:checked');
    radios.forEach(function (r) {
      data.radios[r.name] = r.value;
    });

    // Checkboxes
    var checks = form.querySelectorAll('input[type="checkbox"]');
    checks.forEach(function (c) {
      if (c.id) data.checkboxes[c.id] = c.checked;
    });

    return data;
  }

  function saveDraft() {
    try {
      var data = serializeFormData();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      // LocalStorage might be disabled or full
    }
  }

  function restoreDraft() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      var data = JSON.parse(saved);

      if (data.textInputs) {
        Object.keys(data.textInputs).forEach(function (id) {
          var el = document.getElementById(id);
          if (el) el.value = data.textInputs[id];
        });
      }

      if (data.selects) {
        Object.keys(data.selects).forEach(function (id) {
          var el = document.getElementById(id);
          if (el) el.value = data.selects[id];
        });
      }

      if (data.radios) {
        Object.keys(data.radios).forEach(function (name) {
          var val = data.radios[name];
          var r = form.querySelector('input[type="radio"][name="' + CSS.escape(name) + '"][value="' + CSS.escape(val) + '"]');
          if (r) r.checked = true;
        });
      }

      if (data.checkboxes) {
        Object.keys(data.checkboxes).forEach(function (id) {
          var el = document.getElementById(id);
          if (el) el.checked = !!data.checkboxes[id];
        });
      }

      // Update story char counter if story restored
      if (storyTextarea && storyCharCount) {
        storyCharCount.textContent = storyTextarea.value.length;
      }

      updateOtherVisibility();

      if (data.currentStep && data.currentStep >= 1 && data.currentStep <= 3) {
        goToStep(data.currentStep);
      }
    } catch (e) {
      // Ignore corrupted draft
    }
  }

  function clearDraft() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
  }

  // ------------------------------------------------------------
  // Toast Notification
  // ------------------------------------------------------------
  var toastTimer = null;
  function showToast(message) {
    if (!toastElem) return;
    if (toastTimer) clearTimeout(toastTimer);

    toastElem.hidden = false;
    toastElem.classList.remove("is-fading");

    toastTimer = setTimeout(function () {
      toastElem.classList.add("is-fading");
      setTimeout(function () {
        toastElem.hidden = true;
        toastElem.classList.remove("is-fading");
      }, 400);
    }, 4000);
  }

  // ------------------------------------------------------------
  // Form Submission
  // ------------------------------------------------------------
  async function handleSubmit(e) {
    e.preventDefault();

    if (!validateStep(3)) {
      return;
    }

    if (!window.ZDODA_FORM_MAP || !window.ZDODA_FORM_MAP.FIELDS) {
      console.error("ZDODA_FORM_MAP missing!");
      return;
    }

    var FIELDS = window.ZDODA_FORM_MAP.FIELDS;
    var params = new URLSearchParams();

    // 1. Full name
    var fullName = document.getElementById("field-fullname").value.trim();
    if (fullName) params.append(FIELDS["Full name"], fullName);

    // 2. Work email
    var email = document.getElementById("field-email").value.trim();
    if (email) params.append(FIELDS["Work email"], email);

    // 3. Company name
    var company = document.getElementById("field-company").value.trim();
    if (company) params.append(FIELDS["Company name"], company);

    // 4. Website (optional)
    var website = document.getElementById("field-website").value.trim();
    if (website) params.append(FIELDS["Website"], website);

    // 5. Industry (pick one + Other)
    var indRadio = form.querySelector('input[name="Industry"]:checked');
    if (indRadio) {
      if (indRadio.value === "__other_option__") {
        var indOther = document.getElementById("industry-other-text").value.trim();
        params.append(FIELDS["Industry"], "__other_option__");
        params.append(FIELDS["Industry"] + ".other_option_response", indOther);
      } else {
        params.append(FIELDS["Industry"], indRadio.value);
      }
    }

    // 6. Your role (pick one + Other, optional)
    var roleRadio = form.querySelector('input[name="Your role"]:checked');
    if (roleRadio) {
      if (roleRadio.value === "__other_option__") {
        var roleOther = document.getElementById("role-other-text").value.trim();
        params.append(FIELDS["Your role"], "__other_option__");
        params.append(FIELDS["Your role"] + ".other_option_response", roleOther);
      } else {
        params.append(FIELDS["Your role"], roleRadio.value);
      }
    }

    // 7. Country
    var country = document.getElementById("field-country").value.trim();
    if (country) params.append(FIELDS["Country"], country);

    // 8. Team size (optional)
    var teamSize = document.getElementById("field-teamsize").value;
    if (teamSize) params.append(FIELDS["Team size"], teamSize);

    // 9. Which chatbot do you use? (pick one + Other)
    var botRadio = form.querySelector('input[name="Which chatbot do you use?"]:checked');
    if (botRadio) {
      if (botRadio.value === "__other_option__") {
        var botOther = document.getElementById("chatbot-other-text").value.trim();
        params.append(FIELDS["Which chatbot do you use?"], "__other_option__");
        params.append(FIELDS["Which chatbot do you use?"] + ".other_option_response", botOther);
      } else {
        params.append(FIELDS["Which chatbot do you use?"], botRadio.value);
      }
    }

    // 10. How long have you used it? (pick one, optional)
    var durRadio = form.querySelector('input[name="How long have you used it?"]:checked');
    if (durRadio) params.append(FIELDS["How long have you used it?"], durRadio.value);

    // 11. Where does it talk to customers? (pick many, optional)
    var channelChecks = form.querySelectorAll('input[name="Where does it talk to customers?"]:checked');
    channelChecks.forEach(function (chk) {
      params.append(FIELDS["Where does it talk to customers?"], chk.value);
    });

    // 12. Chats per month (optional)
    var chats = document.getElementById("field-chatspermonth").value;
    if (chats) params.append(FIELDS["Chats per month"], chats);

    // 13. Monthly spend on your chatbot (optional)
    var spend = document.getElementById("field-monthlyspend").value;
    if (spend) params.append(FIELDS["Monthly spend on your chatbot"], spend);

    // 14. How happy are you with it? (Scale 1 to 5)
    var scaleRadio = form.querySelector('input[name="How happy are you with it?"]:checked');
    if (scaleRadio) params.append(FIELDS["How happy are you with it?"], scaleRadio.value);

    // 15. Which problems do you face? (pick many + Other)
    var problemChecks = form.querySelectorAll('input[name="Which problems do you face?"]:checked');
    problemChecks.forEach(function (chk) {
      if (chk.value === "__other_option__") {
        var probOther = document.getElementById("problems-other-text").value.trim();
        params.append(FIELDS["Which problems do you face?"], "__other_option__");
        params.append(FIELDS["Which problems do you face?"] + ".other_option_response", probOther);
      } else {
        params.append(FIELDS["Which problems do you face?"], chk.value);
      }
    });

    // 16. Which ONE problem hurts your business most? (pick one + Other)
    var mainProbRadio = form.querySelector('input[name="Which ONE problem hurts your business most?"]:checked');
    if (mainProbRadio) {
      if (mainProbRadio.value === "__other_option__") {
        var mainOther = document.getElementById("mainproblem-other-text").value.trim();
        params.append(FIELDS["Which ONE problem hurts your business most?"], "__other_option__");
        params.append(FIELDS["Which ONE problem hurts your business most?"] + ".other_option_response", mainOther);
      } else {
        params.append(FIELDS["Which ONE problem hurts your business most?"], mainProbRadio.value);
      }
    }

    // 17. Tell us about a time it let you or a customer down (optional)
    var story = document.getElementById("field-story").value.trim();
    if (story) params.append(FIELDS["Tell us about a time it let you or a customer down"], story);

    // 18. What do you wish your chatbot could do? (pick many, optional)
    var wishChecks = form.querySelectorAll('input[name="What do you wish your chatbot could do?"]:checked');
    wishChecks.forEach(function (chk) {
      params.append(FIELDS["What do you wish your chatbot could do?"], chk.value);
    });

    // 19. If a tool fixed your biggest problem, would you switch? (optional)
    var switchRadio = form.querySelector('input[name="If a tool fixed your biggest problem, would you switch?"]:checked');
    if (switchRadio) params.append(FIELDS["If a tool fixed your biggest problem, would you switch?"], switchRadio.value);

    // 20. Can we follow up with you? (optional)
    var followRadio = form.querySelector('input[name="Can we follow up with you?"]:checked');
    var followChoice = followRadio ? followRadio.value : "";
    if (followRadio) params.append(FIELDS["Can we follow up with you?"], followChoice);

    // 21. Consent (required)
    var consentCheck = document.getElementById("field-consent");
    if (consentCheck && consentCheck.checked) {
      params.append(FIELDS["Consent"], consentCheck.value);
    }

    // pageHistory (required for multi-section Google Forms)
    params.append("pageHistory", window.ZDODA_FORM_MAP.PAGE_HISTORY);

    // Disable button and show sending state
    submitBtn.disabled = true;
    var originalBtnContent = submitBtn.innerHTML;
    submitBtn.textContent = "Sending…";
    if (submitErrorElem) submitErrorElem.hidden = true;

    try {
      await fetch(window.ZDODA_FORM_MAP.FORM_RESPONSE_URL, {
        method: "POST",
        mode: "no-cors",
        body: params
      });

      // Clear draft after successful response
      clearDraft();

      // Show toast
      showToast();

      // Replace card with compact thank-you card
      renderThankYouCard(fullName, followChoice);
    } catch (err) {
      console.error("Form submission failed:", err);
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnContent;
      if (submitErrorElem) {
        submitErrorElem.textContent = "We couldn't send your answers. Please check your internet connection and try again.";
        submitErrorElem.hidden = false;
      }
    }
  }

  // ------------------------------------------------------------
  // Thank-You Card Render
  // ------------------------------------------------------------
  function renderThankYouCard(fullName, followChoice) {
    var firstName = (fullName || "").trim().split(/\s+/)[0] || "there";
    // Sanitize first name to prevent HTML injection
    var safeName = document.createElement("span");
    safeName.textContent = firstName;

    var wantsCall = followChoice === "Yes, book a free 15-minute call";

    var bookingBtnHtml = wantsCall
      ? '<a class="btn" href="https://api.hiighvance.com/widget/booking/vxtaxXPdV2kUDIMu357k" target="_blank" rel="noopener">Book your free call</a>'
      : '';

    card.innerHTML =
      '<div class="thank-you-card" id="thank-you-card">' +
        '<div class="thank-you-icon" aria-hidden="true">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="32" height="32">' +
            '<polyline points="20 6 9 17 4 12"></polyline>' +
          '</svg>' +
        '</div>' +
        '<h2 class="thank-you-heading">Thank you, ' + safeName.innerHTML + '!</h2>' +
        '<p class="thank-you-desc">Your answers help us build a chatbot that actually works. We\'ll be in touch soon.</p>' +
        '<div class="thank-you-actions">' +
          bookingBtnHtml +
          '<a class="btn ghost" href="https://www.zdoda.com" target="_blank" rel="noopener">Visit zdoda.com</a>' +
        '</div>' +
      '</div>';

    scrollSurveyToTop();
  }

  // ------------------------------------------------------------
  // Event Listeners Initialization
  // ------------------------------------------------------------

  // Step "Next" Buttons
  var nextButtons = form.querySelectorAll("[data-step-next]");
  nextButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var nextStep = parseInt(btn.getAttribute("data-step-next"), 10);
      var fromStep = nextStep - 1;
      if (validateStep(fromStep)) {
        goToStep(nextStep);
      }
    });
  });

  // Step "Back" Buttons
  var backButtons = form.querySelectorAll("[data-step-back]");
  backButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var backStep = parseInt(btn.getAttribute("data-step-back"), 10);
      goToStep(backStep);
    });
  });

  // Radio & Checkbox change handler (updates Other inputs, removes inline errors, saves draft)
  form.addEventListener("change", function (e) {
    var target = e.target;
    if (target.name === "Industry") {
      clearError(null, "error-industry");
    } else if (target.name === "Which chatbot do you use?") {
      clearError(null, "error-chatbot");
    } else if (target.name === "How happy are you with it?") {
      clearError(null, "error-satisfaction");
    } else if (target.name === "Which problems do you face?") {
      clearError(null, "error-problems");
    } else if (target.name === "Which ONE problem hurts your business most?") {
      clearError(null, "error-mainproblem");
    } else if (target.id === "field-consent") {
      clearError("field-consent", "error-consent");
    }

    updateOtherVisibility();
    saveDraft();
  });

  // Input event handler (text inputs, counter, error clearing, saves draft)
  form.addEventListener("input", function (e) {
    var target = e.target;
    if (target.id) {
      target.classList.remove("has-error");
      var directError = document.getElementById("error-" + target.id.replace("field-", ""));
      if (directError) directError.hidden = true;
    }

    if (target === storyTextarea && storyCharCount) {
      storyCharCount.textContent = storyTextarea.value.length;
    }

    saveDraft();
  });

  // Form Submit
  form.addEventListener("submit", handleSubmit);

  // Initialize
  restoreDraft();
})();
