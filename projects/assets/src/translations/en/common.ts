/*
 * SPDX-FileCopyrightText: 2024 SAP Spartacus team <spartacus-team@sap.com>
 *
 * SPDX-License-Identifier: Apache-2.0
 */

export const common = {
  common: {
    cancel: 'Cancel',
    delete: 'Delete',
    remove: 'Remove',
    edit: 'Edit',
    restore: 'Restore',
    back: 'Back',
    submit: 'Submit',
    continue: 'Continue',
    save: 'Save',
    done: 'Done',
    home: 'Home',
    noData: 'No data.',
    confirm: 'Confirm',
    more: 'more',
    close: 'Close',
    loading: 'Loading',
    menu: 'Menu',
    reset: 'Reset',
    search: 'Search',
    add: 'Add',
    breadcrumbs: 'breadcrumbs',
    selectFile: 'Select file',
    clear: 'Clear',
    loaded: 'Loaded',
    results: 'Results',
    of: 'of',
  },
  pageMetaResolver: {
    category: {
      title: '{{count}} result for {{query}}',
      title_other: '{{count}} results for {{query}}',
    },
    checkout: {
      title: 'Checkout',
    },
    search: {
      title: '{{count}} result for "{{query}}"',
      title_other: '{{count}} results for "{{query}}"',
      findProductTitle: '{{count}} result for coupon "{{coupon}}"',
      findProductTitle_other: '{{count}} results for coupon "{{coupon}}"',
      default_title: 'All products',
    },
    product: {
      description: '{{description}}',
      heading: '{{heading}}',
      title: '{{title}}',
    },
  },
  spinner: {
    loading: 'Loading...',
  },
  navigation: {
    categoryNavLabel: 'Category menu',
    footerNavLabel: 'Footer links',
    navigateTo: 'Navigate to {{nav}}',
    scrollToTop: 'Scroll back to the top of the page',
  },
  searchBox: {
    placeholder: 'Enter product name or SKU',
    productSearch: 'Find a product',
    ariaLabelInput: 'Search here...',
    ariaLabelSuggestions: 'typing suggestions',
    ariaLabelProducts: 'product results',
    initialDescription:
      'When autocomplete results are available use up and down arrows to review and enter to select. Touch device users, explore by touch or with swipe gestures.',
    suggestionsResult: '{{ count }} suggestion and ',
    suggestionsResult_other: '{{ count }} suggestions and ',
    productsResult: '{{ count }} product is available.',
    productsResult_other: '{{ count }} products are available.',
    resetLabel: 'Reset Search',
    help: {
      insufficientChars: 'Please type more characters',
      noMatch: 'We could not find any results',
      exactMatch: '{{ term }}',
      empty: 'Ask us anything',
    },
  },
  sorting: {
    date: 'Date',
    orderNumber: 'Order Number',
    rma: 'Return Number',
    replenishmentNumber: 'Replenishment Number',
    nextOrderDate: 'Next Order Date',
    pageViewUpdated: 'Page view updated with your selected options.',
  },
  httpHandlers: {
    badRequest: {
      bad_credentials: '{{ errorMessage }}. Please login again.',
      user_is_disabled: '{{ errorMessage }}. Please contact administration.',
    },
    badGateway: 'A server error occurred. Please try again later.',
    badRequestPleaseLoginAgain: '{{ errorMessage }}. Please login again.',
    badRequestOldPasswordIncorrect: 'Old password incorrect.',
    badRequestGuestDuplicateEmail:
      '{{ errorMessage }} email already exist. Please checkout with a different email to register using a guest account.',
    conflict: 'Already exists.',
    forbidden:
      'You are not authorized to perform this action. Please contact your administrator if you think this is a mistake.',
    gatewayTimeout: 'The server did not respond, please try again later.',
    internalServerError:
      'An Internal Server Error occurred. Please try again later.',
    sessionExpired: 'Your session has expired. Please login again.',
    unknownError: 'An unknown error occurred',
    unauthorized: {
      common: 'An unknown authorization error occured',
      invalid_client: 'Bad client credentials',
    },
    validationErrors: {
      missing: {
        card_cardType:
          'The selected credit card is not supported. Please select another.',
        card_accountNumber: 'The credit card number entered is not valid.',
        card_cvNumber: 'The security code entered is not valid.',
        card_expirationMonth:
          'The credit card expiration date entered is not valid.',
        card_expirationYear:
          'The credit card expiration date entered is not valid.',
        billTo_firstName: 'The first name entered is not valid.',
        billTo_lastName: 'The last name entered is not valid.',
        billTo_street1: 'The address entered is not valid.',
        billTo_street2: 'The address entered is not valid.',
        billTo_city: 'The city entered is not valid for this credit card.',
        billTo_state:
          'The state/province entered is not valid for this credit card.',
        billTo_country:
          'The country/region entered is not valid for this credit card.',
        billTo_postalCode:
          'The zip/postal code is not valid for this credit card.',
        country: {
          isocode: 'Missing country/region',
        },
      },
      invalid: {
        card_expirationMonth:
          'The credit card expiration date entered is not valid.',
        firstName: 'First Name entered is not valid.',
        lastName: 'Last Name entered is not valid.',
        password: 'Password entered is not valid.',
        uid: 'UID is not valid.',
        code: 'Code is not valid.',
        email: 'Email is not valid.',
      },
    },
    cartNotFound: 'Cart not found.',
    invalidCodeProvided: 'Invalid code provided.',
    voucherExceeded:
      'This coupon has exceeded the number of times it can be used',
    unknownIdentifier: 'Item not found.',
    otherCartErrors: 'Cart errors occurred.',
  },
  miniCart: {
    item: '{{count}} item currently in your cart',
    item_other: '{{count}} items currently in your cart',
    total: '{{total}}',
    count: '{{count}}',
  },
  skipLink: {
    skipTo: 'Skip to',
    labels: {
      header: 'Header',
      main: 'Main Content',
      footer: 'Footer',
      productFacets: 'Product Facets',
      productList: 'Product List',
    },
  },
  carousel: {
    previousSlide: 'Previous slide',
    nextSlide: 'Next slide',
    slideNumber: 'Slide {{currentSlideNumber}}',
    carouselForProduct: 'Carousel, Images for {{product}}',
  },
  formErrors: {
    globalMessage: 'The form you are trying to submit contains errors.',
    required: 'This field is required',
    cxInvalidEmail: 'This is not a valid email format',
    cxInvalidPassword: 'This is not a valid password format',
    cxPasswordsMustMatch: 'Password fields must match',
    cxEmailsMustMatch: 'Email fields must match',
    cxStarRatingEmpty: 'Rating field is required',
    cxNoSelectedItemToCancel: 'Select at least one item',
    cxNegativeAmount: 'Amount must be equal or greater than zero',
    cxContainsSpecialCharacters: 'Field cannot contain special characters',
    date: {
      required: 'This field is required',
      min: 'Date cannot be before {{min}}',
      max: 'Date cannot be after {{max}}',
      pattern: 'Use dateformat yyyy-mm-dd',
      invalid: 'Use a valid date',
    },
    file: {
      required: 'File is required',
      empty: 'File should not be empty',
      invalidExtension: 'File extension is not valid',
      tooLarge: 'File size should not exceed {{ maxSize }} MB',
      tooManyEntries: 'The number of items is greater than {{ maxEntries }}',
      notParsable: 'File is not parsable',
      fileNotAllowed: 'This file type is not allowed',
    },
  },
  errorHandlers: {
    scriptFailedToLoad: 'Failed to load the script.',
    refreshThePage: 'Please refresh the page.',
  },
  assistiveMessage: {
    actionCancelled: 'Action cancelled, nothing changed',
  },
  passwordVisibility: {
    showPassword: 'Show password',
    hidePassword: 'Hide password',
  },
  generalErrors: {
    pageFailure: 'The page could not be loaded. Please try again later.',
  },
  chatMessaging: {
    charactersLeft: 'characters left: {{count}}',
    addNewMessage: 'Add New Message',
    send: 'Send',
    uploadFile: 'Upload File',
    informationLabel: '{{author}}. {{text}} at {{date}}',
    messages: 'Messages',
    addMessagePlaceHolder: 'Start Typing...',
    characterLimitAlert: 'Characters limit reached.',
  },
};
