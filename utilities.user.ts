// ==UserScript==
// @name         Utilities
// @namespace    http://tampermonkey.net/
// @version      1.17.1.0
// @description  Utilities for EyeWire
// @author       Krzysztof Kruk
// @match        https://*.eyewire.org/*
// @exclude      https://*.eyewire.org/1.0/*
// @downloadURL  https://raw.githubusercontent.com/ChrisRaven/EyeWire-Utilities/master/utilities.user.js
// ==/UserScript==

/*jshint esversion: 2021 */
/*globals $, account, tomni, THREE, scoutsLog, Cell, Utils */ 

// Source: https://stackoverflow.com/a/51913929

// import * as $ from './jquery.js';

declare const account: any;
declare const tomni: any;
declare const THREE: any;
declare const Cell: any;
declare const scoutsLog: any;
declare const Utils: any;
declare const accordion: any;

interface JQuery<TElement = HTMLElement> extends Iterable<TElement>{
  accordion(...args: any): void;
}

interface JQueryStatic {
  post(
    url: string,
    data: JQuery.PlainObject | string,
    dataType: string
  ): JQueryXHR
}




let LOCAL = false;
if (LOCAL) {
  console.log('%c--== TURN OFF "LOCAL" BEFORE RELEASING!!! ==--', "color: red; font-style: italic; font-weight: bold;");
}

