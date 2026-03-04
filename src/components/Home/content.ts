import type { SiteLocale } from '@/utilities/locales'

type HomeContent = {
  hero: {
    title: string
    subtitle: string
    cta: string
    ctaSecondary: string
  }
  stats: {
    children: { value: number; label: string; suffix?: string }[]
  }
  about: {
    tag: string
    title: string
    description: string
    description2: string
    cta: string
  }
  team: {
    tag: string
    title: string
    members: { name: string; role: string; initials: string; image?: string }[]
  }
  partners: {
    tag: string
    title: string
    description: string
    logos: { name: string; image: string }[]
  }
  calendar: {
    tag: string
    title: string
    description: string
    events: { date: string; title: string; description: string }[]
    cta: string
  }
  faq: {
    tag: string
    title: string
    items: { question: string; answer: string }[]
  }
  gallery: {
    tag: string
    title: string
  }
  contact: {
    tag: string
    title: string
    phone: string
    email: string
    address: string
    telegram: string
    instagram: string
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
      title: 'ЗАЛІЗНА ЗМІНА',
      subtitle: 'Унікальний проєкт розвитку талановитої молоді України',
      cta: 'Заповнити анкету',
      ctaSecondary: 'Дізнатися більше',
    },
    stats: {
      children: [
        { value: 5000, label: 'дітей', suffix: '+' },
        { value: 38, label: 'змін' },
        { value: 210, label: 'тренінгів', suffix: '+' },
      ],
    },
    about: {
      tag: 'Про нас',
      title: 'Сильна, згуртована, розумна, спортивна, мужня, патріотична нація',
      description:
        'Мета проєкту — створення багатоступеневої сучасної системи підготовки молоді та дітей до життя, навчання, праці та розвитку в умовах воєнного часу. Учасники проєкту — талановиті підлітки з визначними здобутками у навчанні, спорті, мистецтві і творчості.',
      description2:
        'Назва проєкту найкраще відповідає завданням, які стоять перед українською молоддю — «Залізна зміна» — яка зробить європейську Україну процвітаючою, прогресуючою, щасливою державою.',
      cta: 'Детальніше',
    },
    team: {
      tag: 'Команда',
      title: 'Наша команда',
      members: [
        { name: 'Єгоров Олександр', role: 'Керівник проєкту', initials: 'ЄО', image: '/static/zz/oe.png' },
        { name: 'Трофимюк Тетяна', role: 'Куратор проєкту', initials: 'ТТ', image: '/static/zz/tt.png' },
        { name: 'Баркова Олена', role: 'Проджект менеджер', initials: 'БО', image: '/static/zz/bo.png' },
        { name: 'Кошелєв Ілля', role: 'Тімлідер', initials: 'КІ', image: '/static/zz/ki.png' },
        { name: 'Руштина Дар\u02BCя', role: 'Медіалідер', initials: 'РД', image: '/static/zz/rd.png' },
      ],
    },
    partners: {
      tag: 'Партнери',
      title: 'Нам довіряють',
      description:
        'Над створенням проєкту працювали потужні компанії: АТ «Укрзалізниця» та фонд Говарда Баффетта. За весь час співпраці ми заручилися підтримкою: Multiplex, Ajax, Sense Bank та Аврора.',
      logos: [
        { name: 'Укрзалізниця', image: '/static/zz/uz-logo-white.png' },
        { name: 'Howard G. Buffett Foundation', image: '/static/zz/buffet-logo-w.png' },
        { name: 'Ajax', image: '/static/zz/ajax-logo.png' },
        { name: 'Sense Bank', image: '/static/zz/sense-w.png' },
        { name: 'Аврора', image: '/static/zz/avrora-logo.jpg' },
      ],
    },
    calendar: {
      tag: 'Календар',
      title: 'Найближчі події',
      description: 'Приєднуйтесь до нашого проєкту!',
      events: [
        {
          date: 'Квітень 2026',
          title: 'Довга зміна',
          description: 'Повноцінна програма розвитку та навчання для учасників проєкту',
        },
        {
          date: 'Квітень 2026',
          title: 'Коротка зміна',
          description: 'Інтенсивна програма для нових учасників',
        },
      ],
      cta: 'Заповнити анкету',
    },
    faq: {
      tag: 'FAQ',
      title: 'Часті запитання',
      items: [
        {
          question: 'Які речі дати з собою дитині?',
          answer:
            'Засоби особистої гігієни, гумові тапочки, плавки/купальник, нижня білизна, піжама, зручний одяг (спортивний костюм, футболки, шорти), головний убір, теплі речі (толстовка, фліска), зручне спортивне взуття, вітровка з капюшоном або дощовик, індивідуальна аптечка за необхідності.',
        },
        {
          question: 'Багато активних ігор, як з травмами?',
          answer:
            'Наш проєкт — це справжня арена для пригод і змагань, де діти завжди намагаються перевершити один одного. Часом через конкурентність подряпини можуть траплятися. Але не хвилюйтеся — наш лікар завжди готовий надати допомогу!',
        },
        {
          question: 'Ми відправляємо дитину вперше',
          answer:
            'Ми розуміємо, що перша поїздка може бути хвилюючою. Радимо зазирнути в наш Instagram, де ви побачите фото і відео з попередніх таборів. Кваліфіковані супроводжуючі знайдуть підхід до кожної дитини.',
        },
        {
          question: 'Коли і де можна подивитися фотографії?',
          answer:
            'Наш фотограф фіксує найяскравіші моменти в реальному часі. Фото та відео надсилаються до групи в Telegram по мірі їх обробки.',
        },
        {
          question: 'Коли відбій?',
          answer:
            'Відбій о 22:00. Перед тим супроводжуючі допомагають дітям з підготовкою до сну.',
        },
        {
          question: 'Повітряна тривога?',
          answer:
            'Як тільки приходить сповіщення про тривогу, активності припиняються і всі прямують в надійне укриття на території.',
        },
      ],
    },
    gallery: {
      tag: 'Галерея',
      title: 'Моменти проєкту',
    },
    contact: {
      tag: 'Контакти',
      title: 'Зв\u02BCяжіться з нами',
      phone: '+380 67 305 67 67',
      email: 'zaliznazmina@gmail.com',
      address: 'Стадіонний провулок, 10/2, Київ, 03049',
      telegram: 'https://t.me/manager_zaliznazmina',
      instagram: 'https://www.instagram.com/zaliznazmina.uz',
      cta: 'Telegram',
      ctaSecondary: 'Написати нам',
    },
    courses: {
      tag: 'Онлайн навчання',
      title: 'Розвивайте навички онлайн',
      description:
        'Відеоуроки, матеріали та тести для учасників проєкту. Навчайтеся у зручному для вас темпі.',
      cta: 'Переглянути курси',
    },
    news: {
      tag: 'Новини',
      title: 'Останні новини',
      description: 'Слідкуйте за подіями проєкту',
      cta: 'Усі новини',
    },
  },
  en: {
    hero: {
      title: 'IRON SQUAD',
      subtitle: 'A unique project for developing talented Ukrainian youth',
      cta: 'Apply Now',
      ctaSecondary: 'Learn More',
    },
    stats: {
      children: [
        { value: 5000, label: 'children', suffix: '+' },
        { value: 38, label: 'shifts' },
        { value: 210, label: 'trainings', suffix: '+' },
      ],
    },
    about: {
      tag: 'About Us',
      title: 'Strong, united, smart, athletic, courageous, patriotic nation',
      description:
        'The project aims to create a modern multi-level system for preparing youth and children for life, education, work, and development during wartime. Participants are talented teenagers with outstanding achievements in education, sports, arts, and creativity.',
      description2:
        'The project name best reflects the challenges facing Ukrainian youth — "Iron Squad" — which will make European Ukraine a prosperous, progressive, and happy country.',
      cta: 'Read More',
    },
    team: {
      tag: 'Team',
      title: 'Our Team',
      members: [
        { name: 'Oleksandr Yehorov', role: 'Project Lead', initials: 'OY', image: '/static/zz/oe.png' },
        { name: 'Tetiana Trofymyuk', role: 'Project Curator', initials: 'TT', image: '/static/zz/tt.png' },
        { name: 'Olena Barkova', role: 'Project Manager', initials: 'OB', image: '/static/zz/bo.png' },
        { name: 'Illia Kosheliev', role: 'Team Lead', initials: 'IK', image: '/static/zz/ki.png' },
        { name: 'Daria Rushtyna', role: 'Media Lead', initials: 'DR', image: '/static/zz/rd.png' },
      ],
    },
    partners: {
      tag: 'Partners',
      title: 'Trusted By',
      description:
        'The project was built by powerful companies: Ukrzaliznytsia and the Howard G. Buffett Foundation. Over time, we gained the support of: Multiplex, Ajax, Sense Bank, and Aurora.',
      logos: [
        { name: 'Ukrzaliznytsia', image: '/static/zz/uz-logo-white.png' },
        { name: 'Howard G. Buffett Foundation', image: '/static/zz/buffet-logo-w.png' },
        { name: 'Ajax', image: '/static/zz/ajax-logo.png' },
        { name: 'Sense Bank', image: '/static/zz/sense-w.png' },
        { name: 'Aurora', image: '/static/zz/avrora-logo.jpg' },
      ],
    },
    calendar: {
      tag: 'Calendar',
      title: 'Upcoming Events',
      description: 'Join our project!',
      events: [
        {
          date: 'April 2026',
          title: 'Long Shift',
          description: 'Full development and learning program for project participants',
        },
        {
          date: 'April 2026',
          title: 'Short Shift',
          description: 'Intensive program for new participants',
        },
      ],
      cta: 'Apply Now',
    },
    faq: {
      tag: 'FAQ',
      title: 'Frequently Asked Questions',
      items: [
        {
          question: 'What should my child pack?',
          answer:
            'Personal hygiene items, rubber slippers, swimwear, underwear, pajamas, comfortable clothes (tracksuit, t-shirts, shorts), hat, warm clothes (hoodie, fleece), comfortable athletic shoes, windbreaker or raincoat, personal first-aid kit if needed.',
        },
        {
          question: 'Many active games — what about injuries?',
          answer:
            "Our project is a real arena for adventures and competitions where kids always try to outdo each other. Sometimes minor scratches may occur due to competitiveness. But don't worry — our doctor is always ready to help!",
        },
        {
          question: "We're sending our child for the first time",
          answer:
            "We understand that the first trip can be exciting. We recommend checking our Instagram where you can see photos and videos from previous camps. Qualified staff will find the right approach for every child.",
        },
        {
          question: 'Where can we see photos from the project?',
          answer:
            'Our photographer captures the brightest moments in real-time. Photos and videos are sent to the Telegram group as they are processed.',
        },
        {
          question: 'What time is lights out?',
          answer:
            'Lights out at 10 PM. Staff helps children with bedtime preparation beforehand.',
        },
        {
          question: 'Air raid alerts?',
          answer:
            'As soon as an alert notification comes, all activities stop and everyone heads to the reliable shelter on the premises.',
        },
      ],
    },
    gallery: {
      tag: 'Gallery',
      title: 'Project Moments',
    },
    contact: {
      tag: 'Contact',
      title: 'Get in Touch',
      phone: '+380 67 305 67 67',
      email: 'zaliznazmina@gmail.com',
      address: 'Stadionne Lane, 10/2, Kyiv, 03049',
      telegram: 'https://t.me/manager_zaliznazmina',
      instagram: 'https://www.instagram.com/zaliznazmina.uz',
      cta: 'Telegram',
      ctaSecondary: 'Contact Us',
    },
    courses: {
      tag: 'Online Learning',
      title: 'Develop Skills Online',
      description:
        'Video lessons, materials, and quizzes for project participants. Learn at your own pace.',
      cta: 'Browse Courses',
    },
    news: {
      tag: 'News',
      title: 'Latest News',
      description: 'Follow project events',
      cta: 'All News',
    },
  },
}

export const getHomeContent = (locale: SiteLocale) => content[locale]
