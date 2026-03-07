(function () {
  'use strict';

  const STORAGE_KEY = 'turnaround_schedule_v2';
  const SCHEDULE_NAME = 'Dash 8-400 25min Turn';

  const DEFAULT_PHASES = [
    { id: 'p1', name: 'Freight closed for acceptance', offsetMinutes: -60 },
    { id: 'p2', name: 'Load Instruction Report (LIR) received', offsetMinutes: -50 },
    { id: 'p3', name: 'Pre boards at gate, flight closed for check-in', offsetMinutes: -30 },
    { id: 'p4', name: 'Aircraft on blocks', offsetMinutes: -25 },
    { id: 'p5', name: 'Catering exchange commences', offsetMinutes: -23 },
    { id: 'p6', name: 'Deboarding complete, cabin cleaning commences', offsetMinutes: -20 },
    { id: 'p7', name: 'Pre-board at aircraft, general boarding starts', offsetMinutes: -17 },
    { id: 'p8', name: 'First passenger at aircraft', offsetMinutes: -16 },
    { id: 'p9', name: 'Catering exchange complete', offsetMinutes: -12 },
    { id: 'p10', name: 'Fail to board process starts', offsetMinutes: -10 },
    { id: 'p11', name: 'All passengers onboard', offsetMinutes: -7 },
    { id: 'p12', name: 'First load clearance, cargo door close', offsetMinutes: -5 },
    { id: 'p13', name: 'Final load sheet submitted by Crew', offsetMinutes: -4 },
    { id: 'p14', name: 'Doors closed', offsetMinutes: -3 },
    { id: 'p15', name: 'Aircraft off blocks', offsetMinutes: 0 },
  ];

  function loadSchedule() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return JSON.parse(JSON.stringify(DEFAULT_PHASES));
      const list = JSON.parse(raw);
      if (Array.isArray(list) && list.length > 0) {
        return list.map(function (p) {
          return {
            id: p.id || 'p' + p.offsetMinutes,
            name: p.name || '',
            offsetMinutes: Number(p.offsetMinutes),
          };
        });
      }
    } catch (_) {}
    return JSON.parse(JSON.stringify(DEFAULT_PHASES));
  }

  function saveSchedule(phases) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(phases));
  }

  /**
   * Parse time string to minutes since midnight.
   * Accepts: "1040", "10:40", "940" (9:40), "14" (14:00).
   * Returns null if invalid.
   */
  function parseTime(value) {
    var trimmed = String(value).trim();
    var h, m;

    if (/^\d{1,2}:\d{2}$/.test(trimmed)) {
      var parts = trimmed.split(':');
      h = parseInt(parts[0], 10);
      m = parseInt(parts[1], 10);
    } else if (/^\d{1,4}$/.test(trimmed)) {
      if (trimmed.length === 4) {
        h = parseInt(trimmed.slice(0, 2), 10);
        m = parseInt(trimmed.slice(2, 4), 10);
      } else if (trimmed.length === 3) {
        h = parseInt(trimmed.slice(0, 1), 10);
        m = parseInt(trimmed.slice(1, 3), 10);
      } else if (trimmed.length === 2) {
        h = parseInt(trimmed, 10);
        m = 0;
      } else {
        h = parseInt(trimmed, 10);
        m = 0;
      }
    } else {
      return null;
    }

    if (h < 0 || h > 23 || m < 0 || m > 59) return null;
    return h * 60 + m;
  }

  function formatTime(totalMinutes) {
    var day = 24 * 60;
    totalMinutes = ((totalMinutes % day) + day) % day;
    var h = Math.floor(totalMinutes / 60);
    var m = totalMinutes % 60;
    return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
  }

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // --- State ---
  var phases = loadSchedule();
  var anchorIndex = null;
  var isApplying = false;

  var mainScreen = document.getElementById('mainScreen');
  var editScreen = document.getElementById('editScreen');
  var phaseListEl = document.getElementById('phaseList');
  var editListEl = document.getElementById('editList');
  var editScheduleBtn = document.getElementById('editScheduleBtn');
  var saveScheduleBtn = document.getElementById('saveScheduleBtn');
  var scheduleNameEl = document.getElementById('scheduleName');

  function applyScheduleFromAnchor(anchorMinutes) {
    if (anchorIndex == null) return;
    var anchorOffset = phases[anchorIndex].offsetMinutes;
    var inputs = phaseListEl.querySelectorAll('.timeline-input');
    isApplying = true;
    for (var i = 0; i < phases.length; i++) {
      var diff = phases[i].offsetMinutes - anchorOffset;
      var minutes = anchorMinutes + diff;
      inputs[i].value = formatTime(minutes);
    }
    isApplying = false;
  }

  /**
   * Called only when user commits a time: Enter key or blur.
   * Parse value, set as anchor, fill all times, and show formatted value in the field.
   */
  function commitTime(index, inputEl) {
    if (isApplying) return;
    var value = inputEl.value.trim();
    if (!value) return;
    var minutes = parseTime(value);
    if (minutes == null) return;

    anchorIndex = index;
    phaseListEl.querySelectorAll('.timeline-row').forEach(function (row, i) {
      row.classList.toggle('anchor', i === index);
    });
    applyScheduleFromAnchor(minutes);
    inputEl.value = formatTime(minutes);
  }

  function renderMainScreen() {
    phaseListEl.innerHTML = '';
    phases.forEach(function (phase, index) {
      var row = document.createElement('div');
      row.className = 'timeline-row' + (index === anchorIndex ? ' anchor' : '');
      var offsetLabel = phase.offsetMinutes <= 0 ? String(phase.offsetMinutes) : '+' + phase.offsetMinutes;
      row.innerHTML =
        '<div class="timeline-offset">' + offsetLabel + '</div>' +
        '<div class="timeline-content">' +
          '<span class="timeline-label">' + escapeHtml(phase.name) + '</span>' +
          '<input type="text" class="timeline-input" placeholder="HHMM" data-index="' + index + '" />' +
        '</div>';
      var input = row.querySelector('.timeline-input');

      input.addEventListener('focus', function () {
        input.select();
      });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          commitTime(index, input);
        }
      });
      input.addEventListener('change', function () {
        commitTime(index, input);
      });

      phaseListEl.appendChild(row);
    });
  }

  function renderEditScreen() {
    var editing = phases.map(function (p) { return { id: p.id, name: p.name, offsetMinutes: p.offsetMinutes }; });
    editListEl.innerHTML = '';

    editing.forEach(function (phase, index) {
      var row = document.createElement('div');
      row.className = 'timeline-row edit-row';
      var offsetLabel = phase.offsetMinutes <= 0 ? String(phase.offsetMinutes) : '+' + phase.offsetMinutes;
      row.innerHTML =
        '<div class="timeline-offset">' + offsetLabel + '</div>' +
        '<div class="timeline-content">' +
          '<label class="timeline-label">Phase ' + (index + 1) + '</label>' +
          '<input type="text" class="timeline-input-name" value="' + escapeHtml(phase.name) + '" data-index="' + index + '" />' +
          '<input type="number" class="timeline-input-offset" value="' + phase.offsetMinutes + '" data-index="' + index + '" />' +
        '</div>';
      editListEl.appendChild(row);
    });

    editListEl.querySelectorAll('.timeline-input-name').forEach(function (input) {
      input.addEventListener('input', function () {
        var i = parseInt(input.getAttribute('data-index'), 10);
        editing[i].name = input.value.trim() || ('Phase ' + (i + 1));
      });
    });
    editListEl.querySelectorAll('.timeline-input-offset').forEach(function (input) {
      input.addEventListener('input', function () {
        var i = parseInt(input.getAttribute('data-index'), 10);
        var n = parseInt(input.value, 10);
        if (!isNaN(n)) editing[i].offsetMinutes = n;
      });
    });

    saveScheduleBtn.onclick = function () {
      phases = editing;
      saveSchedule(phases);
      mainScreen.classList.remove('hidden');
      editScreen.classList.add('hidden');
      renderMainScreen();
      if (anchorIndex != null) {
        var inputs = phaseListEl.querySelectorAll('.timeline-input');
        var current = inputs[anchorIndex].value;
        var minutes = parseTime(current);
        if (minutes != null) applyScheduleFromAnchor(minutes);
      }
    };
  }

  var EDIT_PASSWORD = 'KGCadmin';
  var passwordModal = document.getElementById('passwordModal');
  var passwordInput = document.getElementById('passwordInput');
  var passwordCancelBtn = document.getElementById('passwordCancelBtn');
  var passwordOkBtn = document.getElementById('passwordOkBtn');

  function hidePasswordModal() {
    passwordModal.classList.add('hidden');
    passwordInput.value = '';
  }

  function checkPasswordAndOpenEdit() {
    var entered = passwordInput.value;
    hidePasswordModal();
    if (entered !== EDIT_PASSWORD) {
      alert('Incorrect password');
      return;
    }
    mainScreen.classList.add('hidden');
    editScreen.classList.remove('hidden');
    renderEditScreen();
  }

  editScheduleBtn.addEventListener('click', function () {
    passwordModal.classList.remove('hidden');
    passwordInput.value = '';
    passwordInput.focus();
  });

  passwordCancelBtn.addEventListener('click', hidePasswordModal);
  passwordOkBtn.addEventListener('click', checkPasswordAndOpenEdit);
  passwordInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') checkPasswordAndOpenEdit();
  });

  scheduleNameEl.textContent = SCHEDULE_NAME;
  renderMainScreen();
})();
