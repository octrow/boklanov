import { siteConfig } from './lib/site-config'

export default siteConfig({
  // the site's root Notion page (required)
  rootNotionPageId: 'd997b20454e24c9685624e4eb254935b',

  // if you want to restrict pages to a single notion workspace (optional)
  // (this should be a Notion ID; see the docs for how to extract this)
  rootNotionSpaceId: null,

  // basic site info (required)
  name: 'Roman Boklanov',
  domain: 'boklanov.ru',
  author: 'Roman Boklanov',

  // open graph metadata (optional)
  description: 'Портфолио режиссерских и актёрских работ Романа Бокланова, личный сайт',

  // social usernames (optional)
  // instagram: 'boklanovroman',
  // facebook: '100001713857792',
  // linkedin: 'fisch2',
  // mastodon: '#', // optional mastodon profile URL, provides link verification
  // newsletter: '#', // optional newsletter URL
  // youtube: '#', // optional youtube channel name or `channel/UCGbXXXXXXXXXXXXXXXXXXXXXX`

  // default notion icon and cover images for site-wide consistency (optional)
  // page-specific values will override these site-wide defaults
  defaultPageIcon: null,
  defaultPageCover: null,
  defaultPageCoverPosition: 0.5,

  // whether or not to enable support for LQIP preview images (optional)
  isPreviewImageSupportEnabled: false,

  // whether or not redis is enabled for caching generated preview images (optional)
  // NOTE: if you enable redis, you need to set the `REDIS_HOST` and `REDIS_PASSWORD`
  // environment variables. see the readme for more info
  isRedisEnabled: false,

  // map of notion page IDs to URL paths (optional)
  // any pages defined here will override their default URL paths
  // example:
  //
  // pageUrlOverrides: {
  //    '/Bury-Me-Behind-the-Baseboard': 'ee2d7bea11484e16bcb03effc276a719',
  //    '/Bury-Me-Behind-the-Baseboard-en': 'c6f2c93cbb534a19ba38b81226aa795b',
  //    '/The-Ape-Star': 'b5811360180c43efac06a8b18fe89100',
  //    '/The-Ape-Star-en': '91807219acdd460391f245c5791a8323',
  //    '/Jagger-Jagger': '20a595cc8c4843d7b4281e4b56fc6ff4',
  //    '/Jagger-Jagger-en': '616c45a046534a0e8e47c6b4a45a4f26',
  //    '/Nikita-looking-for-the-sea': 'd42689bd05c2410db6c679d1b575088e',
  //    '/Nikita-looking-for-the-sea-en': '310ad30a540f4ab282a55f5308f63303',    
  //    '/Aiaccio': 'e3a5503b611f4e0db3973d489b2b010a',
  //    '/Aiaccio-en': '6f9f7b00c42d4c9d961ac0a5454b1240',
  //    '/Plaster': 'd9a81d6aa35f42ebacfc04d68b7c6141',
  //    '/Plaster-en': 'feda57dbf95340dda8467e462d29d16d',
  //    '/Going-in-twos': '86d3233d37bb4fdbb4e148b2cd082b06',
  //    '/Going-in-twos-en': 'd59b4cdcabca4222a0b5bfbe6f54db68',
  //    '/Wee-Little-Havroshechka': '5a6288eb3f5b4c519757fc69c418f1a7',
  //    '/Wee-Little-Havroshechka-en': '7b4ad036db514d05a0b39fc93e5c529a',
  //    '/Typisch-bar': '135e3454ce614fb5ae22fb7a4de718d8',
  //    '/Typisch-bar-en': '86b8bdb7f7bd4758a0bfe9dccc5561e8',
  //    '/Cinderella': 'cedfe4b7f0734277994b0fa1d71b621a',
  //    '/Cinderella-en': '248fdd348fc2436b8e605b2432a131aa',
  //    '/PRE-THEATRE': '769a1063d1004b78a41d8bfa73529b39',
  //    '/PRE-THEATRE-EN': '03e57821e8ae43f4bf5c96d72f0049c6',
  //    '/Commedia-dell-arte': 'd0a662ea9aa844dcab4c178357ef210a',
  //    '/Commedia-dell-arte-en': 'e2b8cb0d3dcf4665b09a2d38f2fa9d4b',
  //    '/Sea-day-suitcase': '354b5e41461e4dda9ac7e53a1c1666b7',
  //    '/Sea-day-suitcase-en': '4192a5050eb24a94a15ce4665e75a4a5',
  //    '/Lika-and-beam': '6c000f9a1fa044ffa60082c2d0d8ac30',
  //    '/Lika-and-beam-en': '427479931b614116bfd0578e008205e9',
  //    '/Online': 'bb19c2be63784efba072525d3e9369e4',
  //    '/Online-en': '8e330830dea1460d818186215b135472',
  //    '/Second-director': '76daa9bde2e3499e974fd37a51d47344'
  //  },
  pageUrlOverrides: null,

  // whether to use the default notion navigation style or a custom one with links to
  // important pages
  // navigationStyle: 'default'
  navigationStyle: 'custom',
  navigationLinks: [
    {
      title: 'English',
      pageId: 'a5b04e92d3184bc384d04deb62feb515'
    },
    {
      title: 'Контакты',
      pageId: '3abd61d5916847ebacc99919f6834a7b'
    }
  ]
})
