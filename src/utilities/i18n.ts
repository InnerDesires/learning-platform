import type { SiteLocale } from '@/utilities/locales'

type FrontendMessages = {
  searchTitle: string
  searchTypePost: string
  searchTypeCourse: string
  searchTypeCategory: string
  searchTypePage: string
  postsEyebrow: string
  coursesEyebrow: string
  coursesSub: string
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
  shareLabel: string
  shareCopyLink: string
  logoAlt: string
  projectName: string
  brandName1: string
  brandName2: string
  brandSub: string
  footerMission: string
  footerColPlatform: string
  footerColProject: string
  footerColContacts: string
  footerAbout: string
  footerCalendar: string
  footerPartners: string
  footerContact: string
  footerCertificates: string
  footerSearch: string
  footerRights: string
  signIn: string
  profile: string
  signOut: string
  menuOpen: string
  menuClose: string
  loginTitle: string
  loginContinueTo: string
  loginEmail: string
  loginPassword: string
  passwordShow: string
  passwordHide: string
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
  profileLevel: string
  profileToNextLevel: string
  profileStatsCourses: string
  profileStatsSteps: string
  profileStatsQuizzes: string
  profileMyCourses: string
  profileNoCourses: string
  profileAllCoursesDone: string
  profileCertificates: string
  profileRecentQuizzes: string
  profileBrowseCourses: string
  profileSettings: string
  profileViewPublic: string
  publicProfileCompleted: string
  publicProfileComments: string
  publicProfileCommentsMore: string
  publicProfileCommentReply: string
  settingsTitle: string
  settingsBack: string
  settingsNameSection: string
  settingsNameLabel: string
  settingsAvatarSection: string
  settingsAvatarChange: string
  settingsAvatarRemove: string
  settingsAvatarHint: string
  settingsAvatarErrorType: string
  settingsAvatarErrorSize: string
  settingsAboutSection: string
  settingsAboutLabel: string
  settingsAboutPlaceholder: string
  settingsSocialSection: string
  settingsSocialHint: string
  settingsSocialAdd: string
  settingsSocialRemove: string
  settingsSocialErrorUrl: string
  settingsPrivacySection: string
  settingsPrivacyHideComments: string
  settingsPrivacyHideCommentsHint: string
  settingsProvidersSection: string
  settingsProviderPassword: string
  settingsProviderConnected: string
  settingsProviderNotConnected: string
  settingsProviderConnect: string
  settingsProviderDisconnect: string
  settingsProviderLastMethod: string
  settingsProviderPasswordHint: string
  settingsPasswordSection: string
  settingsPasswordCurrent: string
  settingsPasswordNew: string
  settingsPasswordConfirm: string
  settingsPasswordChange: string
  settingsPasswordSet: string
  settingsPasswordSetHint: string
  settingsPasswordMismatch: string
  settingsPasswordWrongCurrent: string
  settingsPasswordChanged: string
  settingsSave: string
  settingsSaving: string
  settingsSaved: string
  settingsErrorGeneric: string
  coursesTitle: string
  coursesMetaTitle: string
  coursesAllCategories: string
  coursesResetFilter: string
  coursesPlural: string
  courseCategoryEyebrow: string
  courseCategoryMetaTitle: string
  courseCategoryEmpty: string
  courseSteps: string
  courseStepsCount: string
  courseStepsPlural: string
  courseEnrolledPlural: string
  courseEnroll: string
  courseStartLearning: string
  courseContinueLearning: string
  courseCompleted: string
  courseInProgress: string
  courseOverview: string
  courseLoginToEnroll: string
  stepComplete: string
  stepStartQuiz: string
  stepPrevious: string
  stepNext: string
  stepProgress: string
  stepOf: string
  stepSingular: string
  minutesShort: string
  stepRichText: string
  stepVideo: string
  stepFile: string
  stepDownloadFile: string
  stepOpenFile: string
  courseBackToCourses: string
  courseRewardLabel: string
  courseBackToOverview: string
  courseEnrolledCount: string
  courseCompletedCount: string
  courseReviewMaterials: string
  quizTitle: string
  quizDescription: string
  quizPassingScore: string
  quizAttemptWarning: string
  quizSubmit: string
  quizTryAgain: string
  quizBackToCourse: string
  quizPassed: string
  quizFailed: string
  quizScore: string
  quizCorrectAnswers: string
  quizAttemptNumber: string
  quizAttemptsUsed: string
  quizAttemptHistory: string
  quizTakeQuiz: string
  quizRetakeQuiz: string
  quizBestScore: string
  quizOf: string
  quizQuestion: string
  quizNoAttempts: string
  quizSelectAnswer: string
  quizNotAvailable: string
  quizCompleteStepsFirst: string
  commentsTitle: string
  likeLoginPrompt: string
  commentsEmpty: string
  commentsPlaceholder: string
  commentsSubmit: string
  commentsSubmitting: string
  commentsLoginToComment: string
  commentsReply: string
  commentsReplying: string
  commentsDelete: string
  commentsDeleteConfirm: string
  commentsShowReplies: string
  commentsHideReplies: string
  likesCount: string
  likeLiked: string
  likeNotLiked: string
  certificateDownload: string
  certificateTitle: string
  certificatePlatformName: string
  certificatePresented: string
  certificateFor: string
  certificateDateLabel: string
  certificateCertId: string
  certificatesPageTitle: string
  certificatesMetaTitle: string
  certificateNoCertificates: string
  certificateCompletedOn: string
  certificateVerifyLabel: string
  verifyPageTitle: string
  verifyMetaTitle: string
  verifyValid: string
  verifyValidDescription: string
  verifyRecipient: string
  verifyCourse: string
  verifyDate: string
  verifyCertId: string
  verifyInvalid: string
  verifyInvalidDescription: string
  verifyDownload: string
  verifyLandingTitle: string
  verifyLandingDescription: string
  verifyInputPlaceholder: string
  verifyInputSubmit: string
  otpTitle: string
  otpSentTo: string
  otpEnterCode: string
  otpVerify: string
  otpVerifying: string
  otpResend: string
  otpResendIn: string
  otpSeconds: string
  otpChangeEmail: string
  otpInvalid: string
  otpExpired: string
  otpTooManyAttempts: string
  otpSendError: string
  registerCreating: string
  loginForgotPassword: string
  forgotTitle: string
  forgotDescription: string
  forgotEmail: string
  forgotSubmit: string
  forgotSubmitting: string
  forgotBackToLogin: string
  forgotOtpTitle: string
  forgotOtpDescription: string
  forgotNewPassword: string
  forgotNewPasswordHint: string
  forgotReset: string
  forgotResetting: string
  forgotSuccess: string
  forgotErrorGeneric: string
}

