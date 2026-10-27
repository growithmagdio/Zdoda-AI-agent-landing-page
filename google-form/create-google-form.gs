/**
 * Zdoda Chatbot Survey — builds the Google Form + response Google Sheet in one run.
 *
 * How to use:
 * 1. Go to script.google.com → New project
 * 2. Delete the sample code, paste this whole file, click Save
 * 3. Select "createZdodaSurvey" in the toolbar → click Run → allow access
 * 4. Open "Execution log": copy the 4 links it prints
 */

function createZdodaSurvey() {
  const form = FormApp.create('Zdoda — AI Chatbot Problems Survey');
  form
    .setTitle('What\'s not working with your AI chatbot?')
    .setDescription(
      'Three short steps, about 3 minutes. We\'re building a better AI chatbot and voice assistant, ' +
      'and your answers decide what we fix first. Your answers stay private.'
    )
    .setProgressBar(true)
    .setAllowResponseEdits(false)
    .setLimitOneResponsePerUser(false)
    .setShowLinkToRespondAgain(false)
    .setConfirmationMessage(
      'Thank you! Your answers help us build a chatbot that actually works. We\'ll be in touch soon.\n\n' +
      'Want to talk now? Book your free 15-minute call: https://api.hiighvance.com/widget/booking/vxtaxXPdV2kUDIMu357k'
    );

  // ---------- Step 1 · About your business ----------
  form.addSectionHeaderItem().setTitle('Step 1 of 3 · About your business');

  form.addTextItem().setTitle('Full name').setRequired(true);

  form.addTextItem()
    .setTitle('Work email')
    .setRequired(true)
    .setValidation(FormApp.createTextValidation()
      .requireTextIsEmail()
      .setHelpText('Please enter a valid email address.')
      .build());

  form.addTextItem().setTitle('Company name').setRequired(true);

  form.addTextItem().setTitle('Website').setHelpText('e.g. www.yourstore.com');

  form.addMultipleChoiceItem()
    .setTitle('Industry')
    .setChoiceValues(['E-commerce', 'Healthcare / Clinic', 'Real estate', 'Education',
      'Restaurant / Hospitality', 'SaaS / Tech', 'Local services', 'Agency'])
    .showOtherOption(true)
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('Your role')
    .setChoiceValues(['Founder / Owner', 'Marketing', 'Customer support', 'Operations', 'Developer / IT'])
    .showOtherOption(true);

  form.addTextItem().setTitle('Country').setRequired(true);

  form.addListItem()
    .setTitle('Team size')
    .setChoiceValues(['1–10 people', '11–50 people', '51–200 people', '200+ people']);

  // ---------- Step 2 · Your chatbot today ----------
  form.addPageBreakItem()
    .setTitle('Step 2 of 3 · Your chatbot today')
    .setHelpText('No wrong answers. Pick the closest option.');

  form.addMultipleChoiceItem()
    .setTitle('Which chatbot do you use?')
    .setChoiceValues(['Intercom Fin', 'Tidio', 'Zendesk AI', 'Voiceflow', 'ManyChat', 'Botpress',
      'Custom ChatGPT bot', 'Built in-house'])
    .showOtherOption(true)
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('How long have you used it?')
    .setChoiceValues(['Under 3 months', '3–12 months', '1–2 years', '2+ years']);

  form.addCheckboxItem()
    .setTitle('Where does it talk to customers?')
    .setHelpText('Pick all that apply')
    .setChoiceValues(['Website', 'WhatsApp', 'Instagram / Facebook', 'Phone calls', 'Mobile app', 'Email']);

  form.addListItem()
    .setTitle('Chats per month')
    .setChoiceValues(['Under 500', '500–2,000', '2,000–10,000', '10,000+', 'Not sure']);

  form.addListItem()
    .setTitle('Monthly spend on your chatbot')
    .setChoiceValues(['Under $50', '$50–$200', '$200–$500', '$500+', 'Not sure']);

  form.addScaleItem()
    .setTitle('How happy are you with it?')
    .setBounds(1, 5)
    .setLabels('Very unhappy', 'Very happy')
    .setRequired(true);

  // ---------- Step 3 · Problems and needs ----------
  form.addPageBreakItem()
    .setTitle('Step 3 of 3 · Problems and needs')
    .setHelpText('This is the part we read most closely. Be as honest as you like.');

  const problems = [
    'Gives wrong or made-up answers',
    'Doesn\'t understand what customers mean',
    'Hard to update what it knows',
    'Can\'t connect to my tools (CRM, Shopify, calendar)',
    'Poor handoff to a human',
    'No phone or voice support',
    'Weak in other languages',
    'Pricing is high or unpredictable',
    'Looks generic, can\'t match my brand',
    'Slow replies',
    'Doesn\'t capture leads or book appointments',
    'Needs a developer to set up or change'
  ];

  form.addCheckboxItem()
    .setTitle('Which problems do you face?')
    .setHelpText('Pick all that apply')
    .setChoiceValues(problems)
    .showOtherOption(true)
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('Which ONE problem hurts your business most?')
    .setChoiceValues(problems)
    .showOtherOption(true)
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('Tell us about a time it let you or a customer down')
    .setHelpText('e.g. A customer asked about our return policy and the bot gave the wrong answer, so we lost the sale.');

  form.addCheckboxItem()
    .setTitle('What do you wish your chatbot could do?')
    .setHelpText('Pick all that apply')
    .setChoiceValues(['Answer phone calls', 'Reply on WhatsApp', 'Learn from my website automatically',
      'Book appointments', 'Track orders', 'Hand off to a human', 'Speak many languages',
      'Match my brand design', 'Lead and chat reports']);

  form.addMultipleChoiceItem()
    .setTitle('If a tool fixed your biggest problem, would you switch?')
    .setChoiceValues(['Yes, within a month', 'Yes, if the price is right', 'Maybe later', 'No']);

  form.addMultipleChoiceItem()
    .setTitle('Can we follow up with you?')
    .setChoiceValues(['Yes, book a free 15-minute call', 'Just give me free early access', 'No, thanks']);

  form.addCheckboxItem()
    .setTitle('Consent')
    .setChoiceValues(['I agree that Zdoda can store my answers and contact me about this survey.'])
    .setRequired(true);

  // ---------- Response sheet ----------
  const sheet = SpreadsheetApp.create('Zdoda Chatbot Survey — Responses');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, sheet.getId());

  // Newer Google accounts create forms unpublished; publish so people can answer.
  try { form.setPublished(true); } catch (e) { /* older accounts publish automatically */ }
  form.setAcceptingResponses(true);

  const publicUrl = form.getPublishedUrl();
  const embedUrl = publicUrl + (publicUrl.indexOf('?') > -1 ? '&' : '?') + 'embedded=true';

  Logger.log('FORM LINK (send to people):  ' + publicUrl);
  Logger.log('EMBED LINK (for the landing page):  ' + embedUrl);
  Logger.log('EDIT FORM:  ' + form.getEditUrl());
  Logger.log('RESPONSES SHEET:  ' + sheet.getUrl());
}
