class Dailies {
  'use strict';
  constructor(role, translationKey, target, index, value = 0) {
    this.role = role;
    this.translationKey = translationKey;
    this.target = target;
    this.value = value;
    this.index = index;
  }
  static init() {
    this.categories = [];
    this.categoryOffset = 0;
    this.jsonData = [];
    this.dailiesList = [];
    this.context = $('.daily-challenges[data-type=dailies]');
    this.markersCategories = [];

    const websiteData = Loader.promises['dailies'].consumeJson(data => this.dailiesList = data);
    const allDailies = Loader.promises['possible_dailies'].consumeJson(data => this.jsonData = data);

    $('#dailies-prev').on('click', Dailies.prevCategory);
    $('#dailies-next').on('click', Dailies.nextCategory);

    const dailiesDate = new Date(Date.now() - 21600000).toISOUTCDateString(); // 21600000 = 6 hours

    return Promise.all([websiteData, allDailies])
      .then(() => {
        if (this.dailiesList.date !== dailiesDate)
          return Promise.reject();

        console.info(`%c[Dailies] Loaded!`, 'color: #bada55; background: #242424');

        Object.keys(this.dailiesList.data).forEach(role => {
          this.categories.push(role);
          $('.dailies').append($(`<div id="${role}" class="daily-role"></div>`).toggleClass('hidden', role !== this.categories[0]));
          this.dailiesList.data[role].forEach(({ daily, target }, index) => {
            const activeCategory = this.jsonData.find(_daily => _daily.key === daily.toLowerCase()).category;
            this.markersCategories.push(activeCategory);
            const newDaily = new Dailies(role, daily.toLowerCase(), target, index);
            newDaily.appendToMenu();
          });
        });
        this.onLanguageChanged();
      })
      .catch(this.dailiesNotUpdated);
  }
  appendToMenu() {
    const structure = Language.get('menu.daily_challenge_structure').match(/\{(.+?)\}.*?\{(.+?)\}/);

    $(`.dailies > #${this.role}`)
      .append($(`
          <div class="one-daily-container">
            <span class="counter" data-text="${this.value}/${this.target}"></span>
            <span class="daily" id="daily-${this.role}-${this.index}" data-text="${this.translationKey}"></span>
          </div>`))
      .translate()
      .find('.one-daily-container')
      .css({
        'grid-template-areas': `"${structure[1]} ${structure[2]}"`,
        'justify-content': structure[2] === 'counter' ? 'space-between' : 'left'
      })
      .find(`#daily-${this.role}-${this.index}`)
      .toggleClass('not-found', Language.get(this.translationKey) === this.translationKey)
      .end();
  }
  static dailiesNotUpdated() {
    $('.dailies').append($(`
      <div class="daily-not-found not-found">${Language.get('menu.dailies_not_found')}</div>
    `));
    $('#dailies-changer-container, #sync-map-to-dailies').addClass('hidden');
  }
  static nextCategory() {
    Dailies.categoryOffset = (Dailies.categoryOffset + 1).mod(Dailies.categories.length);
    Dailies.switchCategory();
  }
  static prevCategory() {
    Dailies.categoryOffset = (Dailies.categoryOffset - 1).mod(Dailies.categories.length);
    Dailies.switchCategory();
  }
  static switchCategory() {
    const roles = $('.daily-role');
    [].forEach.call(roles, element => {
      $(element).toggleClass('hidden', element.id !== Dailies.categories[Dailies.categoryOffset]);
    });
    $('.dailies-title').text(Language.get(`menu.dailies_${Dailies.categories[Dailies.categoryOffset]}`));
  }
  static onLanguageChanged() {
    Menu.reorderMenu(this.context);
  }
}


// Still looking for a better way than trigger handlers, if you have any better idea feel free to modify it
class SynchronizeDailies {
  'use strict';
  constructor(category, marker) {
    this.category = category;
    this.markers = marker;
  }
  static init() {
    $('.menu-hide-all').trigger('click');
    Dailies.markersCategories.forEach(element => {
      const [category, marker] = element;
      if (marker === "") return;
      const newSyncedCategory = new SynchronizeDailies(category, marker);
      console.log(element);
      newSyncedCategory.sync();
    });
  }
  sync() {
    this.key = (() => {
      switch (this.category) {
        case 'animal':
        case 'fish':
          return `menu.cmpndm.${this.category}_${this.markers}`;
        case 'shops':
        case 'plants':
        case 'gfh':
          return `map.${this.category}.${this.markers}.name`;
        case 'menu':
          return `${this.category}.${this.markers}`;
        case 'nazar':
          return `menu.${this.markers}`;
        case 'daily_location':
          return `menu.${this.markers}.name`;
        default:
          console.log(`${this.category} ${this.markers} not found`); // only temporary
      }
    })();

    if ($(`[data-text="${this.key}"]`).parent().hasClass('disabled') ||
      $(`[data-text="${this.key}"]`).parent().parent().hasClass('disabled'))
      $(`[data-text="${this.key}"]`).trigger('click');
  }
}