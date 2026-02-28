import type { SiteLocale } from '@/utilities/locales'

type FrontendMessages = {
  searchTitle: string
  searchNoResults: string
  searchLabel: string
  searchPlaceholder: string
  searchSubmit: string
  postsTitle: string
  metadataSearchTitle: string
  metadataPostsTitle: string
  metadataPostsPageTitle: string
  notFoundMessage: string
  goHome: string
  pageRangeNoResults: string
  pageRangeShowing: string
  docsPlural: string
  docsSingular: string
  postsPlural: string
  postsSingular: string
  paginationAriaLabel: string
  paginationPrevAria: string
  paginationNextAria: string
  paginationPrev: string
  paginationNext: string
  paginationMore: string
  cardNoImage: string
  untitledCategory: string
  formInternalServerError: string
  formSomethingWrong: string
  formLoadingPleaseWait: string
  formFieldRequired: string
  formRequiredLabel: string
  copy: string
  copied: string
  logoAlt: string
  signIn: string
  profile: string
  signOut: string
  menuOpen: string
  menuClose: string
  loginTitle: string
  loginContinueTo: string
  loginEmail: string
  loginPassword: string
  loginSubmit: string
  loginSubmitting: string
  loginOr: string
  loginGoogle: string
  loginNoAccount: string
  loginRegister: string
  loginErrorGeneric: string
  registerTitle: string
  registerName: string
  registerEmail: string
  registerPassword: string
  registerSubmit: string
  registerSubmitting: string
  registerOr: string
  registerGoogle: string
  registerHasAccount: string
  registerLogin: string
  registerErrorGeneric: string
  registerErrorEmailTaken: string
  registerPasswordHint: string
  profileTitle: string
  profileEmail: string
  profileRole: string
  profileJoined: string
  profileSignOut: string
  profileRoleAdmin: string
  profileRoleLearner: string
}