const frontendMessages: Record<SiteLocale, FrontendMessages> = {
  uk: {
    searchTitle: 'Пошук',
    searchTypePost: 'Публікація',
    searchTypeCourse: 'Курс',
    searchTypeCategory: 'Категорія',
    searchTypePage: 'Сторінка',
    postsEyebrow: 'Блог проєкту',
    coursesEyebrow: 'Каталог',
    coursesSub: 'Обирай курс, проходь кроки, складай фінальний тест — збирай XP і отримуй сертифікат.',
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
    shareLabel: 'Поділитися',
    shareCopyLink: 'Копіювати лінк',
    copied: 'Скопійовано!',
    logoAlt: 'Логотип Залізна Зміна',
    projectName: 'Залізна Зміна. Платформа',
    brandName1: 'Залізна',
    brandName2: 'Зміна',
    brandSub: 'Платформа',
    footerMission:
      'Проєкт розвитку талановитої молоді України. За підтримки Укрзалізниці та фонду Говарда Баффетта.',
    footerColPlatform: 'Платформа',
    footerColProject: 'Проєкт',
    footerColContacts: 'Контакти',
    footerAbout: 'Про нас',
    footerCalendar: 'Календар',
    footerPartners: 'Партнери',
    footerContact: 'Контакти',
    footerCertificates: 'Сертифікати',
    footerSearch: 'Пошук',
    footerRights: '© 2022–2026 «Залізна Зміна». Всі права захищені.',
    signIn: 'Увійти',
    profile: 'Профіль',
    signOut: 'Вийти',
    menuOpen: 'Відкрити меню',
    menuClose: 'Закрити меню',
    loginTitle: 'Увійти',
    loginContinueTo: 'Увійдіть, щоб продовжити',
    loginEmail: 'Електронна пошта',
    loginPassword: 'Пароль',
    passwordShow: 'Показати пароль',
    passwordHide: 'Приховати пароль',
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
    profileLevel: 'Рівень',
    profileToNextLevel: 'До наступного рівня',
    profileStatsCourses: 'курс завершено|курси завершено|курсів завершено',
    profileStatsSteps: 'крок пройдено|кроки пройдено|кроків пройдено',
    profileStatsQuizzes: 'тест складено|тести складено|тестів складено',
    profileMyCourses: 'Мої курси',
    profileNoCourses: 'Ви ще не записані на жоден курс.',
    profileAllCoursesDone: 'Усі ваші курси завершено — час обрати новий!',
    profileCertificates: 'Сертифікати',
    profileRecentQuizzes: 'Останні спроби тестів',
    profileBrowseCourses: 'До курсів',
    profileSettings: 'Налаштування',
    profileViewPublic: 'Публічний профіль',
    publicProfileCompleted: 'Завершені курси',
    publicProfileComments: 'Останні коментарі',
    publicProfileCommentsMore: 'та ще %d коментар|та ще %d коментарі|та ще %d коментарів',
    publicProfileCommentReply: 'У відповідь на:',
    settingsTitle: 'Налаштування акаунту',
    settingsBack: 'До профілю',
    settingsNameSection: "Ім'я",
    settingsNameLabel: "Ім'я для відображення",
    settingsAvatarSection: 'Фото профілю',
    settingsAvatarChange: 'Змінити фото',
    settingsAvatarRemove: 'Видалити',
    settingsAvatarHint: 'JPG, PNG, WebP або GIF, до 5 МБ',
    settingsAvatarErrorType: 'Цей формат не підтримується. Оберіть JPG, PNG, WebP або GIF.',
    settingsAvatarErrorSize: 'Файл завеликий — максимум 5 МБ.',
    settingsAboutSection: 'Про мене',
    settingsAboutLabel: 'Кілька слів про себе',
    settingsAboutPlaceholder: 'Розкажіть, хто ви і чим захоплюєтеся…',
    settingsSocialSection: 'Соціальні мережі',
    settingsSocialHint: 'Додайте посилання на свої профілі.',
    settingsSocialAdd: 'Додати посилання',
    settingsSocialRemove: 'Прибрати',
    settingsSocialErrorUrl: 'Перевірте посилання — воно має починатися з https://',
    settingsPrivacySection: 'Приватність',
    settingsPrivacyHideComments: 'Приховувати мої коментарі в публічному профілі',
    settingsPrivacyHideCommentsHint:
      'Відвідувачі вашого профілю не бачитимуть залишених вами коментарів.',
    settingsProvidersSection: 'Способи входу',
    settingsProviderPassword: 'Електронна пошта і пароль',
    settingsProviderConnected: 'Підключено',
    settingsProviderNotConnected: 'Не підключено',
    settingsProviderConnect: 'Підключити',
    settingsProviderDisconnect: 'Відключити',
    settingsProviderLastMethod: 'Це єдиний спосіб входу — його не можна відключити.',
    settingsProviderPasswordHint: 'Щоб додати цей спосіб, встановіть пароль нижче.',
    settingsPasswordSection: 'Пароль',
    settingsPasswordCurrent: 'Поточний пароль',
    settingsPasswordNew: 'Новий пароль',
    settingsPasswordConfirm: 'Підтвердіть новий пароль',
    settingsPasswordChange: 'Змінити пароль',
    settingsPasswordSet: 'Встановити пароль',
    settingsPasswordSetHint:
      'Ви входите через Google. Встановіть пароль, щоб також входити з електронною поштою.',
    settingsPasswordMismatch: 'Паролі не збігаються.',
    settingsPasswordWrongCurrent: 'Неправильний поточний пароль.',
    settingsPasswordChanged: 'Пароль змінено.',
    settingsSave: 'Зберегти',
    settingsSaving: 'Збереження…',
    settingsSaved: 'Збережено',
    settingsErrorGeneric: 'Щось пішло не так. Спробуйте ще раз.',
    coursesTitle: 'Курси',
    coursesMetaTitle: 'Курси | Залізна Зміна',
    coursesAllCategories: 'Усі категорії',
    coursesResetFilter: 'Показати всі курси',
    coursesPlural: 'курс|курси|курсів',
    courseCategoryEyebrow: 'Категорія',
    courseCategoryMetaTitle: '{title} — Курси | Залізна Зміна',
    courseCategoryEmpty: 'У цій категорії поки немає курсів.',
    courseSteps: 'Кроки',
    courseStepsCount: 'кроків',
    courseStepsPlural: 'крок|кроки|кроків',
    courseEnrolledPlural: 'учень|учні|учнів',
    courseEnroll: 'Записатися на курс',
    courseStartLearning: 'Почати навчання',
    courseContinueLearning: 'Продовжити навчання',
    courseCompleted: 'Завершено',
    courseInProgress: 'Розпочато',
    courseOverview: 'Огляд курсу',
    courseLoginToEnroll: 'Увійдіть, щоб записатися на курс',
    stepComplete: 'Завершити',
    stepStartQuiz: 'Почати тест',
    stepPrevious: 'Назад',
    stepNext: 'Далі',
    stepProgress: 'Прогрес',
    stepOf: 'з',
    stepSingular: 'Крок',
    minutesShort: 'хв',
    stepRichText: 'Текст',
    stepVideo: 'Відео',
    stepFile: 'Файл',
    stepDownloadFile: 'Завантажити файл',
    stepOpenFile: 'Відкрити файл',
    courseBackToCourses: 'До курсів',
    courseRewardLabel: 'Нагорода',
    courseBackToOverview: 'До огляду курсу',
    courseEnrolledCount: 'учнів',
    courseCompletedCount: 'завершили',
    courseReviewMaterials: 'Переглянути матеріали',
    quizTitle: 'Фінальний тест',
    quizDescription: 'Опис тесту',
    quizPassingScore: 'Прохідний бал',
    quizAttemptWarning: 'Усі спроби записуються. Кількість спроб та результати зберігаються.',
    quizSubmit: 'Надіслати відповіді',
    quizTryAgain: 'Спробувати ще раз',
    quizBackToCourse: 'Повернутися до курсу',
    quizPassed: 'Тест складено',
    quizFailed: 'Тест не складено',
    quizScore: 'Результат',
    quizCorrectAnswers: 'Правильних відповідей',
    quizAttemptNumber: 'Спроба',
    quizAttemptsUsed: 'Спроб використано',
    quizAttemptHistory: 'Історія спроб',
    quizTakeQuiz: 'Пройти тест',
    quizRetakeQuiz: 'Перескласти тест',
    quizBestScore: 'Найкращий результат',
    quizOf: 'з',
    quizQuestion: 'Питання',
    quizNoAttempts: 'Ви ще не проходили цей тест',
    quizSelectAnswer: 'Оберіть відповідь',
    quizNotAvailable: 'Тест недоступний',
    quizCompleteStepsFirst: 'Завершіть усі кроки курсу, щоб отримати доступ до тесту',
    commentsTitle: 'Коментарі',
    likeLoginPrompt: 'Увійдіть, щоб вподобати',
    commentsEmpty: 'Поки що немає коментарів. Будьте першими!',
    commentsPlaceholder: 'Напишіть коментар…',
    commentsSubmit: 'Надіслати',
    commentsSubmitting: 'Надсилаємо…',
    commentsLoginToComment: 'Увійдіть, щоб залишити коментар',
    commentsReply: 'Відповісти',
    commentsReplying: 'Відповідь на',
    commentsDelete: 'Видалити',
    commentsDeleteConfirm: 'Ви впевнені, що хочете видалити цей коментар?',
    commentsShowReplies: 'Показати відповіді',
    commentsHideReplies: 'Сховати відповіді',
    likesCount: 'вподобань',
    likeLiked: 'Вам сподобалось',
    likeNotLiked: 'Вподобати',
    certificateDownload: 'Завантажити сертифікат',
    certificateTitle: 'Сертифікат про завершення',
    certificatePlatformName: 'Залізна Зміна',
    certificatePresented: 'Цей сертифікат підтверджує, що',
    certificateFor: 'успішно завершив(ла) курс',
    certificateDateLabel: 'Дата завершення',
    certificateCertId: 'Номер сертифікату',
    certificatesPageTitle: 'Мої сертифікати',
    certificatesMetaTitle: 'Мої сертифікати | Залізна Зміна',
    certificateNoCertificates:
      'У вас ще немає сертифікатів. Завершіть курс, щоб отримати сертифікат.',
    certificateCompletedOn: 'Завершено',
    certificateVerifyLabel: 'Перевірити',
    verifyPageTitle: 'Перевірка сертифікату',
    verifyMetaTitle: 'Перевірка сертифікату | Залізна Зміна',
    verifyValid: 'Сертифікат дійсний',
    verifyValidDescription: 'Цей сертифікат було видано платформою Залізна Зміна.',
    verifyRecipient: 'Отримувач',
    verifyCourse: 'Курс',
    verifyDate: 'Дата завершення',
    verifyCertId: 'Номер сертифікату',
    verifyInvalid: 'Сертифікат недійсний',
    verifyInvalidDescription:
      'Цей сертифікат не може бути підтверджений. Можливо, посилання є некоректним або було змінено.',
    verifyDownload: 'Завантажити сертифікат',
    verifyLandingTitle: 'Перевірити сертифікат',
    verifyLandingDescription:
      'Відскануйте QR-код на сертифікаті або вставте посилання для перевірки нижче.',
    verifyInputPlaceholder: 'Вставте посилання або код сертифікату',
    verifyInputSubmit: 'Перевірити',
    otpTitle: 'Підтвердження email',
    otpSentTo: 'Ми надіслали 6-значний код на',
    otpEnterCode: 'Введіть код підтвердження',
    otpVerify: 'Підтвердити',
    otpVerifying: 'Перевіряємо…',
    otpResend: 'Надіслати код повторно',
    otpResendIn: 'Надіслати повторно через',
    otpSeconds: 'с',
    otpChangeEmail: 'Змінити email',
    otpInvalid: 'Невірний код. Спробуйте ще раз.',
    otpExpired: 'Код прострочено. Надішліть новий.',
    otpTooManyAttempts: 'Забагато спроб. Надішліть новий код.',
    otpSendError: 'Не вдалося надіслати код. Спробуйте пізніше.',
    registerCreating: 'Створюємо акаунт…',
    loginForgotPassword: 'Забули пароль?',
    forgotTitle: 'Скидання пароля',
    forgotDescription: 'Введіть свою електронну пошту, і ми надішлемо код для скидання пароля.',
    forgotEmail: 'Електронна пошта',
    forgotSubmit: 'Надіслати код',
    forgotSubmitting: 'Надсилаємо…',
    forgotBackToLogin: 'Повернутися до входу',
    forgotOtpTitle: 'Введіть код і новий пароль',
    forgotOtpDescription: 'Ми надіслали код на',
    forgotNewPassword: 'Новий пароль',
    forgotNewPasswordHint: 'Мінімум 8 символів',
    forgotReset: 'Змінити пароль',
    forgotResetting: 'Зберігаємо…',
    forgotSuccess: 'Пароль змінено. Тепер ви можете увійти.',
    forgotErrorGeneric: 'Не вдалося скинути пароль. Перевірте код і спробуйте ще раз.',
  },
  en: {
    searchTitle: 'Search',
    searchTypePost: 'Post',
    searchTypeCourse: 'Course',
    searchTypeCategory: 'Category',
    searchTypePage: 'Page',
    postsEyebrow: 'Project blog',
    coursesEyebrow: 'Catalog',
    coursesSub: 'Pick a course, complete the steps, pass the final quiz — earn XP and get a certificate.',
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
    shareLabel: 'Share',
    shareCopyLink: 'Copy link',
    copied: 'Copied!',
    logoAlt: 'Iron Squad Logo',
    projectName: 'Iron Squad. Platform',
    brandName1: 'Iron',
    brandName2: 'Squad',
    brandSub: 'Platform',
    footerMission:
      'A development project for talented Ukrainian youth. Supported by Ukrzaliznytsia and the Howard G. Buffett Foundation.',
    footerColPlatform: 'Platform',
    footerColProject: 'Project',
    footerColContacts: 'Contacts',
    footerAbout: 'About us',
    footerCalendar: 'Calendar',
    footerPartners: 'Partners',
    footerContact: 'Contact',
    footerCertificates: 'Certificates',
    footerSearch: 'Search',
    footerRights: '© 2022–2026 "Iron Squad". All rights reserved.',
    signIn: 'Sign in',
    profile: 'Profile',
    signOut: 'Sign out',
    menuOpen: 'Open menu',
    menuClose: 'Close menu',
    loginTitle: 'Log in',
    loginContinueTo: 'Log in to continue',
    loginEmail: 'Email',
    loginPassword: 'Password',
    passwordShow: 'Show password',
    passwordHide: 'Hide password',
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
    profileLevel: 'Level',
    profileToNextLevel: 'To next level',
    profileStatsCourses: 'course completed|courses completed',
    profileStatsSteps: 'step completed|steps completed',
    profileStatsQuizzes: 'quiz passed|quizzes passed',
    profileMyCourses: 'My courses',
    profileNoCourses: 'You are not enrolled in any course yet.',
    profileAllCoursesDone: 'All your courses are completed — time to pick a new one!',
    profileCertificates: 'Certificates',
    profileRecentQuizzes: 'Recent quiz attempts',
    profileBrowseCourses: 'Browse courses',
    profileSettings: 'Settings',
    profileViewPublic: 'Public profile',
    publicProfileCompleted: 'Completed courses',
    publicProfileComments: 'Latest comments',
    publicProfileCommentsMore: 'and %d more comment|and %d more comments',
    publicProfileCommentReply: 'In reply to:',
    settingsTitle: 'Account settings',
    settingsBack: 'Back to profile',
    settingsNameSection: 'Name',
    settingsNameLabel: 'Display name',
    settingsAvatarSection: 'Profile photo',
    settingsAvatarChange: 'Change photo',
    settingsAvatarRemove: 'Remove',
    settingsAvatarHint: 'JPG, PNG, WebP or GIF, up to 5 MB',
    settingsAvatarErrorType: 'This format is not supported. Choose JPG, PNG, WebP or GIF.',
    settingsAvatarErrorSize: 'The file is too large — 5 MB max.',
    settingsAboutSection: 'About me',
    settingsAboutLabel: 'A few words about yourself',
    settingsAboutPlaceholder: 'Tell people who you are and what you love…',
    settingsSocialSection: 'Social links',
    settingsSocialHint: 'Add links to your profiles.',
    settingsSocialAdd: 'Add link',
    settingsSocialRemove: 'Remove',
    settingsSocialErrorUrl: 'Check the link — it must start with https://',
    settingsPrivacySection: 'Privacy',
    settingsPrivacyHideComments: 'Hide my comments on my public profile',
    settingsPrivacyHideCommentsHint: 'Visitors to your profile will not see comments you have left.',
    settingsProvidersSection: 'Sign-in methods',
    settingsProviderPassword: 'Email & password',
    settingsProviderConnected: 'Connected',
    settingsProviderNotConnected: 'Not connected',
    settingsProviderConnect: 'Connect',
    settingsProviderDisconnect: 'Disconnect',
    settingsProviderLastMethod: 'This is your only sign-in method — it cannot be disconnected.',
    settingsProviderPasswordHint: 'To add this method, set a password below.',
    settingsPasswordSection: 'Password',
    settingsPasswordCurrent: 'Current password',
    settingsPasswordNew: 'New password',
    settingsPasswordConfirm: 'Confirm new password',
    settingsPasswordChange: 'Change password',
    settingsPasswordSet: 'Set password',
    settingsPasswordSetHint:
      'You sign in with Google. Set a password to also sign in with your email.',
    settingsPasswordMismatch: 'Passwords do not match.',
    settingsPasswordWrongCurrent: 'The current password is incorrect.',
    settingsPasswordChanged: 'Password changed.',
    settingsSave: 'Save',
    settingsSaving: 'Saving…',
    settingsSaved: 'Saved',
    settingsErrorGeneric: 'Something went wrong. Please try again.',
    coursesTitle: 'Courses',
    coursesMetaTitle: 'Courses | Iron Squad',
    coursesAllCategories: 'All categories',
    coursesResetFilter: 'Show all courses',
    coursesPlural: 'course|courses',
    courseCategoryEyebrow: 'Category',
    courseCategoryMetaTitle: '{title} — Courses | Iron Squad',
    courseCategoryEmpty: 'No courses in this category yet.',
    courseSteps: 'Steps',
    courseStepsCount: 'steps',
    courseStepsPlural: 'step|steps',
    courseEnrolledPlural: 'learner|learners',
    courseEnroll: 'Enroll in course',
    courseStartLearning: 'Start learning',
    courseContinueLearning: 'Continue learning',
    courseCompleted: 'Completed',
    courseInProgress: 'In Progress',
    courseOverview: 'Course overview',
    courseLoginToEnroll: 'Log in to enroll in this course',
    stepComplete: 'Finish',
    stepStartQuiz: 'Start quiz',
    stepPrevious: 'Back',
    stepNext: 'Next',
    stepProgress: 'Progress',
    stepOf: 'of',
    stepSingular: 'Step',
    minutesShort: 'min',
    stepRichText: 'Text',
    stepVideo: 'Video',
    stepFile: 'File',
    stepDownloadFile: 'Download file',
    stepOpenFile: 'Open file',
    courseBackToCourses: 'Back to courses',
    courseRewardLabel: 'Reward',
    courseBackToOverview: 'Back to overview',
    courseEnrolledCount: 'enrolled',
    courseCompletedCount: 'completed',
    courseReviewMaterials: 'Review materials',
    quizTitle: 'Final Quiz',
    quizDescription: 'Quiz Description',
    quizPassingScore: 'Passing Score',
    quizAttemptWarning: 'All attempts are recorded. Your attempt count and scores will be stored.',
    quizSubmit: 'Submit Answers',
    quizTryAgain: 'Try Again',
    quizBackToCourse: 'Back to Course',
    quizPassed: 'Quiz Passed',
    quizFailed: 'Quiz Failed',
    quizScore: 'Score',
    quizCorrectAnswers: 'Correct Answers',
    quizAttemptNumber: 'Attempt',
    quizAttemptsUsed: 'Attempts used',
    quizAttemptHistory: 'Attempt History',
    quizTakeQuiz: 'Take Quiz',
    quizRetakeQuiz: 'Retake Quiz',
    quizBestScore: 'Best Score',
    quizOf: 'of',
    quizQuestion: 'Question',
    quizNoAttempts: "You haven't attempted this quiz yet",
    quizSelectAnswer: 'Select an answer',
    quizNotAvailable: 'Quiz not available',
    quizCompleteStepsFirst: 'Complete all course steps to access the quiz',
    commentsTitle: 'Comments',
    likeLoginPrompt: 'Sign in to like',
    commentsEmpty: 'No comments yet. Be the first!',
    commentsPlaceholder: 'Write a comment…',
    commentsSubmit: 'Submit',
    commentsSubmitting: 'Submitting…',
    commentsLoginToComment: 'Log in to leave a comment',
    commentsReply: 'Reply',
    commentsReplying: 'Replying to',
    commentsDelete: 'Delete',
    commentsDeleteConfirm: 'Are you sure you want to delete this comment?',
    commentsShowReplies: 'Show replies',
    commentsHideReplies: 'Hide replies',
    likesCount: 'likes',
    likeLiked: 'Liked',
    likeNotLiked: 'Like',
    certificateDownload: 'Download Certificate',
    certificateTitle: 'Certificate of Completion',
    certificatePlatformName: 'Iron Squad',
    certificatePresented: 'This certifies that',
    certificateFor: 'has successfully completed the course',
    certificateDateLabel: 'Date of Completion',
    certificateCertId: 'Certificate ID',
    certificatesPageTitle: 'My Certificates',
    certificatesMetaTitle: 'My Certificates | Iron Squad',
    certificateNoCertificates:
      "You don't have any certificates yet. Complete a course to earn one.",
    certificateCompletedOn: 'Completed on',
    certificateVerifyLabel: 'Verify',
    verifyPageTitle: 'Certificate Verification',
    verifyMetaTitle: 'Certificate Verification | Iron Squad',
    verifyValid: 'Certificate is valid',
    verifyValidDescription: 'This certificate was issued by the Iron Squad platform.',
    verifyRecipient: 'Recipient',
    verifyCourse: 'Course',
    verifyDate: 'Date of Completion',
    verifyCertId: 'Certificate ID',
    verifyInvalid: 'Certificate is invalid',
    verifyInvalidDescription:
      'This certificate could not be verified. The link may be incorrect or tampered with.',
    verifyDownload: 'Download Certificate',
    verifyLandingTitle: 'Verify a Certificate',
    verifyLandingDescription:
      'Scan the QR code on a certificate or paste the verification link below.',
    verifyInputPlaceholder: 'Paste a verification link or certificate code',
    verifyInputSubmit: 'Verify',
    otpTitle: 'Verify your email',
    otpSentTo: 'We sent a 6-digit code to',
    otpEnterCode: 'Enter verification code',
    otpVerify: 'Verify',
    otpVerifying: 'Verifying…',
    otpResend: 'Resend code',
    otpResendIn: 'Resend in',
    otpSeconds: 's',
    otpChangeEmail: 'Change email',
    otpInvalid: 'Invalid code. Please try again.',
    otpExpired: 'Code expired. Please request a new one.',
    otpTooManyAttempts: 'Too many attempts. Please request a new code.',
    otpSendError: 'Could not send code. Please try later.',
    registerCreating: 'Creating your account…',
    loginForgotPassword: 'Forgot password?',
    forgotTitle: 'Reset password',
    forgotDescription: 'Enter your email and we will send you a code to reset your password.',
    forgotEmail: 'Email',
    forgotSubmit: 'Send code',
    forgotSubmitting: 'Sending…',
    forgotBackToLogin: 'Back to log in',
    forgotOtpTitle: 'Enter the code and a new password',
    forgotOtpDescription: 'We sent a code to',
    forgotNewPassword: 'New password',
    forgotNewPasswordHint: 'Minimum 8 characters',
    forgotReset: 'Change password',
    forgotResetting: 'Saving…',
    forgotSuccess: 'Password changed. You can now log in.',
    forgotErrorGeneric: 'Could not reset password. Check the code and try again.',
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
