import type { SiteLocale } from '@/utilities/locales'
import type { HomeCalendar } from '@/payload-types'

// Content sourced from ironsquad.org.ua (July 2026) — the platform is the
// online arm of the «Залізна Зміна» project and must stay in sync with the
// landing: stats, shifts calendar, partners, contacts.

export const APPLY_FORM_URL = 'https://forms.gle/z2QhrPRL1uSKYU79A'
export const LANDING_URL = 'https://www.ironsquad.org.ua'

type HomeContent = {
  hero: {
    kick: string
    title1: string
    title2: string
    subtitle: string
    cta: string
    ctaSecondary: string
    supportLabel: string
    supportName: string
    features: string[]
    mock: {
      course: string
      progress: string
      steps: string[]
      quiz: string
      certificate: string
    }
  }
  about: {
    tag: string
    title: string
    description: string
    description2: string
    goalsTitle: string
    goals: string[]
    support: string
    cta: string
  }
  platform: {
    tag: string
    title: string
    features: { title: string; text: string }[]
    statsTag: string
    statsTitle: string
    stats: { value: number; label: string }[]
  }
  partners: {
    tag: string
    title: string
    description: string
    items: { name: string; url: string; logo: string }[]
  }
  calendar: {
    tag: string
    title: string
    description: string
    events: {
      month: string
      year: string
      range: string
      title: string
      description: string
      formUrl: string
    }[]
    cta: string
  }
  contact: {
    tag: string
    title: string
    phone: string
    email: string
    address: string
    telegram: string
    telegramManager: string
    instagram: string
    facebook: string
    tiktok: string
    discord: string
    description: string
    detailsTitle: string
    socialsTitle: string
    write: string
    writeVia: { telegram: string; email: string; phone: string }
  }
  courses: {
    tag: string
    title: string
    description: string
    cta: string
  }
  news: {
    tag: string
    title: string
    description: string
    cta: string
  }
}

