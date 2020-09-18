Object.defineProperty(String.prototype, 'filename', {
  value: function (extension) {
    let s = this.replace(/\\/g, '/');
    s = s.substring(s.lastIndexOf('/') + 1);
    return extension ? s.replace(/[?#].+$/, '') : s.split('.')[0];
  }
});

Object.defineProperty(String.prototype, 'includesOneOf', {
  value: function (...elements) {
    var include = false;
    for (var str of elements) {
      if (this.includes(str)) {
        include = true;
        break;
      }
    }
    return include;
  }
});

Object.defineProperty(Number.prototype, 'mod', {
  value: function (num) {
    return ((this % num) + num) % num;
  }
});

function init() {

  const navLang = navigator.language;
  SettingProxy.addSetting(Settings, 'language', {
    default: Language.availableLanguages.includes(navLang) ? navLang : 'en',
  });

  MapBase.init();

  Language.init();
  Language.setMenuLanguage();

  if (Settings.isMenuOpened)
    $('.menu-toggle').click();

  Pins.init();
  changeCursor();

  Menu.init();

  const animals = AnimalCollection.init();
  const locations = Location.init();
  const encounters = Encounter.init();
  const treasures = Treasure.init();
  const plants = PlantsCollection.init();
  const camps = Camp.init();
  const shops = Shop.init();
  const gfh = GunForHire.init();
  const nazar = MadamNazar.init();
  const legendary = Legendary.init();
  const discoverables = Discoverable.init();
  const overlays = Overlay.init();

  Promise.all([animals, locations, encounters, treasures, plants, camps, shops, gfh, nazar, legendary, discoverables, overlays])
    .then(() => { Loader.resolveMapModelLoaded(); MapBase.runOncePostLoad(); });

  $('#language').val(Settings.language);
  $('#marker-opacity').val(Settings.markerOpacity);
  $('#marker-size').val(Settings.markerSize);
  $('#marker-cluster').prop("checked", Settings.isMarkerClusterEnabled);
  $('#tooltip').prop("checked", Settings.showTooltips);
  $('#enable-marker-popups-hover').prop("checked", Settings.isPopupsHoverEnabled);
  $('#enable-marker-shadows').prop("checked", Settings.isShadowsEnabled);
  $('#enable-dclick-zoom').prop("checked", Settings.isDoubleClickZoomEnabled);
  $('#show-help').prop("checked", Settings.showHelp);
  $('#timestamps-24').prop("checked", Settings.isClock24Hour);
  $('#show-dailies').prop("checked", Settings.showDailies);
  $('#show-coordinates').prop("checked", Settings.isCoordsOnClickEnabled);

  $('#enable-debug').prop("checked", Settings.isDebugEnabled);
  $('#enable-right-click').prop("checked", Settings.isRightClickEnabled);

  $("#help-container").toggle(Settings.showHelp);
  $('.daily-challenges').toggle(Settings.showDailies);
}

function isLocalHost() {
  return location.hostname === "localhost" || location.hostname === "127.0.0.1";
}

function changeCursor() {
  if (Settings.isCoordsOnClickEnabled)
    $('.leaflet-grab').css('cursor', 'pointer');
  else {
    $('.leaflet-grab').css('cursor', 'grab');
    $('.lat-lng-container').css('display', 'none');
  }
}

function getParameterByName(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

// Simple download function
function downloadAsFile(filename, text) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

function clockTick() {
  'use strict';
  const now = new Date();
  const gameTime = new Date(now * 30);
  const gameHour = gameTime.getUTCHours();
  const nightTime = gameHour >= 22 || gameHour < 5;
  const clockFormat = {
    timeZone: 'UTC',
    hour: 'numeric',
    minute: '2-digit',
    hourCycle: Settings.isClock24Hour ? 'h23' : 'h12',
  };

  $('#time-in-game').text(gameTime.toLocaleString(Settings.language, clockFormat));

  $('.day-cycle').css('background', `url(assets/images/${nightTime ? 'moon' : 'sun'}.png)`);

  $('.leaflet-marker-icon[data-marker="hideouts"]').each(function () {
    let time = $(this).data('time') + '';
    if (time === null || time == '') return;
    if (time.split(",").includes(gameHour + "")) {
      $(this).css('filter', 'drop-shadow(0 0 .5rem #fff) drop-shadow(0 0 .25rem #fff)');
    } else {
      $(this).css('filter', 'none');
    }
  });
}

setInterval(clockTick, 1000);

$("#toggle-debug").on("click", function () {
  $("#debug-container").toggleClass('opened');
});

//TODO: re-implement this function
$("#show-all-markers").on("change", function () {
  Settings.showAllMarkers = $("#show-all-markers").prop('checked');
});

$('#enable-right-click').on("change", function () {
  Settings.isRightClickEnabled = $("#enable-right-click").prop('checked');
});

//Disable menu category when click on input
$('.menu-option.clickable input, #submit-new-herb').on('click', function (e) {
  e.stopPropagation();
});

$('#language').on('change', function () {
  Settings.language = $("#language").val();

  Language.setMenuLanguage();
  Treasure.onLanguageChanged();
  Dailies.onLanguageChanged();

  //WIP: update markers without reload page
  Camp.locations.forEach(camp => camp.onLanguageChanged());
  Encounter.locations.forEach(encounter => encounter.onLanguageChanged());
  GunForHire.locations.forEach(gfh => gfh.onLanguageChanged());
  Location.locations.forEach(location => location.onLanguageChanged());
  Shop.locations.forEach(shop => shop.onLanguageChanged());
  MadamNazar.addMadamNazar();
});

$('#marker-size').on('change', function () {
  Settings.markerSize = Number($('#marker-size').val());
  Treasure.onSettingsChanged();
  Camp.locations.forEach(camp => camp.reinitMarker());
  Encounter.locations.forEach(encounter => encounter.reinitMarker());
  GunForHire.locations.forEach(gfh => gfh.reinitMarker());
  Location.locations.forEach(location => location.reinitMarker());
  Shop.locations.forEach(shop => shop.reinitMarker());
  MadamNazar.addMadamNazar();
  Pins.loadPins();
});

$('#marker-opacity').on('change', function () {
  Settings.markerOpacity = Number($("#marker-opacity").val());
  Treasure.onSettingsChanged();
  Camp.locations.forEach(camp => camp.reinitMarker());
  Encounter.locations.forEach(encounter => encounter.reinitMarker());
  GunForHire.locations.forEach(gfh => gfh.reinitMarker());
  Location.locations.forEach(location => location.reinitMarker());
  Shop.locations.forEach(shop => shop.reinitMarker());
  MadamNazar.addMadamNazar();
  Pins.loadPins();
});

$('#overlay-opacity').on('change', function () {
  Settings.overlayOpacity = Number($("#overlay-opacity").val());
  Legendary.onSettingsChanged();
  Overlay.onSettingsChanged();
});

$('#tooltip').on('change', function () {
  Settings.showTooltips = $("#tooltip").prop('checked');

  if (Settings.showTooltips)
    Menu.tippyInstances = tippy('[data-tippy-content]', { theme: 'rdr2-theme' });
  else {
    Menu.tippyInstances.forEach(instance => instance.destroy());
    Menu.tippyInstances = [];
  }
});

$('#marker-cluster').on("change", function () {
  Settings.isMarkerClusterEnabled = $("#marker-cluster").prop('checked');

  Layers.oms.clearMarkers();

  Camp.locations.forEach(camp => camp.reinitMarker());
  Encounter.locations.forEach(encounter => encounter.reinitMarker());
  GunForHire.locations.forEach(gfh => gfh.reinitMarker());
  Location.locations.forEach(location => location.reinitMarker());
  Shop.locations.forEach(shop => shop.reinitMarker());
  MadamNazar.addMadamNazar();
  Pins.loadPins();
});

$('#enable-marker-popups-hover').on("change", function () {
  Settings.isPopupsHoverEnabled = $("#enable-marker-popups-hover").prop('checked');
});

$('#enable-marker-shadows').on("change", function () {
  Settings.isShadowsEnabled = $("#enable-marker-shadows").prop('checked');
  Treasure.onSettingsChanged();
  Camp.locations.forEach(camp => camp.reinitMarker());
  Encounter.locations.forEach(encounter => encounter.reinitMarker());
  GunForHire.locations.forEach(gfh => gfh.reinitMarker());
  Location.locations.forEach(location => location.reinitMarker());
  Pins.loadPins();
  MadamNazar.addMadamNazar();
  Shop.locations.forEach(shop => shop.reinitMarker());
});

$('#enable-dclick-zoom').on("change", function () {
  Settings.isDoubleClickZoomEnabled = $("#enable-dclick-zoom").prop('checked');
  if (Settings.isDoubleClickZoomEnabled) {
    MapBase.map.doubleClickZoom.enable();
  } else {
    MapBase.map.doubleClickZoom.disable();
  }
});

$('#show-help').on("change", function () {
  Settings.showHelp = $("#show-help").prop('checked');
  $("#help-container").toggle(Settings.showHelp);
});

$('#timestamps-24').on('change', function () {
  Settings.isClock24Hour = $("#timestamps-24").prop('checked');
  clockTick();
  $("#language").triggerHandler('change');
});

$('#show-dailies').on('change', function () {
  Settings.showDailies = $("#show-dailies").prop('checked');
  $('.daily-challenges').toggle(Settings.showDailies);
});

$('#sync-map-to-dailies').on('click', function () {
  SynchronizeDailies.init();
});

$('#show-coordinates').on('change', function () {
  Settings.isCoordsOnClickEnabled = $("#show-coordinates").prop('checked');
  changeCursor();
});

$('#enable-debug').on("change", function () {
  Settings.isDebugEnabled = $("#enable-debug").prop('checked');
});

//Open collection submenu
$('.open-submenu').on('click', function (e) {
  e.stopPropagation();
  $(this).parent().parent().children('.menu-hidden').toggleClass('opened');
  $(this).toggleClass('rotate');
});

$('.submenu-only').on('click', function (e) {
  e.stopPropagation();
  $(this).parent().children('.menu-hidden').toggleClass('opened');
  $(this).children('.open-submenu').toggleClass('rotate');
});

//Open & close side menu
$('.menu-toggle').on('click', function () {
  $('.side-menu').toggleClass('menu-opened');
  Settings.isMenuOpened = $('.side-menu').hasClass('menu-opened');
  $('.menu-toggle').text(Settings.isMenuOpened ? 'X' : '>');
  $('.top-widget').toggleClass('top-widget-menu-opened', Settings.isMenuOpened);
  $('#fme-container').toggleClass('fme-menu-opened', Settings.isMenuOpened);
});


$(document).on('contextmenu', function (e) {
  if (!Settings.isRightClickEnabled) e.preventDefault();
});

$('#delete-all-settings').on('click', function () {
  $.each(localStorage, function (key) {
    localStorage.removeItem(key);
  });

  location.reload(true);
});

// converts string 'hours:minutes' to time 12/24 hours
function convertToTime(hours = '00', minutes = '00') {
  const pad = (e, s) => (1e3 + +e + '').slice(-s);
  return new Date('1970-01-01T' + `${pad(hours, 2)}:${pad(minutes, 2)}:00` + '.000Z')
    .toLocaleTimeString({},
      { timeZone:'UTC', hour12: !Settings.isClock24Hour, hour:'numeric', minute:'numeric' }
    );
}

/**
 * Modals
 */
$('#open-clear-important-items-modal').on('click', function () {
  $('#clear-important-items-modal').modal();
});

$('#open-delete-all-settings-modal').on('click', function () {
  $('#delete-all-settings-modal').modal();
});


/**
 * Leaflet plugins
 */
L.DivIcon.DataMarkup = L.DivIcon.extend({
  _setIconStyles: function (img, name) {
    L.DivIcon.prototype._setIconStyles.call(this, img, name);

    if (this.options.marker)
      img.dataset.marker = this.options.marker;

    if (this.options.category)
      img.dataset.category = this.options.category;

    if (this.options.time) {
      var from = parseInt(this.options.time[0]);
      var to = parseInt(this.options.time[1]);

      // Add all valid hours to the marker to be able to simply `.includes()` it later.
      // Could also check `if X between start and end`, might be slightly better. ¯\_(ツ)_/¯
      var times = [];
      for (let index = from; index != to; (index != 23) ? index++ : index = 0)
        times.push(index);

      img.dataset.time = times;
    }
  }
});

L.LayerGroup.include({
  getLayerById: function (id) {
    for (var i in this._layers) {
      if (this._layers[i].id == id) {
        return this._layers[i];
      }
    }
  }
});

/**
 * Event listeners
 */

$(function () {
  init();
  FME.init()
  Dailies.init();
});

