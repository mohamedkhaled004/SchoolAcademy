// Utility functions to prevent autocomplete and autofill in password fields

export const preventAutocomplete = (element: HTMLInputElement) => {
  // Set all possible autocomplete prevention attributes
  const attributes = {
    'autocomplete': 'new-password',
    'data-lpignore': 'true',
    'data-form-type': 'other',
    'data-1p-ignore': 'true',
    'data-bwignore': 'true',
    'data-keeweb': 'false',
    'data-keepass': 'false',
    'data-roboform': 'false',
    'data-dashlane': 'false',
    'data-bitwarden': 'false',
    'data-nordpass': 'false',
    'data-1password': 'false',
    'data-lastpass': 'false',
    'spellcheck': 'false',
    'autocorrect': 'off',
    'autocapitalize': 'off'
  };

  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
};

export const temporarilyDisableAutofill = (element: HTMLInputElement) => {
  // Temporarily set readonly to prevent autofill
  element.setAttribute('readonly', 'true');
  
  // Remove readonly after a short delay
  setTimeout(() => {
    element.removeAttribute('readonly');
  }, 100);
};

export const setupPasswordField = (element: HTMLInputElement) => {
  preventAutocomplete(element);
  temporarilyDisableAutofill(element);
}; 