const content: Record<SiteLocale, HomeContent> = {
  uk: {
    hero: {
      kick: 'Освітня платформа «Залізної Зміни»',
      title1: 'Прокачуй',
      title2: 'свій потенціал',
      subtitle:
        'Відеоуроки, практичні матеріали та тести від команди «Залізної Зміни». Навчайся у своєму темпі, збирай XP, підіймайся в рейтингу та отримуй сертифікати.',
      cta: 'Обрати курс',
      ctaSecondary: 'Створити акаунт',
      supportLabel: 'За підтримки',
      supportName: 'УКРЗАЛІЗНИЦЯ',
      features: ['Відеоуроки', 'Тести', 'XP та рейтинг', 'Сертифікати'],
      mock: {
        course: 'Лідерство для підлітків',
        progress: '3 із 5 кроків',
        steps: ['Вступ до лідерства', 'Робота в команді', 'Публічний виступ'],
        quiz: 'Фінальний тест',
        certificate: 'Сертифікат',
      },
    },
    about: {
      tag: 'Про нас',
      title: 'Комʼюніті майбутнього покоління',
      description:
        '«Залізна зміна» — це унікальний навчальний проєкт підтримки талановитої молоді України, який формує комʼюніті майбутнього покоління. Ми обʼєднуємо талановитих, амбітних і небайдужих підлітків з усієї країни — тих, хто навіть в умовах війни не зупиняється, а шукає можливості розвиватися, діяти і впливати на майбутнє.',
      description2:
        'Тут народжуються ідеї, формуються команди, зʼявляються проєкти, які мають реальний вплив. Ми не просто працюємо з молоддю — ми інвестуємо в тих, хто вже сьогодні формує нову Україну.',
      goalsTitle: 'Наша мета — система, яка допомагає підліткам:',
      goals: [
        'розкрити свій потенціал',
        'знайти своє покликання',
        'сформувати лідерські якості',
        'навчитися працювати в команді',
        'і головне — повірити у власну силу',
      ],
      support:
        'Проєкт реалізується за підтримки АТ «Укрзалізниця» та міжнародних партнерів — Howard G. Buffett Foundation та Nova Ukraine.',
      cta: 'Дізнатися більше',
    },
    platform: {
      tag: 'Про платформу',
      title: 'Усе для навчання в одному місці',
      features: [
        { title: 'Відеоуроки', text: 'Короткі уроки та матеріали, які можна проходити у власному темпі.' },
        { title: 'Тести', text: 'Фінальний тест перевіряє засвоєне й відкриває сертифікат.' },
        { title: 'XP та рівні', text: 'За кожен крок і тест нараховується XP — навчання стає грою.' },
        { title: 'Рейтинг', text: 'Порівнюй свої результати з іншими учасниками в таблиці лідерів.' },
        { title: 'Сертифікати', text: 'Завершив курс — отримай сертифікат, який можна завантажити.' },
      ],
      statsTag: 'Наші досягнення',
      statsTitle: 'Проєкт у цифрах',
      stats: [
        { value: 9400, label: 'дітей у проєкті' },
        { value: 72, label: 'зміни проведено' },
        { value: 590, label: 'тренінгів і курсів' },
      ],
    },
    partners: {
      tag: 'Партнери',
      title: 'Нам довіряють',
      description:
        'Проєкт реалізується за підтримки АТ «Укрзалізниця» та міжнародних партнерів — Howard G. Buffett Foundation та Nova Ukraine. Нас підтримують провідні українські компанії та інституції.',
      items: [
        { name: 'Укрзалізниця', url: 'https://www.uz.gov.ua/', logo: '/partners/ukrzaliznytsia.png' },
        { name: 'Howard G. Buffett Foundation', url: 'https://www.thehowardgbuffettfoundation.org/', logo: '/partners/buffet-logo-w.png' },
        { name: 'Nova Ukraine', url: 'https://novaukraine.org/', logo: '/partners/nova-ukraine-logo-w.png' },
        { name: 'ФК Локомотив', url: 'https://www.facebook.com/fc.lokomotyv.ua/', logo: '/partners/loko-logo-w.png' },
        { name: 'Sense Bank', url: 'https://sensebank.ua/', logo: '/partners/sense-w.png' },
        { name: 'Ajax Systems', url: 'https://ajax.systems/ua/about/', logo: '/partners/ajax-logo-w.png' },
        { name: 'The Wall', url: 'https://www.thewall.lviv.ua/', logo: '/partners/thewall-logo-w.png' },
        { name: 'Українська академія лідерства', url: 'https://ual.ua/', logo: '/partners/ual.png' },
        { name: 'Суспільне', url: 'https://suspilne.media/', logo: '/partners/suspilne.png' },
        { name: 'Міністерство закордонних справ', url: 'https://mfa.gov.ua/', logo: '/partners/mfa.png' },
        { name: 'Міністерство внутрішніх справ', url: 'https://mvs.gov.ua/', logo: '/partners/mvs.png' },
        { name: 'Chevalier Panorama', url: 'https://chevalier-panorama.com/', logo: '/partners/chevalier.png' },
        { name: 'Superhumans', url: 'https://superhumans.com/', logo: '/partners/superhumans.png' },
        { name: 'Всеукраїнська Рада Реанімації', url: 'https://urc.org.ua/', logo: '/partners/urc.png' },
      ],
    },
    calendar: {
      tag: 'Календар',
      title: 'Найближчі зміни',
      description: 'Приєднуйся до наступної зміни — заповнюй анкету вже зараз.',
      events: [
        {
          month: 'ВЕР',
          year: '2026',
          range: '1–7 вересня 2026',
          title: 'Міжнародна зміна',
          description: 'Міжнародний етап проєкту для учасників з України та світу.',
          formUrl: 'https://forms.gle/GJgZSacF7n1qB4cF9',
        },
        {
          month: 'ВЕР',
          year: '2026',
          range: '10–21 вересня 2026',
          title: 'Довга зміна',
          description: 'Повноцінна програма розвитку та навчання для учасників проєкту.',
          formUrl: 'https://forms.gle/z2QhrPRL1uSKYU79A',
        },
        {
          month: 'ВЕР',
          year: '2026',
          range: '16–21 вересня 2026',
          title: 'Коротка зміна',
          description: 'Інтенсивна програма для нових учасників.',
          formUrl: 'https://forms.gle/7PAuSstvb4WmBpvb9',
        },
      ],
      cta: 'Заповнити анкету',
    },
    contact: {
      tag: 'Контакти',
      title: 'Звʼяжіться з нами',
      phone: '+380 67 305 67 67',
      email: 'zaliznazmina@gmail.com',
      address: 'Стадіонний пров., 7/2, Київ, 03049',
      telegram: 'https://t.me/Zalizna_zmina',
      telegramManager: 'https://t.me/manager_zaliznazmina',
      instagram: 'https://www.instagram.com/zaliznazmina.ua',
      facebook: 'https://www.facebook.com/zaliznazmina',
      tiktok: 'https://www.tiktok.com/@zaliznazmina.uz',
      discord: 'https://discord.gg/EQgr3vxe57',
      description: 'Маєте запитання про платформу чи проєкт? Напишіть нам — відповімо якнайшвидше.',
      detailsTitle: 'Контакти',
      socialsTitle: 'Ми в соцмережах',
      write: 'Написати нам',
      writeVia: { telegram: 'У Telegram', email: 'На пошту', phone: 'Зателефонувати' },
    },
    courses: {
      tag: 'Онлайн навчання',
      title: 'Розвивай навички онлайн',
      description:
        'Відеоуроки, матеріали та тести для учасників проєкту. Проходь кроки, складай фінальний тест — збирай XP і отримуй сертифікат.',
      cta: 'Усі курси',
    },
    news: {
      tag: 'Новини',
      title: 'Останні новини',
      description: 'Слідкуй за подіями проєкту',
      cta: 'Усі новини',
    },
  },
  en: {
    hero: {
      kick: 'The Iron Squad learning platform',
      title1: 'Level up',
      title2: 'your potential',
      subtitle:
        'Video lessons, practical materials and quizzes from the Iron Squad team. Learn at your own pace, earn XP, climb the leaderboard and collect certificates.',
      cta: 'Browse courses',
      ctaSecondary: 'Create an account',
      supportLabel: 'Supported by',
      supportName: 'UKRZALIZNYTSIA',
      features: ['Video lessons', 'Quizzes', 'XP & leaderboard', 'Certificates'],
      mock: {
        course: 'Leadership for teens',
        progress: '3 of 5 steps',
        steps: ['Intro to leadership', 'Teamwork', 'Public speaking'],
        quiz: 'Final quiz',
        certificate: 'Certificate',
      },
    },
    about: {
      tag: 'About us',
      title: 'The community of the next generation',
      description:
        'Iron Squad is a unique educational project supporting talented youth in Ukraine, building the community of the next generation. We unite talented, ambitious, and passionate teenagers from all over the country — those who, even during the war, keep going, seeking opportunities to grow, act, and shape the future.',
      description2:
        "Here ideas are born, teams are formed, and projects with real impact emerge. We don't just work with youth — we invest in those who are already shaping the new Ukraine today.",
      goalsTitle: 'Our goal is a system that helps teenagers:',
      goals: [
        'unlock their potential',
        'find their calling',
        'develop leadership skills',
        'learn to work in a team',
        'and most importantly — believe in their own strength',
      ],
      support:
        "The project is implemented with the support of JSC 'Ukrzaliznytsia' and international partners — the Howard G. Buffett Foundation and Nova Ukraine.",
      cta: 'Learn more',
    },
    platform: {
      tag: 'About the platform',
      title: 'Everything for learning in one place',
      features: [
        { title: 'Video lessons', text: 'Short lessons and materials you can complete at your own pace.' },
        { title: 'Quizzes', text: 'A final quiz checks what you learned and unlocks your certificate.' },
        { title: 'XP and levels', text: 'Every step and quiz earns XP — learning becomes a game.' },
        { title: 'Leaderboard', text: 'Compare your results with other participants on the leaderboard.' },
        { title: 'Certificates', text: 'Finish a course and get a certificate you can download.' },
      ],
      statsTag: 'Our achievements',
      statsTitle: 'The project in numbers',
      stats: [
        { value: 9400, label: 'children in the project' },
        { value: 72, label: 'shifts held' },
        { value: 590, label: 'trainings and courses' },
      ],
    },
    partners: {
      tag: 'Partners',
      title: 'Trusted by',
      description:
        "The project is implemented with the support of JSC 'Ukrzaliznytsia' and international partners — the Howard G. Buffett Foundation and Nova Ukraine. Leading Ukrainian companies and institutions support us.",
      items: [
        { name: 'Ukrzaliznytsia', url: 'https://www.uz.gov.ua/', logo: '/partners/ukrzaliznytsia.png' },
        { name: 'Howard G. Buffett Foundation', url: 'https://www.thehowardgbuffettfoundation.org/', logo: '/partners/buffet-logo-w.png' },
        { name: 'Nova Ukraine', url: 'https://novaukraine.org/', logo: '/partners/nova-ukraine-logo-w.png' },
        { name: 'FC Lokomotyv', url: 'https://www.facebook.com/fc.lokomotyv.ua/', logo: '/partners/loko-logo-w.png' },
        { name: 'Sense Bank', url: 'https://sensebank.ua/', logo: '/partners/sense-w.png' },
        { name: 'Ajax Systems', url: 'https://ajax.systems/ua/about/', logo: '/partners/ajax-logo-w.png' },
        { name: 'The Wall', url: 'https://www.thewall.lviv.ua/', logo: '/partners/thewall-logo-w.png' },
        { name: 'Ukrainian Leadership Academy', url: 'https://ual.ua/', logo: '/partners/ual.png' },
        { name: 'Suspilne', url: 'https://suspilne.media/', logo: '/partners/suspilne.png' },
        { name: 'Ministry of Foreign Affairs of Ukraine', url: 'https://mfa.gov.ua/', logo: '/partners/mfa.png' },
        { name: 'Ministry of Internal Affairs of Ukraine', url: 'https://mvs.gov.ua/', logo: '/partners/mvs.png' },
        { name: 'Chevalier Panorama', url: 'https://chevalier-panorama.com/', logo: '/partners/chevalier.png' },
        { name: 'Superhumans', url: 'https://superhumans.com/', logo: '/partners/superhumans.png' },
        { name: 'Ukrainian Resuscitation Council', url: 'https://urc.org.ua/', logo: '/partners/urc.png' },
      ],
    },
    calendar: {
      tag: 'Calendar',
      title: 'Upcoming shifts',
      description: 'Join the next shift — fill in the application form now.',
      events: [
        {
          month: 'SEP',
          year: '2026',
          range: 'September 1–7, 2026',
          title: 'International shift',
          description: 'The international stage of the project for participants from Ukraine and abroad.',
          formUrl: 'https://forms.gle/GJgZSacF7n1qB4cF9',
        },
        {
          month: 'SEP',
          year: '2026',
          range: 'September 10–21, 2026',
          title: 'Long shift',
          description: 'A full development and learning program for project participants.',
          formUrl: 'https://forms.gle/z2QhrPRL1uSKYU79A',
        },
        {
          month: 'SEP',
          year: '2026',
          range: 'September 16–21, 2026',
          title: 'Short shift',
          description: 'An intensive program for new participants.',
          formUrl: 'https://forms.gle/7PAuSstvb4WmBpvb9',
        },
      ],
      cta: 'Fill in the form',
    },
    contact: {
      tag: 'Contact',
      title: 'Get in touch',
      phone: '+380 67 305 67 67',
      email: 'zaliznazmina@gmail.com',
      address: 'Stadionnyi Lane, 7/2, Kyiv, 03049',
      telegram: 'https://t.me/Zalizna_zmina',
      telegramManager: 'https://t.me/manager_zaliznazmina',
      instagram: 'https://www.instagram.com/zaliznazmina.ua',
      facebook: 'https://www.facebook.com/zaliznazmina',
      tiktok: 'https://www.tiktok.com/@zaliznazmina.uz',
      discord: 'https://discord.gg/EQgr3vxe57',
      description: 'Have a question about the platform or the project? Write to us — we will reply as soon as we can.',
      detailsTitle: 'Contacts',
      socialsTitle: 'Follow us',
      write: 'Contact us',
      writeVia: { telegram: 'On Telegram', email: 'By email', phone: 'Call us' },
    },
    courses: {
      tag: 'Online learning',
      title: 'Develop skills online',
      description:
        'Video lessons, materials, and quizzes for project participants. Complete the steps, pass the final quiz — earn XP and get a certificate.',
      cta: 'All courses',
    },
    news: {
      tag: 'News',
      title: 'Latest news',
      description: 'Follow project events',
      cta: 'All news',
    },
  },
}

export const getHomeContent = (locale: SiteLocale) => content[locale]

export type CalendarContent = HomeContent['calendar']

export const resolveCalendarContent = (
  locale: SiteLocale,
  global: HomeCalendar | null | undefined,
): CalendarContent => {
  const fallback = content[locale].calendar

  const events = (global?.events ?? []).map((event) => ({
    month: event.month,
    year: event.year,
    range: event.range,
    title: event.title,
    description: event.description ?? '',
    formUrl: event.formUrl,
  }))

  return {
    tag: global?.tag || fallback.tag,
    title: global?.title || fallback.title,
    description: global?.description || fallback.description,
    events: events.length > 0 ? events : fallback.events,
    cta: global?.cta || fallback.cta,
  }
}