(function() {
  'use strict';
  'esversion: 6';

  let K = {
    gid: function (id) {
      return document.getElementById(id);
    },
    
    qS: function (sel) {
      return document.querySelector(sel);
    },
    
    qSa: function (sel) {
      return document.querySelectorAll(sel);
    },


    addCSSFile: function (path) {
      $("head").append('<link href="' + path + '" rel="stylesheet" type="text/css">');
    },

    // Source: https://stackoverflow.com/a/6805461
    injectJS: function (text, sURL?) {
      let
        tgt,
        scriptNode = document.createElement('script');

      scriptNode.type = "text/javascript";
      if (text) {
        scriptNode.textContent = text;
      }
      if (sURL) {
        scriptNode.src = sURL;
      }

      tgt = document.getElementsByTagName('head')[0] || document.body || document.documentElement;
      tgt.appendChild(scriptNode);
    },

    injectCSS: function (rules) {
      let script = document.createElement('style');
      script.type = 'text/css';
      script.innerHTML = rules;
      let parent = document.body;
      parent.insertBefore(script, parent.childNodes[parent.childNodes.length]);
    },

    // source: https://stackoverflow.com/a/1349426
    randomString: function () {
      let text = '';
      let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    
      for (let i = 0; i < 5; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    
      return text;
    },
    
    // localStorage
    ls: {
      get: function (key) {
        return localStorage.getItem(account.account.uid + '-ews-' + key);
      },

      set: function (key, val) {
        localStorage.setItem(account.account.uid + '-ews-' + key, val);
      },

      remove: function (key) {
        localStorage.removeItem(account.account.uid + '-ews-' + key);
      }
    }
  };


  function Settings() {
    let target;
    
    this.setTarget = function (selector) {
      target = selector;
    };
    
    this.getTarget = function () {
      return target;
    };
    
    this.addCategory = function (id = 'ews-utilities-settings-group', name = 'Utilities', mainTarget = 'settingsMenu') {
      if (!K.gid(id)) {
        $('#' + mainTarget).append(`
          <div id="${id}" class="settings-group ews-settings-group invisible">
            <h1>${name}</h1>
          </div>
        `);
      }
      
      this.setTarget($('#' + id));
    };

    this.addOption = function (options) {
      let settings = {
        name: '',
        id: '',
        defaultState: false,
        indented: false
      };

      $.extend(settings, options);
      let storedState = K.ls.get(settings.id);
      let state;

      if (storedState === null) {
        K.ls.set(settings.id, settings.defaultState);
        state = settings.defaultState;
      }
      else {
        state = storedState.toLowerCase() === 'true';
      }

      target.append(`
        <div class="setting" id="${settings.id}-wrapper">
          <span>${settings.name}</span>
          <div class="checkbox ${state ? 'on' : 'off'}">
            <div class="checkbox-handle"></div>
            <input type="checkbox" id="${settings.id}" style="display: none;" ${state ? ' checked' : ''}>
          </div>
        </div>
      `);
      
      if (settings.indented) {
        (K.gid(settings.id).parentNode.parentNode as HTMLElement).style.marginLeft = '30px';
      }
      
      $(`#${settings.id}-wrapper`).click(function (evt) {
        evt.stopPropagation();

        let $elem = $(this).find('input');
        let elem = $elem[0];
        let newState = !elem.checked;

        K.ls.set(settings.id, newState);
        elem.checked = newState;

        $elem.add($elem.closest('.checkbox')).removeClass(newState ? 'off' : 'on').addClass(newState ? 'on' : 'off');
        $(document).trigger('ews-setting-changed', {setting: settings.id, state: newState});
      });
      
      $(document).trigger('ews-setting-changed', {setting: settings.id, state: state});
    };
    
    this.getValue = function (optionId) {
      let val = K.ls.get(optionId);
      
      if (val === null) {
        return undefined;
      }
      if (val.toLowerCase() === 'true') {
        return true;
      }
      if (val.toLowerCase() === 'false') {
        return false;
      }

      return val;
    };
  }

  function moveToTopBar(text) {
    let el = $("#links a:contains('" + text + "')").parent();
    el.css('display', 'none');

    let container = $('#nav ul');

    if (!container.length) {
      $('#homelogo').after('<ul id="ews-nav-bar-container"></ul>');
      container = $('#nav ul');
    }

    if (el.length) {
      container.append(el);
    }
  }

  function moveToLinks(text) {
    let el = $("#ews-nav-bar-container a:contains('" + text + "')").parent();

    if (el.length) {
      el.css('display', 'list-item');
      $('#links li:last').before(el);
    }
  }

  // Top Buttons Hiding
  function showOrHideButton(pref, state) {
    let text = '';
    switch (pref) {
      case "hide-blog": text = 'Blog'; break;
      case "hide-wiki": text = 'Wiki'; break;
      case "hide-forum": text = 'Forum'; break;
      case "hide-about": text = 'About'; break;
      case "hide-faq": text = 'FAQ'; break;
      case "hide-stats": text = 'Stats'; break;
      default: return; // to not change anything, when some other setting was changed
    }

    
    if (state) {
      moveToTopBar(text);
    }
    else {
      moveToLinks(text);
    }
  }
  // END: Top Buttons Hiding


  // Compact Scouts' Log
  function changeHtml(selector, text) {
    let el = K.qS(selector);
    if (el) {
      el.childNodes[0].nodeValue = text;
    }
  }


  function compactOrExpandScoutsLog(state) {
    if (!K.gid('scoutsLogFloatingControls')) {
      return;
    }

    if (state) {
      K.gid('scoutsLogFloatingControls').style.width = 'auto';
      K.gid('scoutsLogFloatingControls').style.padding = '1px 2px 2px 2px';
      $('#scoutsLogFloatingControls a').css({
        'margin-right': 0,
        'vertical-align': 'top',
        'width': '15px'
      });
      K.gid('sl-capture-image').style.width = '34px';
      $('#scoutsLogFloatingControls a span').css({
        'background-color': '#000',
        'padding': 0
      });
      changeHtml('.sl-cell-list', 'C');
      changeHtml('.sl-mystic', 'M');
      changeHtml('.sl-open', 'O');
      changeHtml('.sl-need-admin', 'A');
      changeHtml('.sl-need-scythe', 'S');
      changeHtml('.sl-watch', 'W');
      changeHtml('.sl-history', 'H');
      changeHtml('#sl-task-details', 'D');
      changeHtml('#sl-task-entry', 'N');
      K.qS('#scoutsLogFloatingControls img').style.display = 'none';
    }
    else {
      K.gid('scoutsLogFloatingControls').style.width = '';
      K.gid('scoutsLogFloatingControls').style.padding = '8px';
      $('#scoutsLogFloatingControls a').css({
        'margin-right': '8px',
        'vertical-align': 'top',
        'width': ''
      });
      $('#scoutsLogFloatingControls a span').css({
        'background-color': '#7a8288',
        'padding': '3px 7px'
      });
      if (!K.gid('scoutsLogFloatingControls').classList.contains('sl-vertical')) {
      changeHtml('.sl-cell-list', 'Cell List');
      changeHtml('.sl-mystic', 'Mystic ');
      changeHtml('.sl-open', 'Open Logs ');
      changeHtml('.sl-need-admin', 'Admin ');
      changeHtml('.sl-need-scythe', 'Scythe ');
      changeHtml('.sl-watch', 'Watch ');
      changeHtml('.sl-history', 'History');
      changeHtml('#sl-task-details', 'Cube Details ');
      changeHtml('#sl-task-entry', '+');
      }
      else {
        changeHtml('.sl-cell-list', 'C');
        changeHtml('.sl-mystic', 'M ');
        changeHtml('.sl-open', 'O ');
        changeHtml('.sl-need-admin', 'A ');
        changeHtml('.sl-need-scythe', 'S ');
        changeHtml('.sl-watch', 'W ');
        changeHtml('.sl-history', 'H');
        changeHtml('#sl-task-details', 'D ');
        changeHtml('#sl-task-entry', 'N');
      }
      K.qS('#scoutsLogFloatingControls img').style.display = '';
      K.gid('sl-task-entry').style.width = '24px';
    }
  }
  // END: Compact Scouts' Log


  // Remove Duplicate Segments and Regrow Seed buttons
  $('#editActions').append('<button class="reapAuxButton" id="ews-remove-duplicates-button" title="Remove Duplicate Segments">&nbsp;</button>');
  $('#editActions').append('<button class="reapAuxButton" id="ews-restore-seed-button" title="Regrow Seed">&nbsp;</button>');
  $('#editActions').append('<button class="reapAuxButton" id="ews-remove-undercolor-button" title="Remove Undercolored (left click) or Low Confidence (right click) Segments">&nbsp;</button>');

  $('#ews-restore-seed-button')
    .css({
      'color': 'white',
      'left': '50%',
      'position': 'absolute',
      'margin-top': 'auto',
      'margin-left': '315px'
    })
    .click(function () {
      tomni.f('select', {segids: tomni.task.seeds()});
    });

  $('#ews-remove-duplicates-button')
    .css({
      'color': 'white',
      'left': '50%',
      'position': 'absolute',
      'margin-top': 'auto',
      'margin-left': '270px'
    })
    .click(function () {
      let dupes = tomni.task.duplicates;
      let dupeSegs = [];

      if (dupes && dupes[0]) {
        for (let i = 0; i < dupes.length; i++) {
          dupeSegs = dupeSegs.concat(dupes[i].duplicate_segs);
        }
      }

      if (dupeSegs) {
        tomni.f('deselect', {segids: dupeSegs});
      }
    });

    $('#ews-remove-undercolor-button')
    .css({
      'color': 'white',
      'left': '50%',
      'position': 'absolute',
      'margin-top': 'auto',
      'margin-left': '175px'
    })
    .click(function () {
      if (tomni.task.reviewReq.responseJSON) {
        let undercolor = tomni.task.reviewReq.responseJSON.undercolor;
        if (undercolor && undercolor[0]) {
          tomni.f('deselect', {segids: undercolor});
        }
      }
    })
    .contextmenu(function (event) {
      event.preventDefault();
      event.stopPropagation();

      if (tomni.task.segments) {
        let lowConfidenceSegs = [];

        for (const [key, value] of Object.entries(tomni.task.segments)) {
          if (value <= 0.5) {
            lowConfidenceSegs.push(key);
          }
        }

        tomni.f('deselect', {segids: lowConfidenceSegs});
      }
    });


  function setReapAuxButtonVisibility(id, state) {
    K.gid(id).style.visibility = state ? 'visible' : 'hidden';
  }
  // END: Remove Duplicate Segments and Regrow Seed buttons


  // Datasets' Borders
  function toggleDatasetBordersVisibility() {
    let buttonState = K.ls.get('show-dataset-borders-state') === 'true';
    let showBorders = settings.getValue('show-dataset-borders-button');
    let showOrigin = settings.getValue('dataset-borders-show-origin');
    let showDuringPlay = settings.getValue('dataset-borders-show-during-play');
    let gameMode = tomni.gameMode;

    // borders should be shown only if:
    // the showButton option in Settings is true
    // the state of the button is true
    // we are not in gameMode or we are in gameMode and showDuringPlay option is true
    if (showBorders && buttonState &&
    (gameMode && showDuringPlay || !gameMode)) {
      addDatasetBorders();
      if (showOrigin) {
        addDatasetOrigin();
      }
    }
    else {
      removeDatasetBorders();
      removeDatasetOrigin();
    }
  }

  function createDatasetBordersCube(coords, filled = false) {
    let lengthX = coords.maxX - coords.minX;
    let lengthY = coords.maxY - coords.minY;
    let lengthZ = coords.maxZ - coords.minZ;

    let halfX = lengthX / 2;
    let halfY = lengthY / 2;
    let halfZ = lengthZ / 2;
    
    let material, cube;

    let box = new THREE.BoxGeometry(lengthX, lengthY, lengthZ);

    if (!filled) {
      let edges = new THREE.EdgesGeometry(box);
      material = new THREE.LineBasicMaterial({color: 0xffffff, linewidth: 1});
      cube = new THREE.LineSegments(edges, material);
    }
    else {
      material = new THREE.MeshBasicMaterial({color: 0xff9200});
      cube = new THREE.Mesh(box, material);
    }


    cube.position.set(coords.minX + halfX, coords.minY + halfY, coords.minZ + halfZ);
    
    return cube;
  }

  let datasetBordersE2198Cube = createDatasetBordersCube({
    minX: 466,  minY: 498,   minZ: 434,
    maxX: 4306, maxY: 20690, maxZ: 12786
  });

  let datasetBordersE2198OriginCube = createDatasetBordersCube({
    minX: 466,       minY: 498,       minZ: 434,
    maxX: 466 + 128, maxY: 498 + 128, maxZ: 434 + 128
  }, true);

  let datasetBordersZFishCube = createDatasetBordersCube({
    minX: 68800,  minY: 59840,  minZ: 737640,
    maxX: 423360, maxY: 230720, maxZ: 819000
  });

  let datasetBordersZFishOriginCube = createDatasetBordersCube({
    minX: 68800,        minY: 59840,        minZ: 737640,
    maxX: 68800 + 2560, maxY: 59840 + 2560, maxZ: 737640 + 2560
  }, true);

  function addDatasetBorders() {
    let dataset = (tomni && tomni.cell) ? tomni.getCurrentCell().info.dataset_id : 1;
    let world = tomni.threeD.getWorld();

    if (dataset === 1) {
      world.remove(datasetBordersZFishCube);
      world.add(datasetBordersE2198Cube);
    }
    else if (dataset === 11) {
      world.remove(datasetBordersE2198Cube);
      world.add(datasetBordersZFishCube);
    }

    tomni.threeD.render();
  }

  function removeDatasetBorders() {
    let world = tomni.threeD.getWorld();

    world.remove(datasetBordersE2198Cube);
    world.remove(datasetBordersZFishCube);

    tomni.threeD.render();
  }

  function addDatasetOrigin() {
    let dataset = (tomni && tomni.cell) ? tomni.getCurrentCell().info.dataset_id : 1;
    let world = tomni.threeD.getWorld();

    if (dataset === 1) {
      world.remove(datasetBordersZFishOriginCube);
      world.add(datasetBordersE2198OriginCube);
    }
    else if (dataset === 11) {
      world.remove(datasetBordersE2198OriginCube);
      world.add(datasetBordersZFishOriginCube);
    }

    tomni.threeD.render();
  }

  function removeDatasetOrigin() {
    let world = tomni.threeD.getWorld();

    world.remove(datasetBordersE2198OriginCube);
    world.remove(datasetBordersZFishOriginCube);

    tomni.threeD.render();
  }

  function setDatasetBorderButtonAndOptionsVisibility(state) {
    let buttonState = K.ls.get('show-dataset-borders-state') === null ? true : K.ls.get('show-dataset-borders-state') === 'true';
    let originVisibility = settings.getValue('dataset-borders-show-origin');

    
    let intv0 = setInterval(function () {
      if (!(K.gid('dataset-borders-show-origin'))) {
        return;
      }
      clearInterval(intv0);

      if (state) {
        (K.gid('dataset-borders-show-origin').parentNode.parentNode as HTMLElement).style.display = 'flex';
        (K.gid('dataset-borders-show-during-play').parentNode.parentNode as HTMLElement).style.display = 'flex';
        if (tomni && tomni.cell && buttonState) {
          addDatasetBorders();
          if (originVisibility) {
            addDatasetOrigin();
          }
        }
      }
      else {
        (K.gid('dataset-borders-show-origin').parentNode.parentNode as HTMLElement).style.display = 'none';
        (K.gid('dataset-borders-show-during-play').parentNode.parentNode as HTMLElement).style.display = 'none';
        if (tomni && tomni.cell) {
          removeDatasetBorders();
          removeDatasetOrigin();
        }
      }
      
      let intv = setInterval(function () {
        if (!K.gid('show-dataset-borders')) {
          return;
        }
        clearInterval(intv);
        
        K.gid('show-dataset-borders').style.display = state ? 'inline-block' : 'none';
      }, 100);
    }, 100);
  }

  function setDatasetOriginVisibility(state) {
    let buttonState = K.ls.get('show-dataset-borders-state') === null ? true : K.ls.get('show-dataset-borders-state') === 'true';
    let buttonVisibility = settings.getValue('show-dataset-borders-button');

    if (tomni) {
      if (state && buttonState && buttonVisibility) {
        addDatasetOrigin();
      }
      else {
        removeDatasetOrigin();
      }
    }
  }

    
  $(document).on('cell-info-ready-triggered.utilities', toggleDatasetBordersVisibility);

  $(document).on('cube-enter-triggered.utilities', function () {
    let settings = K.ls.get('settings');
    let showInCube = false;
    
    if (settings) {
      settings = JSON.parse(settings);
      showInCube = settings['dataset-borders-show-during-play'] === undefined ? true : settings['dataset-borders-show-during-play'];
    }
    
    if (!showInCube) {
      removeDatasetBorders();
      removeDatasetOrigin();
    }
    
    let d = tomni.task.duplicates;
    setReapAuxButtonVisibility('ews-remove-duplicates-button', d && d[0] && d[0].duplicate_segs.length);
  });

  $(document).on('cube-leave-triggered.utilities', function () {
    let settings = K.ls.get('settings');
    let showInCube = false;

    if (settings) {
      settings = JSON.parse(settings);
      showInCube = settings['dataset-borders-show-during-play'] === undefined ? true : settings['dataset-borders-show-during-play'];
    }
    
    // we only have to take care, when in-cube is turned off
    if (!showInCube) {
      toggleDatasetBordersVisibility();
    }
  });
  // END: Datasets' Borders


  // Scouts' Log should be compacted only when it's already visible
  let intv2 = setInterval(function () {
    if (!K.qS('.sl-cell-list')) {
      return;
    }
    clearInterval(intv2);

    $(document).trigger('ews-setting-changed', {
      setting: 'compact-scouts-log',
      state: settings.getValue('compact-scouts-log')
    });
    
      // stop leaking of shortcuts from SL
    $('#slPanel').on('keyup', '#sl-action-notes', function (evt) {//console.log(evt.which)
      if ([71, 84, 48, 49, 50, 51, 52, 53, 54].includes(evt.which)) {
        /*
          71 = g, G - go in and out of cube using "G"
          84 = t, T - custom highlight color change
          48 .. 54 = 0 .. 6 - heatmaps changing
        */
        evt.stopPropagation();
      }
    });

  }, 100);


  function submitTask() {
    // simulate clicking on the Reap button
    K.qS('#editActions .reaperButton').style.backgroundColor = '#6785c5';

    tomni.taskManager.saveTask({
      status: 'finished', 
      reap: true,
      show_leaderboard: account.can('omni') === false,
      always: function () { // TaskUI.toggleLoader from omni.js
        $('#normal-cube-loader').removeClass('onscreen');
        // bring back the Reap button to the normal state
        K.qS('#editActions .reaperButton').style.backgroundColor = '#4f74c4';
      },
      fail: function () { // taskActionButtonsSetDisabled in TaskUI from omni.js
        $('#realActions button').prop('disabled', false);
        $('#editActions button').prop('disabled', false);
        $('#reviewActions button').prop('disabled', false);
      }
    });
  }

  function complete(id? : number) {
    let cube = tomni.getCurrentCell().getTarget();

    if (!cube && !id) {
      return;
    }

    let cubeId = id || cube[0].id;

    if (tomni.gameMode && settings.getValue('jump-to-ov-after-completing')) {
      tomni.leave();
    }

    $.post('/1.0/task/' + cubeId, {
      action: 'complete',
    }, 'json')
    .done(function () {
      // voted
    });
  }
  
  let cubeStatus;

  function createAdditionalSLButtons() {
    let html = `
    <div>
      <div id="ewSLduplicate" title="Duplicate">D</div>
      <div id="ewSLmerger" title="Merger">M</div>
      <div id="ewSLAImerger" title="Seed Merger">A</div>
      <div id="ewSLwrongSeedMerger" title="Wrong Seed">S</div>
      <div id="ewSLnub" title = "Nub">N</div>
      <div id="ewSLbranch" title="Branch">B</div>
      <div id="ewSLdust" title="Dust">d</div>
      <div id="ewSLtestExtension" title="Test Extension">W</div>
    </div><div id="ewSLcomplete_wrapper">
      <div id="ewSLcomplete" title="Complete">C</div>
    </div>
    `;

    let div = document.createElement('div');
    div.id = 'ewSLbuttonsWrapper';
    div.innerHTML = html;

    K.gid('scoutsLogFloatingControls').appendChild(div);

    K.gid('ewSLcomplete').style.color = Cell.ScytheVisionColors.complete2;

    K.gid('ewSLbuttonsWrapper').style.display = settings.getValue('show-sl-shortcuts') ? 'inline-block' : 'none';

    $('#ewSLbuttonsWrapper').on('click', 'div > div', function () {
      let target = tomni.getTarget();

      if (!target) {
        return;
      }

      cubeStatus = {
        cell: tomni.getCurrentCell().cellid,
        task: target[0].id,
        reaped: true,
      };

      switch(this.id)  {
        case 'ewSLnub':
          cubeStatus.status = 'good';
          cubeStatus.issue = 'nub';
          break;
        case 'ewSLbranch':
          cubeStatus.status = 'good';
          cubeStatus.issue = 'branch';
          break;
        case 'ewSLdust':
          cubeStatus.status = 'good';
          cubeStatus.issue = 'dust';
          break;
        case 'ewSLduplicate':
          cubeStatus.status = 'good';
          cubeStatus.issue = 'duplicate';
          break;
        case 'ewSLmerger':
          cubeStatus.status = 'good';
          cubeStatus.issue = 'merger';
          break;
        case 'ewSLAImerger':
          cubeStatus.status = 'good';
          cubeStatus.issue = 'seed-merger';
          break;
        case 'ewSLtestExtension':
          cubeStatus.status = 'watch';
          cubeStatus.issue = 'test-extension';
          break;
        case 'ewSLwrongSeedMerger':
          cubeStatus.status = 'good';
          cubeStatus.issue = 'wrong-seed';
          break;
      }

      if (this.id === 'ewSLcomplete') {
        complete();
      }
      else {
        captureImage();
        if (tomni.gameMode && settings.getValue('log-and-reap')) {
          submitTask();
        }
      }
    });
  }

  // we have to wait for the bottom-right corner icons to be added to the page
  let intv3 = setInterval(function () {
    if (!K.gid('gameTools')) {
      return;
    }

    if (account.can('scout scythe mystic admin') && !K.gid('scoutsLogButton')) {
      return;
    }

    // sometimes the main() function isn't run yet, so the settings object isn't initiated,
    // and the SL buttons aren't set correctly
    if (typeof settings === 'undefined') {
      return;
    }

    clearInterval(intv3);

    $('#gameTools').prepend('<span id="show-dataset-borders" title="Show/hide dataset borders"></span>');
    let state = K.ls.get('show-dataset-borders-state');
    if (state === undefined) {
      K.ls.set('show-dataset-borders-state', true);
    }

    switchSLButtons(settings.getValue('switch-sl-buttons'));

    $('#show-dataset-borders').click(function () {
      let state = K.ls.get('show-dataset-borders-state') === 'true';
      K.ls.set('show-dataset-borders-state', !state);
      toggleDatasetBordersVisibility();
    });

    if (account.can('scout scythe mystic admin')) {
      compactInspectorPanel(K.ls.get('compact-inspector-panel') === 'true');
    }
  }, 50);

  let intv4 = setInterval(function () {
    if (!account.can('scythe mystic admin')) {
      return;
    }

    if (!K.gid('scoutsLogFloatingControls')) {
      return;
    }

    clearInterval(intv4);

    createAdditionalSLButtons();

  }, 50);




  // autorefresh show-me-me
  $(document).on('websocket-task-completions', function (event, data) {
    if (data.uid !== account.account.uid) {
      return;
    }

    let
      btn = $('.showmeme button');

    if (!btn.hasClass('on1') && settings.getValue('auto-refresh-showmeme')) {
      if (btn.hasClass('on2')) {
        btn.click().click().click();
      }
      else {
        btn.click();

        setTimeout(function () {
          btn.click();
          setTimeout(function () {
            btn.click();
          }, 500);
        }, 500);
      }

    }
  });
  // END:  autorefresh show-me-me

  // submit using Spacebar
  $('body').keydown(function (evt) {
    let btn;
    let submit = settings.getValue('submit-using-spacebar');
    let turnOffZoom = settings.getValue('turn-off-zoom-by-spacebar');

    if (evt.keyCode === 32 && tomni.gameMode && (submit || turnOffZoom)) {
      evt.stopPropagation();
      
      if (turnOffZoom && !submit) {
        return;
      }

      if (!tomni.task.inspect) {
        btn = K.gid('actionGo');
      }
      else {
        if (account.can('scythe mystic admin')) {
          btn = K.gid('saveGT');
        }
        else {
          btn = K.gid('flagCube');
        }
      }

      if (btn) {
        btn.click();
      }
    }
  });
  // END: submit using Spacebar


  function arrayOfColorsToRGBa(arr) {
    return 'rgba(' + arr.join(',') + ')';
  }

  // source: http://jsfiddle.net/User9673/J5d7h/
  function makeTextSprite(text) {
    let font = 'Arial';
    let size = 96;
    let textColor = [255, 255, 255, 1.0];

    font = 'bold ' + size + 'px ' + font;

    let canvas = document.createElement('canvas');
    let context = canvas.getContext('2d');
    context.font = font;

    // get size data (height depends only on font size)
    let metrics = context.measureText(text);
    let textWidth = metrics.width;

    canvas.width = textWidth;
    canvas.height = size - 15;

    context.font = font;
    context.fillStyle = arrayOfColorsToRGBa(textColor);
    context.fillText(text, 0, size - 20);

    // canvas contents will be used for a texture
    let texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;

    let mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(canvas.width, canvas.height),
        new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide,
            transparent: true
        })
    );
    
    let datasetId = tomni.getCurrentCell().info.dataset_id;
    if (datasetId === 1) {
      mesh.scale.set(0.25, 0.25, 1);
    }
    else if (datasetId === 11) {
      mesh.scale.set(5, 5, 1);
    }

    mesh.name = text;

    mesh.rotateY(Math.PI);
    mesh.rotateZ(-Math.PI / 2);

    return mesh;
}

  function addText(text, x, y, z) {
    let sprite = makeTextSprite(text);
    sprite.position.set(x, y, z);
    return sprite;
  }

  
  
  function showNeighboursIDs() {
    fetch('/1.0/cell/' + tomni.cell + '/tasks')
      .then((response) => { return response.json(); })
      .then((json) => {
        let children = tomni.task.children;
        let tasks = json.tasks;
        let neighbours = tasks.filter((task) => { return children.indexOf(task.id) !== -1; });
        let cell = tomni.getCurrentCell();
        let voxels = cell.world.volumes.voxels;
        let categorized = {lowX: [], lowY: [], lowZ: [], highX: [], highY: [], highZ: []};
        let world = tomni.threeD.getWorld();
        let group = new THREE.Group();
        group.name = 'neighbours';
        let tb = tomni.task.bounds;

        function categorizeEW(child) {
          let shift = 30;

          let cb = child.bounds;
          if (tb.min.x > cb.min.x) {
            group.add(addText(child.id, tb.min.x - voxels.x / 4 - categorized.lowX.length * shift, tb.min.y + voxels.y / 2, tb.min.z + voxels.z / 2));
            categorized.lowX.push(child.id);
          }
          else if (tb.max.x < cb.max.x) {
            group.add(addText(child.id, tb.max.x + voxels.x / 4 - categorized.highX.length * shift, tb.min.y + voxels.y / 2, tb.min.z + voxels.z / 2));
            categorized.highX.push(child.id);
          }
          else if (tb.min.y > cb.min.y) {
            group.add(addText(child.id, tb.min.x + voxels.x / 2 - categorized.lowY.length * shift, tb.min.y - voxels.y / 4, tb.min.z + voxels.z / 2));
            categorized.lowY.push(child.id);
          }
          else if (tb.max.y < cb.max.y) {
            group.add(addText(child.id, tb.min.x + voxels.x / 2 - categorized.highY.length * shift, tb.max.y + voxels.y / 4, tb.min.z + voxels.z / 2));
            categorized.highY.push(child.id);
          }
          else if (tb.min.z > cb.min.z) {
            group.add(addText(child.id, tb.min.x + voxels.x / 2 - categorized.lowZ.length * shift, tb.min.y + voxels.y / 2, tb.min.z - voxels.z / 4));
            categorized.lowZ.push(child.id);
          }
          else if (tb.max.z < cb.max.z) {
            group.add(addText(child.id, tb.min.x + voxels.x / 2 - categorized.highZ.length * shift, tb.min.y + voxels.y / 2, tb.max.z + voxels.z / 4));
            categorized.highZ.push(child.id);
          }
        }

        function categorizeZF(child) {
          let shift = 500;

          let cb = child.bounds;
          if (tb.min.x > cb.min.x) {
            group.add(addText(child.id, tb.min.x - voxels.x - categorized.lowX.length * shift, tb.min.y + voxels.y * 2.5, tb.min.z + voxels.z * 25));
            categorized.lowX.push(child.id);
          }
          else if (tb.max.x < cb.max.x) {
            group.add(addText(child.id, tb.max.x + voxels.x - categorized.highX.length * shift, tb.min.y + voxels.y * 2.5, tb.min.z + voxels.z * 25));
            categorized.highX.push(child.id);
          }
          else if (tb.min.y > cb.min.y) {
            group.add(addText(child.id, tb.min.x + voxels.x * 2.5 - categorized.lowY.length * shift, tb.min.y - voxels.y, tb.min.z + voxels.z * 25));
            categorized.lowY.push(child.id);
          }
          else if (tb.max.y < cb.max.y) {
            group.add(addText(child.id, tb.min.x + voxels.x * 2.5 - categorized.highY.length * shift, tb.max.y + voxels.y, tb.min.z + voxels.z * 25));
            categorized.highY.push(child.id);
          }
          else if (tb.min.z > cb.min.z) {
            group.add(addText(child.id, tb.min.x + voxels.x * 2.5 - categorized.lowZ.length * shift, tb.min.y + voxels.y * 2.5, tb.min.z - voxels.z));
            categorized.lowZ.push(child.id);
          }
          else if (tb.max.z < cb.max.z) {
            group.add(addText(child.id, tb.min.x + voxels.x * 2.5 - categorized.highZ.length * shift, tb.min.y + voxels.y * 2.5, tb.max.z + voxels.z));
            categorized.highZ.push(child.id);
          }
        }

        world.add(group);

        let datasetId = cell.info.dataset_id;
        if (datasetId === 1) {
          neighbours.forEach(categorizeEW);
        }
        else if (datasetId === 11) {
          neighbours.forEach(categorizeZF);
        }
      });
  }


  let mouse = new THREE.Vector2();
  let onClickPosition = new THREE.Vector2();
  let raycaster = new THREE.Raycaster();
  let camera = tomni.threeD.getCamera();

  let getMousePosition = function (dom, x, y) {
    let rect = dom.getBoundingClientRect();
    return [(x - rect.left) / rect.width, (y - rect.top) / rect.height];
  };

  let getIntersects = function (point, objects) {
    mouse.set((point.x * 2) - 1, - (point.y * 2) + 1);
    raycaster.setFromCamera(mouse, camera);
    return raycaster.intersectObjects(objects);
  };

  function hideNeighboursIDs() {
    let world = tomni.threeD.getWorld();
    let neighbours = world.getObjectByName('neighbours');
    if (neighbours) {
      world.remove(neighbours);
    }
  }

  document.addEventListener('dblclick', function (event) {
    if (!settings.getValue('show-childrens-ids')) {
      return;
    }

    let world = tomni.threeD.getWorld();
    let container = document.getElementById('threeD');
    let array = getMousePosition(container, event.clientX, event.clientY);
    onClickPosition.fromArray(array);
    let neighbours = world.getObjectByName('neighbours');
    if (neighbours) {
      let intersects = getIntersects(onClickPosition, neighbours.children);
      if (intersects.length) {
        tomni.taskManager.getTask({ 
          task: intersects[0].object.name,
          orientation: null,
          inspect: true
        });
      }
    }
  }, false);


  // source: https://stackoverflow.com/a/30810322
  function copyTextToClipboard(text) {
    let textArea = document.createElement("textarea");
  
    //
    // *** This styling is an extra step which is likely not required. ***
    //
    // Why is it here? To ensure:
    // 1. the element is able to have focus and selection.
    // 2. if element was to flash render it has minimal visual impact.
    // 3. less flakyness with selection and copying which **might** occur if
    //    the textarea element is not visible.
    //
    // The likelihood is the element won't even render, not even a flash,
    // so some of these are just precautions. However in IE the element
    // is visible whilst the popup box asking the user for permission for
    // the web page to copy to the clipboard.
    //
  
    // Place in top-left corner of screen regardless of scroll position.
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
  
    // Ensure it has a small width and height. Setting to 1px / 1em
    // doesn't work as this gives a negative w/h on some browsers.
    textArea.style.width = '2em';
    textArea.style.height = '2em';
  
    // We don't need padding, reducing the size if it does flash render.
    textArea.style.padding = '0';
  
    // Clean up any borders.
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
  
    // Avoid flash of white box if rendered for any reason.
    textArea.style.background = 'transparent';
  
  
    textArea.value = text;
  
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    document.execCommand('copy');

    document.body.removeChild(textArea);
  }

  $(document).click(function (event) {
    if (!settings || !settings.getValue('show-childrens-ids')) {
      return;
    }

    if (!event.shiftKey) {
      return;
    }

    let world = tomni.threeD.getWorld();
    let container = document.getElementById('threeD');
    let array = getMousePosition(container, event.clientX, event.clientY);
    onClickPosition.fromArray(array);
    let neighbours = world.getObjectByName('neighbours');
    if (neighbours) {
      let intersects = getIntersects(onClickPosition, neighbours.children);
      if (intersects.length) {
        copyTextToClipboard(intersects[0].object.name);
      }
    }
  });

  // "cube-enter-triggered", because when jumping between relatives, the "cube-leave-triggered" isn't triggered
  $(document).on('cube-enter-triggered.utilities cube-leave-triggered.utilities', function () {
    hideNeighboursIDs();
  });


  $('#showChildren').click(function () {
    if (!settings.getValue('show-childrens-ids')) {
      return;
    }

    // ideally, it should be negated, but in reality, it always has the older value at the moment of clicking
    if (tomni.visRelatives.children) {
      showNeighboursIDs();
    }
    else {
      hideNeighboursIDs();
    }
  });


  function moveFreeToTheLeftOfHighlight(state) {
    if (state) {
      $('#cubeInspectorFloatingControls .controls').prepend($('.control.freeze'));
    }
    else {
      $('.control.complete').before($('.control.freeze'));
    }
  }
  
  
  function switchSLButtons(state) {
    if (state) {
      $('#settingsButton').before($('#scoutsLogButton'));
    }
    else {
      $('#settingsButton').before($('#inspectPanelButton'));
    }
  }

  function parseTransform(t) {
    let e = t.match(/([0-9\.]+)/g),
      a = {
        x: e[4],
        y: e[5]
      },
      s = 0,
      n = {
        x: 1,
        y: 1
      },
      l = {
        x: 0,
        y: 0
      },
      i = e[0] * e[3] - e[1] * e[2];

    if (e[0] || e[1]) {
      let o = Math.sqrt(e[0] * e[0] + e[1] * e[1]);
      s = e[1] > 0 ? Math.acos(e[0] / o) : -Math.acos(e[0] / o);
      n = {
        x: o,
        y: i / o
      };
       l.x = Math.atan((e[0] * e[2] + e[1] * e[3]) / (o * o));
    }
    else if (e[2] || e[3]) {
      let r = Math.sqrt(e[2] * e[2] + e[3] * e[3]);
      s = 0.5 * Math.PI - (e[3] > 0 ? Math.acos(-e[2] / r) : -Math.acos(e[2] / r));
      n = {
        x: i / r,
        y: r
      };
      l.y = Math.atan((e[0] * e[2] + e[1] * e[3]) / (r * r));
    }
    else {
      n = {
        x: 0,
        y: 0
      };
    }

    return {
      scale: n,
      translate: a,
      rotation: s,
      skew: l
    };
  }

  // source: omni.js
  function fileRequest(url, data, file, callback) {
    let form = new FormData();
    if (data) {
      for (let i in data) {
        if (data.hasOwnProperty(i)) {
          form.append(i, data[i]);
        }
      }
    }
        
    if (file) {
      for (let o in file) {
        if (file.hasOwnProperty(o)) {
          let binaryFile = new Blob([file[o].data], { type: file[o].type });
          form.append(file[o].name, binaryFile, file[o].filename);
        }
      }
    }

    let request = new XMLHttpRequest();
    request.open("POST", url, true);
    request.withCredentials = true;
    request.onreadystatechange = function() {
      if (4 == this.readyState && 200 == this.status) {
        let response = JSON.parse(this.responseText);
        if (response.error) {
          tomni.notificationManager.addChip({title: 'Error during creating the log entry'});
        }
        else {
          let logAndReap = settings.getValue('log-and-reap');

          if (logAndReap && tomni.gameMode) {
            tomni.notificationManager.addChip({
              title: 'Logged and Reaped',
              icon: 'data:image/svg+xml;base64,' + btoa(
              `<svg xmlns="http://www.w3.org/2000/svg" height="147.37482" width="133.25226">
                <g transform="translate(29.895606,29.7)">
                  <path class="cls-1" d="m 12.46,30.3 q 7,25.42 15.67,50.07 v 0.06 a 6.61,6.61 0 0 0 0.59,1.21 c 0.3,0.46 4.24,4.23 8.56,2.66 4.32,-1.57 4.91,-7.11 5,-8 a 10.14,10.14 0 0 0 0,-2 q -8.5,-24.51 -17,-49 a 47.14,47.14 0 0 1 13.16,-3 56.25,56.25 0 0 1 17.84,2 29.82,29.82 0 0 1 5,2 c 5.79,2.86 8.66,6.3 9,6 0.34,-0.3 -2.77,-6.54 -9,-12 -12.56,-11 -29,-11.77 -34,-12 -2.49,-0.12 -4.56,-0.07 -6,0 a 8.31,8.31 0 0 0 -3,-4 7.74,7.74 0 0 0 -2,-1 c -0.19,0 -0.55,0 -1,0 -5.17,0.21 -8.82,3.77 -8.84,5 v 2 a 27.55,27.55 0 0 0 1,5 c -1,1 -2.29,2.36 -4,4 A 1.22,1.22 0 0 0 3.21,19.52 C 2.26,21 7.57,26.07 12.46,30.3 Z" style="fill:none;stroke:#eeeeee;stroke-width:6px;stroke-miterlimit:10"></path>
                </g>
            </svg>`
            )});
          }
          else {
            tomni.notificationManager.addChip({
              title: 'Log entry created',
              icon: 'data:image/svg+xml;base64,' + btoa(
              `<svg xmlns="http://www.w3.org/2000/svg" width="786" height="663.28003">
                <path d="M 580.071,243.209 C 554.143,217.28 519.668,203 483,203 449.572,203 417.969,214.867 393,236.608 368.031,214.867 336.428,203 303,203 c -36.668,0 -71.143,14.28 -97.071,40.208 -1.875,1.876 -2.929,4.419 -2.929,7.071 v 200 c 0,4.044 2.437,7.691 6.173,9.239 3.737,1.549 8.038,0.692 10.898,-2.167 C 242.223,435.199 271.674,423 303,423 c 31.326,0 60.777,12.199 82.929,34.351 0.032,0.032 0.068,0.059 0.1,0.091 0.203,0.198 0.411,0.39 0.63,0.57 0.125,0.103 0.257,0.193 0.386,0.289 0.133,0.099 0.262,0.202 0.4,0.294 0.149,0.099 0.303,0.186 0.455,0.277 0.128,0.076 0.252,0.156 0.384,0.227 0.154,0.083 0.313,0.153 0.47,0.226 0.139,0.065 0.275,0.134 0.417,0.193 0.153,0.063 0.31,0.115 0.466,0.17 0.152,0.054 0.302,0.113 0.458,0.16 0.158,0.048 0.318,0.083 0.477,0.123 0.157,0.039 0.312,0.083 0.472,0.115 0.186,0.037 0.374,0.059 0.561,0.086 0.136,0.019 0.269,0.045 0.406,0.059 0.658,0.065 1.32,0.065 1.978,0 0.137,-0.013 0.271,-0.04 0.406,-0.059 0.188,-0.026 0.375,-0.049 0.561,-0.086 0.16,-0.032 0.315,-0.076 0.472,-0.115 0.159,-0.04 0.319,-0.075 0.477,-0.123 0.156,-0.047 0.306,-0.106 0.458,-0.16 0.156,-0.056 0.312,-0.107 0.466,-0.17 0.142,-0.059 0.278,-0.128 0.417,-0.193 0.157,-0.074 0.316,-0.144 0.47,-0.226 0.131,-0.07 0.256,-0.151 0.384,-0.227 0.153,-0.091 0.307,-0.177 0.455,-0.277 0.138,-0.092 0.267,-0.195 0.4,-0.294 0.129,-0.096 0.261,-0.186 0.386,-0.289 0.219,-0.18 0.427,-0.372 0.63,-0.57 0.033,-0.032 0.068,-0.058 0.1,-0.091 C 422.222,435.2 451.674,423 483,423 c 31.326,0 60.777,12.199 82.929,34.351 1.913,1.913 4.471,2.929 7.073,2.929 1.288,0 2.588,-0.25 3.825,-0.762 3.736,-1.548 6.173,-5.194 6.173,-9.239 v -200 c 0,-2.652 -1.054,-5.195 -2.929,-7.07 z M 223,428.68 V 254.519 C 244.786,234.162 273.035,223 303,223 c 29.967,0 58.213,11.171 80,31.531 V 428.685 C 359.834,412.003 332.11,403 303,403 c -29.108,0 -56.834,8.999 -80,25.68 z m 340,0 C 539.834,411.999 512.108,403 483,403 c -29.11,0 -56.834,9.002 -80,25.685 V 254.531 C 424.787,234.171 453.033,223 483,223 c 29.965,0 58.214,11.162 80,31.519 z" style="fill:#eeeeee;stroke:#eeeeee;stroke-width:6px;stroke-miterlimit:10"/>
              </svg>`
            )});
          }
        }

        callback(response);
      }
      if (4 == this.readyState && 200 != this.status) {
        tomni.notificationManager.addChip({title:'Error during creating the log entry'});
      }
    };
    request.send(form);
  }

  function captureImage() {
    let cellId = tomni.getCurrentCell().id;
    let taskId = tomni.getTarget()[0].id;
    let userName = account.account.username;

    if ($('#threeDCanvas').length) {
      tomni.threeD.render();
    }

    if ($('#twoD').length && tomni.gameMode) {
      tomni.twoD.render();
    }
    
    let threeDCanvas = <HTMLCanvasElement>$('#threeDCanvas')[0];
    let scr = document.createElement('canvas');
    scr.height = threeDCanvas.height;
    scr.width = threeDCanvas.width;
    let scrCtx = scr.getContext('2d');

    scrCtx.imageSmoothingEnabled = false;
    scrCtx.beginPath();
    scrCtx.rect(0, 0, threeDCanvas.width, threeDCanvas.height);
    scrCtx.fillStyle = '#232323';
    scrCtx.fill();

    let twoDCanvas = <HTMLCanvasElement>$('#twoD')[0];
    if (twoDCanvas && tomni.gameMode) {
    let twoDParent = $('#twoD').parent()[0],
      minX = Math.floor((threeDCanvas.width - twoDParent.clientWidth) / 2),
      maxX = Math.floor(threeDCanvas.width / 2);
    scrCtx.drawImage(threeDCanvas, minX, 0, maxX, threeDCanvas.height, 0, 0, maxX, threeDCanvas.height);
    let g = parseTransform($(twoDCanvas).css('transform')),
      m = parseFloat($(twoDCanvas).css('left')),
      p = -1 * parseFloat($(twoDCanvas).css('bottom')),
      h = {
        x: 0,
        y: 0
      },
      threeDCanvasDims = {
        x: maxX,
        y: threeDCanvas.height
      },
      b = {
        x: (maxX - twoDCanvas.width * g.scale.x) / 2 + m,
        y: (threeDCanvas.height - twoDCanvas.height * g.scale.y) / 2 + p
      },
      twoDCanvasDims = {
        x: b.x + twoDCanvas.width * g.scale.x,
        y: b.y + twoDCanvas.height * g.scale.y
      },
      Q = {
        x: Math.max(h.x, b.x),
        y: Math.max(h.y, b.y)
      },
      v = {
        x: Math.min(threeDCanvasDims.x, twoDCanvasDims.x),
        y: Math.min(threeDCanvasDims.y, twoDCanvasDims.y)
      },
      S = {
        x: b.x < Q.x ? Math.abs(Q.x - b.x) / g.scale.x < 0 ? 0 : Math.abs(Q.x - b.x) / g.scale.x > twoDCanvas.width ? twoDCanvas.width - 1 : Math.abs(Q.x - b.x) / g.scale.x : 0,
        y: b.y < Q.y ? Math.abs(Q.y - b.y) / g.scale.y < 0 ? 0 : Math.abs(Q.y - b.y) / g.scale.y > twoDCanvas.height ? twoDCanvas.height - 1 : Math.abs(Q.y - b.y) / g.scale.y : 0,
        w: Math.abs((v.x - Q.x) / g.scale.x),
        h: Math.abs((v.y - Q.y) / g.scale.y)
      };
    scrCtx.drawImage(twoDCanvas, S.x, S.y, S.w, S.h, maxX + Q.x, Q.y, v.x - Q.x, v.y - Q.y);
    scrCtx.beginPath();
    scrCtx.setLineDash([3, 3]);
    scrCtx.moveTo(maxX + 0.5, 0);
    scrCtx.lineTo(maxX + 0.5, threeDCanvas.height);
    scrCtx.lineWidth = 1;
    scrCtx.strokeStyle = '#888';
    scrCtx.stroke();
    scrCtx.beginPath();
    scrCtx.rect(5, 5, 300, 88);
    scrCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    scrCtx.fill();

    let w = tomni.twoD.axis;
    scrCtx.font = 'normal 10pt sans-serif';
    scrCtx.fillStyle = '#bbb';
    scrCtx.fillText('Cell: ' + cellId, 10, 23);
    scrCtx.fillText('Cube: ' + taskId, 10, 43);
    scrCtx.fillText('Plane: ' + w, 10, 63);
    scrCtx.fillText('User: ' + userName, 10, 83);
  }
  else {
    scrCtx.drawImage(threeDCanvas, 0, 0);
    scrCtx.beginPath();
    scrCtx.rect(5, 5, 300, 48);
    scrCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    scrCtx.fill();
    scrCtx.font = 'normal 10pt sans-serif';
    scrCtx.fillStyle = '#bbb';
    scrCtx.fillText('Cell: ' + cellId, 10, 23);
    scrCtx.fillText('User: ' + userName, 10, 43);
  }

  let k = scoutsLog && scoutsLog.slScoutsLogAPIbase ? scoutsLog.slScoutsLogAPIbase : "https://scoutslog.org/1.1/";
  let s = scr.toDataURL('image/png');
  let n = atob(s.split(",")[1]);

  
  let l = s.split(",")[0].split(":")[1].split(";")[0];
  let i = new ArrayBuffer(n.length);
  let o = new Uint8Array(i);

  for (let r = 0; r < n.length; r++) {
    o[r] = n.charCodeAt(r);
  }
  fileRequest(k + "task/" + encodeURIComponent(taskId) + "/action/create/upload", {
    data: JSON.stringify(cubeStatus)
  }, [{
    name: "image",
    filename: "capture.png",
    type: l,
    data: i
  }], function () {
    return;
  });

}

