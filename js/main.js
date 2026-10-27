// Loads the Google Form into the survey section once a real link is set in js/config.js.
(function () {
  var url = (window.ZDODA_CONFIG && window.ZDODA_CONFIG.FORM_EMBED_URL) || "";
  if (!/^https:\/\/docs\.google\.com\/forms\//.test(url)) return;

  // Make sure the link is the embeddable version.
  if (!/[?&]embedded=true/.test(url)) {
    url += (url.indexOf("?") > -1 ? "&" : "?") + "embedded=true";
  }

  var card = document.getElementById("survey-card");
  var iframe = document.createElement("iframe");
  iframe.src = url;
  iframe.title = "Zdoda chatbot survey";
  iframe.loading = "lazy";
  card.innerHTML = "";
  card.appendChild(iframe);

  var link = document.getElementById("survey-link");
  link.href = url.replace(/[?&]embedded=true/, "");
  document.getElementById("survey-alt").hidden = false;
})();
