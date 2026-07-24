import type { SiteLocale } from '@/utilities/locales'
import type { HomeCalendar } from '@/payload-types'

// Content sourced from ironsquad.org.ua (July 2026) — the platform is the
// online arm of the «Залізна Зміна» project and must stay in sync with the
// landing: stats, shifts calendar, partners, contacts.

export const APPLY_FORM_URL = 'https://forms.gle/z2QhrPRL1uSKYU79A'
export const LANDING_URL = 'https://www.ironsquad.org.ua'
export const STORIES_URL = 'https://www.ironsquad.org.ua/history'

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
  }
  stats: {
    children: { value: number; label: string; suffix?: string }[]
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
    storiesCta: string
  }
  partners: {
    tag: string
    title: string
    description: string
    names: { name: string; url: string }[]
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
    cta: string
    ctaSecondary: string
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
      kick: 'Онлайн-платформа проєкту',
      title1: 'Залізна',
      title2: 'Зміна',
      subtitle:
        'Унікальний проєкт розвитку талановитої молоді України. Навчайся онлайн, проходь курси та тести, збирай XP і отримуй сертифікати — у своєму темпі.',
      cta: 'Почати навчання',
      ctaSecondary: 'Про проєкт',
      supportLabel: 'За підтримки',
      supportName: 'УКРЗАЛІЗНИЦЯ',
    },
    stats: {
      children: [
        { value: 9400, label: 'дітей у проєкті' },
        { value: 72, label: 'зміни проведено' },
        { value: 590, label: 'тренінгів і курсів' },
      ],
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
      storiesCta: 'Історії дітей',
    },
    partners: {
      tag: 'Партнери',
      title: 'Нам довіряють',
      description:
        'Проєкт реалізується за підтримки АТ «Укрзалізниця» та міжнародних партнерів — Howard G. Buffett Foundation та Nova Ukraine. Нас підтримують провідні українські компанії та інституції.',
      names: [
        { name: 'Укрзалізниця', url: 'https://www.uz.gov.ua/' },
        { name: 'Howard G. Buffett Foundation', url: 'https://www.thehowardgbuffettfoundation.org/' },
        { name: 'Nova Ukraine', url: 'https://novaukraine.org/' },
        { name: 'Ajax Systems', url: 'https://ajax.systems/ua/about/' },
        { name: 'Sense Bank', url: 'https://sensebank.ua/' },
        { name: 'Superhumans', url: 'https://superhumans.com/' },
        { name: 'Суспільне', url: 'https://suspilne.media/' },
        { name: 'МЗС України', url: 'https://mfa.gov.ua/' },
        { name: 'МВС України', url: 'https://mvs.gov.ua/' },
        { name: 'The Wall', url: 'https://www.thewall.lviv.ua/' },
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
      cta: 'Telegram',
      ctaSecondary: 'Написати нам',
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
      kick: "The project's online platform",
      title1: 'Iron',
      title2: 'Squad',
      subtitle:
        'A unique development project for talented Ukrainian youth. Learn online, take courses and quizzes, earn XP and certificates — at your own pace.',
      cta: 'Start learning',
      ctaSecondary: 'About the project',
      supportLabel: 'Supported by',
      supportName: 'UKRZALIZNYTSIA',
    },
    stats: {
      children: [
        { value: 9400, label: 'children in the project' },
        { value: 72, label: 'shifts held' },
        { value: 590, label: 'trainings and courses' },
      ],
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
      storiesCta: "Children's stories",
    },
    partners: {
      tag: 'Partners',
      title: 'Trusted by',
      description:
        "The project is implemented with the support of JSC 'Ukrzaliznytsia' and international partners — the Howard G. Buffett Foundation and Nova Ukraine. Leading Ukrainian companies and institutions support us.",
      names: [
        { name: 'Ukrzaliznytsia', url: 'https://www.uz.gov.ua/' },
        { name: 'Howard G. Buffett Foundation', url: 'https://www.thehowardgbuffettfoundation.org/' },
        { name: 'Nova Ukraine', url: 'https://novaukraine.org/' },
        { name: 'Ajax Systems', url: 'https://ajax.systems/ua/about/' },
        { name: 'Sense Bank', url: 'https://sensebank.ua/' },
        { name: 'Superhumans', url: 'https://superhumans.com/' },
        { name: 'Suspilne', url: 'https://suspilne.media/' },
        { name: 'MFA of Ukraine', url: 'https://mfa.gov.ua/' },
        { name: 'MIA of Ukraine', url: 'https://mvs.gov.ua/' },
        { name: 'The Wall', url: 'https://www.thewall.lviv.ua/' },
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
      cta: 'Telegram',
      ctaSecondary: 'Contact us',
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

// Overlays the `home-calendar` Payload global on the hardcoded content above:
// per-field fallback for the section texts, and the hardcoded schedule when the
// global has no events yet (never saved / cleared).
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