// source: https://stackoverflow.com/a/30893294
function switchReapMode(logAndReap) {
  let reapButton: { [key: string]: any } = K.gid('saveGT');


  if (logAndReap) {
    reapButton.removeEventListener('click', submitTask); // turn off submitting without the new popup

    if (reapButton.clickFunctions) {
      for (let i = 0; i < reapButton.clickFunctions.length; i++) {
          $(reapButton).click(reapButton.clickFunctions[i]);
      }
      reapButton.clickFunctions = null;
    }
  }
  else {
    reapButton.clickFunctions = [];
    let click = $.data(reapButton, 'events').click;
    for(let i = 0; i < click.length; i++) {
        reapButton.clickFunctions.push(click[i].handler);
    }
    $(reapButton).off('click');

    reapButton.addEventListener('click', submitTask); // submit without the new popup
  }
}

function compactInspectorPanel(compacted) {
  if (compacted) {
    $('#cubeInspectorFloatingControls .controls .control').css('width', 'auto');
    $('#cubeInspectorFloatingControls .controls .control>button, #cubeInspectorFloatingControls .controls .control>div').css({
      width: 24,
      'margin-bottom': 'auto'
    });
    $('#cubeInspectorFloatingControls .controls .control .children, #cubeInspectorFloatingControls .controls .control .parents').css({
      height: 24
    });
    $('#cubeInspectorFloatingControls .control').css('width', 25);
    $('.down-arrow, .up-arrow').css('background-size', '20px 20px');
    $('#x-counter').css({
      bottom: 7,
      'margin-left': -0.5
    });
    $('#cubeInspectorFloatingControls').css({
      padding: 0,
      height: 85
    });
    $('#cubeInspectorFloatingControls .info').css('width', 106);
    $('#cubeInspectorFloatingControls .info .minimalButton').css('width', 40);
    $('#cubeInspectorFloatingControls .controls .showmeme .parents, #cubeInspectorFloatingControls .controls .inspect .parents').css({
      'margin-top': 2
    });
    $('.flat, .flat:active, .flat:hover').each(function () {
      this.style.setProperty('border-radius', '8px', 'important');
    });
    $('#ews-current-color-indicator').css({
      top: 40,
      left: 16
    });
  }
  else {
    $('#cubeInspectorFloatingControls .controls .control').css('width', 40);
    $('#cubeInspectorFloatingControls .controls .control>button, #cubeInspectorFloatingControls .controls .control>div').css({
      width: 32,
      'margin-bottom': 7
    });
    $('#cubeInspectorFloatingControls .controls .control .children, #cubeInspectorFloatingControls .controls .control .parents').css({
      height: 32
    });
    $('#cubeInspectorFloatingControls .control').css('width', 40);
    $('.down-arrow, .up-arrow').css('background-size', '27px 27px');
    $('#x-counter').css({
      bottom: 6,
      'margin-left': -3.5
    });
    $('#cubeInspectorFloatingControls').css({
      padding: 7,
      height: 109
    });
    $('#cubeInspectorFloatingControls .info').css('width', 150);
    $('#cubeInspectorFloatingControls .info .minimalButton').css('width', 55);
    $('#cubeInspectorFloatingControls .controls .showmeme .parents, #cubeInspectorFloatingControls .controls .inspect .parents').css({
      'margin-top': 'auto'
    });
    $('.flat, .flat:active, .flat:hover').each(function () {
      this.style.setProperty('border-radius', '999px', 'important');
    });
    $('#ews-current-color-indicator').css({
      top: 56,
      left: 22
    });
  }
}


  $(document).on('ews-setting-changed', function (evt, data) {
    switch (data.setting) {
      case 'hide-blog':
      case 'hide-about':
      case 'hide-faq':
      case 'hide-forum':
      case 'hide-stats':
      case 'hide-wiki':
        showOrHideButton(data.setting, data.state);
        break;
      case 'compact-scouts-log':
        compactOrExpandScoutsLog(data.state);
        break;
      case 'show-restore-seed-button':
        setReapAuxButtonVisibility('ews-restore-seed-button', data.state);
        break;
      case 'show-remove-duplicate-segs-button':
        setReapAuxButtonVisibility('ews-remove-duplicates-button', data.state);
        break;
      case 'show-remove-undercolor-segs-button':
        setReapAuxButtonVisibility('ews-remove-undercolor-button', data.state);
        break;
      case 'show-dataset-borders-button':
        setDatasetBorderButtonAndOptionsVisibility(data.state);
        break;
      case 'dataset-borders-show-origin':
        setDatasetOriginVisibility(data.state);
        break;
      case 'dataset-borders-show-during-play':
        if (data.state) {
          toggleDatasetBordersVisibility();
        }
        else if (tomni.gameMode) {
          removeDatasetBorders();
          removeDatasetOrigin();
        }
        break;
      case 'move-freeze-to-the-left-of-highlight':
        moveFreeToTheLeftOfHighlight(data.state);
        break;
      case 'switch-sl-buttons':
        switchSLButtons(data.state);
        break;
      case 'show-childrens-ids':
        if (tomni.getMode && tomni.visRelatives.children && data.state) {
          showNeighboursIDs();
        }
        else {
          hideNeighboursIDs();
        }
        break;
      case 'show-sl-shortcuts':
        if (K.gid('ewSLbuttonsWrapper')) {
          K.gid('ewSLbuttonsWrapper').style.display = data.state ? 'inline-block' : 'none';
        }
        break;
      case 'log-and-reap':
        switchReapMode(data.state);
        break;
      case 'compact-inspector-panel':
        compactInspectorPanel(data.state);
        break;
    }
  });


  let settings;
  let accordionApplied = false;

  function main() {
      
    if (!K.ls.get('utilities-settings-2018-03-27-update')) {
      let props = K.ls.get('settings');
      if (props) {
        props = JSON.parse(props);
        Object.keys(props).forEach(function (key, index) {
          if (key.indexOf('ews-') === 0) {
            K.ls.set(key.slice(4), props[key]);
          }
          else if (key.indexOf('ew-') === 0) {
            K.ls.set(key.slice(3), props[key]);
          }
          else {
            K.ls.set(key, props[key]);
          }
        });
        K.ls.remove('settings');
      }

      K.ls.set('utilities-settings-2018-03-27-update', true);
    }
    
    
    if (LOCAL) {
      K.addCSSFile('http://127.0.0.1:8887/styles.css');
    }
    else {
      K.addCSSFile('https://chrisraven.github.io/EyeWire-Utilities/styles.css?v=9');
    }
    
    K.injectJS(`
      $(window)
        .on('cell-info-ready', function (e, data) {
          $(document).trigger('cell-info-ready-triggered.utilities', data);
        })
        .on('cube-enter', function (e, data) {
          $(document).trigger('cube-enter-triggered.utilities', data);
        })
        .on('cube-leave', function (e, data) {
          $(document).trigger('cube-leave-triggered.utilities', data);
        });
      `);

      
    settings =  new Settings();
    settings.addCategory();

    if (account.can('scout scythe mystics admin')) {
      settings.addOption({
        name: 'Compact horizontal Scout\'s Log',
        id: 'compact-scouts-log'
      });
    }
    
    if (account.can('scythe mystic admin')) {
      settings.addOption({
        name: 'Auto Refresh ShowMeMe',
        id: 'auto-refresh-showmeme'
      });

      settings.addOption({
        name: 'Show Regrow Seed button',
        id: 'show-restore-seed-button'
      });

      settings.addOption({
        name: 'Show Remove Dupes button',
        id: 'show-remove-duplicate-segs-button'
      });

      settings.addOption({
        name: 'Show "Remove Undercolor/Low Confidence" button',
        id: 'show-remove-undercolor-segs-button',
        defaultState: true
      });

      settings.addOption({
        name: 'Scouts\' Log shortcuts',
        id: 'show-sl-shortcuts',
        defaultState: true
      });

      settings.addOption({
        name: 'Log and Reap',
        id: 'log-and-reap',
        indented: true,
        defaultState: true
      });

      settings.addOption({
        name: 'Auto Complete',
        id: 'auto-complete',
        defaultState: false
      });

      settings.addOption({
        name: 'Jump to OV after completing',
        id: 'jump-to-ov-after-completing',
        defaultState: true
      });
    }
    
    settings.addOption({
      name: 'Show Dataset Borders button',
      id: 'show-dataset-borders-button',
      defaultState: false
    });
      settings.addOption({
        name: 'Show origin',
        id: 'dataset-borders-show-origin',
        defaultState: true,
        indented: true
      });
      settings.addOption({
        name: 'Show during play/inspect',
        id: 'dataset-borders-show-during-play',
        defaultState: true,
        indented: true
      });

    settings.addOption({
      name: 'Submit using Spacebar',
      id: 'submit-using-spacebar'
    });

    settings.addOption({
      name: 'Don\'t rotate OV while in cube',
      id: 'dont-rotate-ov-while-in-cube'
    });

    if (account.can('scout scythe mystic admin')) {
      settings.addOption({
        name: 'Show children\'s IDs',
        id: 'show-childrens-ids'
      });

      settings.addOption({
        name: 'Compact Inspector Panel',
        id: 'compact-inspector-panel',
        defaultState: false
      });

      settings.addOption({
        name: 'Piercing remove in 3D',
        id: 'piercing-remove',
        defaultState: false
      });

      settings.addOption({
        name: 'Ranged remove in 3D',
        id: 'ranged-remove',
        defaultState: false
      });
    }

    settings.getTarget().append('<div class="setting"><div class="minimalButton" id="ews-additional-options">Additional Options</div></div>');
    
    settings.addCategory('ews-utilities-top-buttons-settings-group', 'Top buttons');
    settings.addOption({
      name: 'Blog',
      id: 'hide-blog'
    });

    settings.addOption({
      name: 'Wiki',
      id: 'hide-wiki'
    });

    settings.addOption({
      name: 'Forum',
      id: 'hide-forum'
    });

    settings.addOption({
      name: 'About',
      id: 'hide-about'
    });

    settings.addOption({
      name: 'FAQ',
      id: 'hide-faq'
    });

    if (K.gid('ewsLinkWrapper')) {
      settings.addOption({
        name: 'Stats',
        id: 'hide-stats'
      });
    }

    
    $('body').append('<div class="help-menu black more" id="ews-additional-options-popup"></div>');
    
    settings.addCategory('ews-additional-options-category', 'Additional Options', 'ews-additional-options-popup');
    settings.addOption({
      name: 'Turn off zooming using Spacebar',
      id: 'turn-off-zoom-by-spacebar'
    });
    if (account.can('scout scythe mystic admin')) {
      settings.addOption({
        name: 'Go in and out of cube using "G"',
        id: 'go-in-and-out-of-cube-using-g'
      });
      settings.addOption({
        name: 'Switch SL buttons',
        id: 'switch-sl-buttons'
      });
    }
    if (account.can('scythe mystic admin')) {
      settings.addOption({
        name: 'Move Freeze to the left of Highlight',
        id: 'move-freeze-to-the-left-of-highlight'
      });
    }
    
    let popupStatus = 'closed';
    
    $('#ews-additional-options').click(function () {
      let popup = K.gid('ews-additional-options-popup');
      popup.style.display = 'block';

      let windowWidth = $(window).width();
      let windowHeight = $(window).height();
      let popupWidth = popup.clientWidth;
      let popupHeight = popup.clientHeight;

      popup.style.left = (windowWidth / 2 - popupWidth / 2) + 'px';
      popup.style.top = (windowHeight / 2 - popupHeight / 2) + 'px';
      
      popupStatus = 'opened';
    });
    
    $(document).on('click', function (evt) {
      if ((evt.target as unknown as HTMLElement).id !== 'ews-additional-options-popup' && popupStatus === 'opened') {
        K.gid('ews-additional-options-popup').style.display = 'none';
        popupStatus = 'closed';
      }
    });

    if (account.can('scout scythe mystic admin')) {
      $(document).on('keyup', function (evt) {
        if (evt.key !== 'g' && evt.key !== 'G') {
          return;
        }

        if (settings.getValue('go-in-and-out-of-cube-using-g')) {
          if (tomni.gameMode) {
            tomni.leave();
          }
          else if (tomni.getTarget() !== null) {
            tomni.play({inspect: tomni.getTarget()[0].id});
          }
        }
      });
    }

    if (account.can('scythe mystic')) { // admins already have te button
      $('.control.inspect').first().after('<div class="control remesh" id="utilities-scythe-remesh" style="width: 25px;"><div class="children translucent flat" style="width: 24px; margin-bottom: auto; height: 24px; border-radius: 8px !important;"></div><button class="cube translucent flat minimalButton active" title="Mesh ( + )" style="width: 24px; margin-bottom: auto; border-radius: 8px !important;">M</button><div class="parents translucent flat" style="width: 24px; margin-bottom: auto; height: 24px; border-radius: 8px !important;"></div></div>');

      $('#utilities-scythe-remesh').click(function () {
        let target = tomni.getTarget();
        if (!target) {
          return;
        }

        let currentCubeId = target[0].id;
        if (!currentCubeId) {
          return;
        }

        $.post('/1.0/task/' + currentCubeId + '/remesh');
      });
    }

  }

  $(document).on('cube-submission-data', function (evt, data) {
    if (settings.getValue('auto-complete') && data.special === 'scythed') {
      complete(data.task_id);
    }
  });


  $('#settingsButton').click(function () {
    $('#settingsMenu')
      .addClass('more')
      .trigger('resize');

    if (!accordionApplied) {
      accordionApplied = true;
      
      let parent = K.qS('.sl-setting-group');
      if (parent) {
        parent.insertBefore(K.gid('compact-scouts-log-wrapper'), null);
        parent.insertBefore(K.gid('show-sl-shortcuts-wrapper'), null);
        parent.insertBefore(K.gid('log-and-reap-wrapper'), null);
      }


      $('.settings-group, .sl-setting-group').each(function () {
        $(this).children().first().unwrap();
      });

      K.qSa('#settingsMenu h1').forEach(function (el) {
        let newElement = document.createElement('div');
        el.parentNode.insertBefore(newElement, el.nextElementSibling);
        let cursor = el.nextElementSibling.nextElementSibling;
        while (cursor && cursor.tagName === 'DIV') {
          newElement.appendChild(cursor);
          cursor = el.nextElementSibling.nextElementSibling; // previous element from this position was moved, so the same path will guide to the next el
        }
      });

      $('#settingsMenu').accordion({
        header: 'h1',
        heightStyle: 'content'
      });

      let trackerWindowSliderTitle = K.gid('activityTrackerWindowSlider').previousElementSibling;
      (trackerWindowSliderTitle as HTMLElement).style.marginLeft = '30px';
      trackerWindowSliderTitle.innerHTML = 'Visible cubes';

      parent = trackerWindowSliderTitle.parentNode;
      parent.style.display = 'block';

      let newTitle = document.createElement('div');
      newTitle.innerHTML = 'Activity Tracker';
      newTitle.style.fontWeight = '800';
      newTitle.style.marginBottom = '15px';
      trackerWindowSliderTitle.parentElement.insertBefore(newTitle, trackerWindowSliderTitle);
      
      let trackerJumpSettingTitle = K.gid('atOverviewJumpSetting');
      trackerJumpSettingTitle.style.display = 'block';
      trackerJumpSettingTitle.style.paddingRight = '0';
      let span = trackerJumpSettingTitle.getElementsByTagName('span')[0];
      span.style.marginLeft = '30px';
      span.style.marginRight = '65px';
      span.innerHTML = 'Jump to:';

      let slider = K.qS('#atOverviewJumpSetting div.checkbox');
      slider.style.display = 'inline-block';
      slider.style.float = 'none';
      slider.style.verticalAlign = 'bottom';
      slider.style.marginLeft = '15px';
      slider.style.marginRight = '15px';

      let before = document.createElement('span');
      before.style.fontSize = '9px';
      before.innerHTML = 'In Cube';
      slider.parentElement.insertBefore(before, slider);

      let after = document.createElement('span');
      after.style.fontSize = '9px';
      after.style.marginRight = '15px';
      after.innerHTML = 'Overview';
      slider.parentElement.insertBefore(after, slider.nextSibling);

      
      let el = K.gid('chatVolumeSlider').parentElement;
      parent = el.parentElement.parentElement;
      parent.insertBefore(el, parent.firstChild);
      parent.insertBefore(K.gid('sfxVolumeSlider').parentElement, parent.firstChild);
      parent.insertBefore(K.gid('musicVolumeSlider').parentElement, parent.firstChild);

      let sliderParent = K.gid('activityTrackerWindowSlider').parentElement.parentElement;

      parent.insertBefore(K.gid('planeSlider').parentElement, sliderParent);

      el = K.gid('em3d').parentElement.parentElement;
      el.getElementsByTagName('span')[0].innerHTML = 'EM Images in 3D';
      el.style.marginTop = '-5px';
      parent.insertBefore(el, sliderParent);

      $('#colorSlider').parent().unwrap();

      K.gid('heatmaplegendspref').parentElement.parentElement.getElementsByTagName('span')[0].innerHTML = 'Heatmap Legend';
      K.gid('downsampleAmount').parentElement.parentElement.getElementsByTagName('span')[0].innerHTML = '3D Smoothing (ZFish)';

      let preloadCubes = K.gid('preloadCubes').parentElement.parentElement;
      preloadCubes.style.display = 'block';

      let preloadCubesTitle = preloadCubes.getElementsByTagName('span')[0];
      preloadCubesTitle.style.display = 'inline-block';
      preloadCubesTitle.style.marginLeft = '30px';
      preloadCubesTitle.innerHTML = 'Preload cubes';

      newTitle = document.createElement('div');
      newTitle.innerHTML = 'Experimental Features';
      newTitle.style.fontWeight = '800';
      newTitle.style.marginBottom = '15px';
      preloadCubesTitle.parentElement.insertBefore(newTitle, preloadCubesTitle);

      let experimentalFeaturesTitle = K.gid('experimentalFeatures').parentElement.parentElement.getElementsByTagName('span')[0];
      experimentalFeaturesTitle.style.display = 'inline-block';
      experimentalFeaturesTitle.style.marginLeft = '30px';
      experimentalFeaturesTitle.innerHTML = 'Enable 3D select (f key)';

      let playerActivityIcons = K.gid('playerActivityIcons').parentElement.parentElement;
      playerActivityIcons.style.display = 'block';

      let playerActivityIconsTitle = playerActivityIcons.getElementsByTagName('span')[0];
      playerActivityIconsTitle.style.display = 'inline-block';
      playerActivityIconsTitle.style.marginLeft = '30px';

      newTitle = document.createElement('div');
      newTitle.innerHTML = 'Live Overview';
      newTitle.style.fontWeight = '800';
      newTitle.style.marginBottom = '15px';
      playerActivityIconsTitle.parentElement.insertBefore(newTitle, playerActivityIconsTitle);

      let playerAnonActivityIconsTitle = K.gid('playerAnonActivityIcons').parentElement.parentElement.getElementsByTagName('span')[0];
      playerAnonActivityIconsTitle.style.display = 'inline-block';
      playerAnonActivityIconsTitle.style.marginLeft = '30px';

      let outlineGlowSliderTitle = K.gid('outlineGlowSlider').parentElement.getElementsByTagName('span')[0];
      outlineGlowSliderTitle.style.display = 'inline-block';
      outlineGlowSliderTitle.style.marginLeft = '30px';
    }
  });

  

  let cameraProps, tomniRotation, threeDZoom;

  function save() {
    if (!settings.getValue('dont-rotate-ov-while-in-cube')) {
      return;
    }

    let camera = tomni.threeD.getCamera();

    tomniRotation = {
      x: tomni.center.rotation.x,
      y: tomni.center.rotation.y,
      z: tomni.center.rotation.z
    };

    threeDZoom = tomni.threeD.zoom;

    cameraProps = {
      position: {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z
      },
      rotation: {
        x: camera.rotation.x,
        y: camera.rotation.y,
        z: camera.rotation.z
      },
      up: {
        x: camera.up.x,
        y: camera.up.y,
        z: camera.up.z
      },
      fov: camera.fov
    };
   }

  function restore() {
    if (!settings.getValue('dont-rotate-ov-while-in-cube')) {
      return;
    }

    let camera = tomni.threeD.getCamera();
 
    camera.fov = cameraProps.fov;
    camera.position.set(cameraProps.position.x, cameraProps.position.y, cameraProps.position.z);
    camera.rotation.set(cameraProps.rotation.x, cameraProps.rotation.y, cameraProps.rotation.z);
    camera.up.set(cameraProps.up.x, cameraProps.up.y, cameraProps.up.z);
    tomni.center.rotation.set(tomniRotation.x, tomniRotation.y, tomniRotation.z);
    tomni.threeD.zoom = threeDZoom;
    camera.updateProjectionMatrix();
    tomni.forceRedraw();
  }

  $(document).on('cube-enter-triggered.utilities', save);
  $(document).on('cube-leave-triggered.utilities', restore);


  let isZKeyPressed = false;

  $(document)
    .keydown(function (e) {
      if (!tomni.task || !tomni.task.inspect) {
        return;
      }

      if (e.key == 'Z' || e.key == 'z') {
        isZKeyPressed = true;
        if (settings.getValue('ranged-remove')) {
          K.gid('threeDCanvas').style.setProperty('cursor', getComputedStyle(document.getElementById('twoD')).cursor  , 'important');
        }
      }
    })
    .keyup(function (e) {
      if (!tomni.task || !tomni.task.inspect) {
        return;
      }

      if (e.key == 'Z' || e.key == 'z') {
        isZKeyPressed = false;
        if (settings.getValue('ranged-remove')) {
          K.gid('threeDCanvas').style.setProperty('cursor', 'pointer', 'important');
        }
      }
    });

  // from omni.js - TwoD.paint()
  let diameters = {
    1: 1,
    2: 25,
    3: 50,
    4: 100
  };

  $('#threeDCanvas').contextmenu(function (e) {
    if (!tomni.task || !tomni.task.inspect) {
      return;
    }

    let brushSize = 1;

    if (settings.getValue('ranged-remove')) {
      brushSize = Math.ceil(diameters[tomni.prefs.get('brush_size')] / 2);
    }

    if (isZKeyPressed && settings.getValue('piercing-remove')) {
      let offset = Utils.UI.eventOffset($('#threeDCanvas'), e);
      let seg;
      let segs = [];
      while (seg = tomni.threeD.getId(offset, brushSize, 'segid')) { // jshint ignore:line
        tomni.threeD.removeSegment(seg);
        segs.push(seg);
      }
      tomni.f('deselect', {segids: segs});
    }
  });


  let intv = setInterval(function () {
    if (typeof account === 'undefined' || !account.account.uid) {
      return;
    }
    clearInterval(intv);
    main();
  }, 100);


})();