const frontendMessages: Record<SiteLocale, FrontendMessages> = {
  uk: {
    searchTitle: 'Пошук',
    searchNoResults: 'Нічого не знайдено.',
    searchLabel: 'Пошук',
    searchPlaceholder: 'Що ви хочете вивчити?',
    searchSubmit: 'Надіслати',
    postsTitle: 'Публікації',
    metadataSearchTitle: 'Пошук',
    metadataPostsTitle: 'Публікації',
    metadataPostsPageTitle: 'Сторінка публікацій',
    notFoundMessage: 'Цю сторінку не знайдено.',
    goHome: 'На головну',
    pageRangeNoResults: 'Пошук не дав результатів.',
    pageRangeShowing: 'Показано',
    docsPlural: 'Документів',
    docsSingular: 'Документ',
    postsPlural: 'Публікацій',
    postsSingular: 'Публікація',
    paginationAriaLabel: 'навігація сторінками',
    paginationPrevAria: 'Перейти на попередню сторінку',
    paginationNextAria: 'Перейти на наступну сторінку',
    paginationPrev: 'Попередня',
    paginationNext: 'Наступна',
    paginationMore: 'Більше сторінок',
    cardNoImage: 'Немає зображення',
    untitledCategory: 'Категорія без назви',
    formInternalServerError: 'Внутрішня помилка сервера',
    formSomethingWrong: 'Щось пішло не так.',
    formLoadingPleaseWait: 'Завантаження, зачекайте...',
    formFieldRequired: "Це поле є обов'язковим",
    formRequiredLabel: "(обов'язково)",
    copy: 'Копіювати',
    copied: 'Скопійовано!',
    logoAlt: 'Логотип Залізна Зміна',
    signIn: 'Увійти',
    profile: 'Профіль',
    signOut: 'Вийти',
    menuOpen: 'Відкрити меню',
    menuClose: 'Закрити меню',
    loginTitle: 'Увійти',
    loginContinueTo: 'Увійдіть, щоб продовжити',
    loginEmail: 'Електронна пошта',
    loginPassword: 'Пароль',
    loginSubmit: 'Увійти',
    loginSubmitting: 'Входимо…',
    loginOr: 'або',
    loginGoogle: 'Увійти через Google',
    loginNoAccount: 'Немає акаунту?',
    loginRegister: 'Зареєструватися',
    loginErrorGeneric: 'Не вдалося увійти. Перевірте дані та спробуйте ще раз.',
    registerTitle: 'Реєстрація',
    registerName: "Ім'я",
    registerEmail: 'Електронна пошта',
    registerPassword: 'Пароль',
    registerSubmit: 'Зареєструватися',
    registerSubmitting: 'Реєструємо…',
    registerOr: 'або',
    registerGoogle: 'Зареєструватися через Google',
    registerHasAccount: 'Вже є акаунт?',
    registerLogin: 'Увійти',
    registerErrorGeneric: 'Не вдалося зареєструватися. Спробуйте ще раз.',
    registerErrorEmailTaken: 'Ця електронна пошта вже зайнята.',
    registerPasswordHint: 'Мінімум 8 символів',
    profileTitle: 'Профіль',
    profileEmail: 'Електронна пошта',
    profileRole: 'Роль',
    profileJoined: 'Дата реєстрації',
    profileSignOut: 'Вийти з акаунту',
    profileRoleAdmin: 'Адміністратор',
    profileRoleLearner: 'Учень',
  },
  en: {
    searchTitle: 'Search',
    searchNoResults: 'No results found.',
    searchLabel: 'Search',
    searchPlaceholder: 'What do you want to learn?',
    searchSubmit: 'Submit',
    postsTitle: 'Posts',
    metadataSearchTitle: 'Search',
    metadataPostsTitle: 'Posts',
    metadataPostsPageTitle: 'Posts page',
    notFoundMessage: 'This page could not be found.',
    goHome: 'Go home',
    pageRangeNoResults: 'Search produced no results.',
    pageRangeShowing: 'Showing',
    docsPlural: 'Docs',
    docsSingular: 'Doc',
    postsPlural: 'Posts',
    postsSingular: 'Post',
    paginationAriaLabel: 'pagination',
    paginationPrevAria: 'Go to previous page',
    paginationNextAria: 'Go to next page',
    paginationPrev: 'Previous',
    paginationNext: 'Next',
    paginationMore: 'More pages',
    cardNoImage: 'No image',
    untitledCategory: 'Untitled category',
    formInternalServerError: 'Internal Server Error',
    formSomethingWrong: 'Something went wrong.',
    formLoadingPleaseWait: 'Loading, please wait...',
    formFieldRequired: 'This field is required',
    formRequiredLabel: '(required)',
    copy: 'Copy',
    copied: 'Copied!',
    logoAlt: 'Iron Squad Logo',
    signIn: 'Sign in',
    profile: 'Profile',
    signOut: 'Sign out',
    menuOpen: 'Open menu',
    menuClose: 'Close menu',
    loginTitle: 'Log in',
    loginContinueTo: 'Log in to continue',
    loginEmail: 'Email',
    loginPassword: 'Password',
    loginSubmit: 'Log in',
    loginSubmitting: 'Logging in…',
    loginOr: 'or',
    loginGoogle: 'Sign in with Google',
    loginNoAccount: "Don't have an account?",
    loginRegister: 'Register',
    loginErrorGeneric: 'Could not sign in. Please check your credentials and try again.',
    registerTitle: 'Register',
    registerName: 'Name',
    registerEmail: 'Email',
    registerPassword: 'Password',
    registerSubmit: 'Register',
    registerSubmitting: 'Registering…',
    registerOr: 'or',
    registerGoogle: 'Sign up with Google',
    registerHasAccount: 'Already have an account?',
    registerLogin: 'Log in',
    registerErrorGeneric: 'Could not register. Please try again.',
    registerErrorEmailTaken: 'This email is already taken.',
    registerPasswordHint: 'Minimum 8 characters',
    profileTitle: 'Profile',
    profileEmail: 'Email',
    profileRole: 'Role',
    profileJoined: 'Joined',
    profileSignOut: 'Sign out',
    profileRoleAdmin: 'Admin',
    profileRoleLearner: 'Learner',
  },
}

export const getFrontendMessages = (locale: SiteLocale) => frontendMessages[locale]

export const getLocaleFromPathname = (pathname: string): SiteLocale => {
  if (pathname === '/en' || pathname.startsWith('/en/')) {
    return 'en'
  }

  return 'uk'
}

export const getFrontendMessagesFromPathname = (pathname: string) =>
  getFrontendMessages(getLocaleFromPathname(pathname))
