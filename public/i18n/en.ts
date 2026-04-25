import { Locale } from './locale.type';

export const englishLocal: Locale = {
  lang: 'en',
  data: {
    pages: {
      external: {
        login: {
          stepOne: {
            login: 'Log in',
            loginText:
              'Please log in to access your account and explore our platform',
            form: {
              email: 'Email',
              username: 'Username',
              password: 'Password',
              rememberMe: 'Remember me',
              forgotPassword: 'Forgot Password?',
              forgotPasswordSuccess:
                'An email has been sent to your email address successfully.',
              forgotPasswordFailed:
                'An error has occurred while sending the email.',
              login: 'Login',
              validations: {
                invalidEmail: 'Please enter a valid email address.',
              },
            },
            messages: {
              success: 'A verification code has been sent to your email.',
              failed: 'An error has occurred while verifying your account',
              timeout: 'Log in request has timed out, please try again later.',
            },
          },
          stepTwo: {
            resendOtp: {
              title: 'Resend OTP',
              messages: {
                success: 'OTP has been resent successfully.',
                failed: 'An error has occurred while resending the OTP.',
                timeout: 'OTP resend has timed out, please try again later.',
              },
            },
            messages: {
              success: 'You have successfully logged in.',
              failed: 'An error has occurred while verifying your account.',
              timeout:
                'OTP verification has timed out, please try again later.',
            },
          },
        },
        validations: {
          uppercaseError: 'At least one upper case English letter.',
          lowercaseError: 'At least one lower case English letter.',
          digitsError: 'At least one digit.',
          specialCharacterError: 'At least one special character.',
          minimumLengthError: 'Minimum eight in length.',
          invalidEquality:
            'Invalid password confirmation. Please ensure that your password confirmation matches the password you entered.',
        },
      },
      home: {
        title: 'Home Page',
        headerDescription: 'Welcome to the home page of the application.',
        description: 'This is the main page where you can find various features.',
      },
      profile: {
        title: 'Profile',
      },
      dashboard: {
        title: 'Dashboard',
        headerDescription: 'Welcome to your dashboard',
        description: 'Here you can view important information and statistics.',
        profile: {
          viewProfile: 'Profile',
        },
        mosque: {
          title: 'Mosque Information',
          capacity: '{{capacity}} worshippers',
        },
      },
      previousSermons: {
        title: 'My Previous Sermons',
        headerDescription: 'Review your past sermons',
        description: 'This page contains your previously saved sermons.',
      },
      savedSermons: {
        title: 'Saved Sermons',
        headerDescription: 'Your saved and stored sermons',
        description: 'Access all your saved and stored sermons on the platform.',
      },
      settings: {
        title: 'Settings & Preferences',
        headerDescription: 'Manage your personal settings',
        description: 'You can customize your settings and preferences from this page.',
      },
      help: {
        title: 'Help',
        headerDescription: 'Help and support center',
        description: 'Get help and technical support from here.',
      },
      layout: {
        header: {
          notifications: 'Notifications',
          about: 'About the application',
          language: {
            en: 'English',
            ar: 'عربي',
          },
          userControlPanel: {
            userProfile: 'My Profile',
            logout: 'Logout',
          },
        },
        sidenav: {
          preachingCard: {
            title: 'My Preaching Card',
            mosques: 'Mosques',
            sermons: 'Previous Sermons',
            listeners: 'Weekly Listeners',
          },
        },
      },
      notFound: {
        title: 'Page not found',
        description: 'Sorry, the page you are looking for does not exist.',
        goToHome: 'Go to Home',
      },
    },
    messages: {
      success: {
        title: 'Success',
        desc: 'Operation has been completed successfully!',
      },
      warning: {
        title: 'Warning!',
        desc: '',
      },
      failed: {
        title: 'Error',
        desc: 'An error occurred.',
      },
      note: {
        dismiss: 'Dismiss',
        info: 'Information',
        warning: 'Warning',
        error: 'Error',
      },
    },
    shared: {
      validation: {
        required: 'This field is required.',
        minDigitsLength: 'The minimum digits length allowed is {{minLength}}',
        maxDigitsLength: 'The maximum digits length allowed is {{maxLength}}',
        minLength: 'The minimum length allowed is {{minLength}}',
        maxLength: 'The maximum length allowed is {{maxLength}}',
        invalidEmail: 'Please enter a valid email address.',
        notOnlySpaces: 'The field must not contain only spaces.',
        onlyTextWithoutNumbers: 'The field should not contain numbers.',
        arabicPattern: 'The filed must container arabic characters.',
        englishPattern: 'The filed must container english characters.',
        passwordComplexityValidator:
          'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
        digitsOnlyError: 'The field must contain only digits.',
        emailOrPhoneNumberError:
          'Please enter a valid email or phone number (starting with + or 00).',
        minAge:
          'Age must be greater than {{requiredAge}} years, but is {{actualAge}} years.',
        passwordMismatchValidation:
          'New password and confirm password do not match.',
        invalidCurrentPassword: 'The current password is incorrect.',
      },
      search: 'Search',
      searchPlaceHolder: 'Search...',
      dialog: {
        confirm: 'Confirm',
        cancel: 'Cancel',
        close: 'Close',
        informative: {
          title: 'Attention',
        },
        warning: {
          title: 'Warning!',
          desc: 'Are you sure you want to complete this operation?',
        },
        deActivate: {
          description:
            'The changes will be canceled if you leave the page, are you sure you want to continue?',
        },
      },
      misc: {
        back: 'Back',
        preview: 'Preview',
        remove: 'Remove',
        edit: 'Edit',
        delete: 'Delete',
        cancel: 'Cancel',
        apply: 'Apply',
        clear: 'Clear',
        save: 'Save',
        next: 'Next',
        previous: 'Previous',
        reset: 'Reset fields',
        noResultsFound: 'No results found.',
        duplicate: 'Duplicate',
        copy: 'Copy',
        active: 'Active',
        inActive: 'Inactive',
        deleted: 'Deleted',
        create: 'Create',
        selectAllMatchingResults: 'Select All',
        selectVisibleResults: 'Select Visible',
        add: 'Add',
        timeoutError: 'Request has timed out, please try again later.',
        activate: 'Activate',
        deactivate: 'Deactivate',
        details: 'Details',
        male: 'Male',
        female: 'Female',
        download: 'Download',
        upload: 'Upload',
        clickHere: 'Click here',
      },
      grid: {
        actions: 'Actions',
        edit: 'Edit',
        delete: 'Delete',
        view: 'View',
        more: 'More',
        noDataFound: 'No Data Found.',
        status: 'Status',
      },
      placeholder: {
        selectFromList: 'Select from list',
      },
    },
    paginator: {
      itemsPerPage: 'Items per page',
      nextPage: 'Next Page',
      previousPage: 'Previous Page',
      range: '{{startIndex}} - {{endIndex}} out of {{length}}',
    },
  },
};
