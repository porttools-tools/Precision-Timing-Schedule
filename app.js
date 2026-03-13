(function () {
  'use strict';

  // --- Supabase ---
  const SUPABASE_URL = 'https://rojmgzsoslawullsdnpq.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_SbvE1iQBhPJrw6OFSxYR9g__z710_Se';
  const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

  const ADMIN_PASSWORD = 'PTadmin';

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
  var currentScheduleId = null;
  var currentScheduleName = '';
  var currentScheduleNotes = '';
  var keyTimes = [];
  var anchorIndex = null;
  var anchorOffsetMinutes = null; // Track anchor by offset for grouped mode
  var isApplying = false;
  var isAdminMode = false;
  var filterMode = 'all'; // 'all' or 'favorites'
  var groupMode = 'grouped'; // 'grouped' or 'ungrouped'

  // --- DOM ---
  var landingScreen = document.getElementById('landingScreen');
  var mainScreen = document.getElementById('mainScreen');
  var editScreen = document.getElementById('editScreen');
  var newScheduleScreen = document.getElementById('newScheduleScreen');
  var scheduleListEl = document.getElementById('scheduleList');
  var phaseListEl = document.getElementById('phaseList');
  var editListEl = document.getElementById('editList');
  var newKeyTimeListEl = document.getElementById('newKeyTimeList');
  var scheduleNameEl = document.getElementById('scheduleName');
  var backToSchedulesBtn = document.getElementById('backToSchedulesBtn');
  var editScheduleBtn = document.getElementById('editScheduleBtn');
  var saveScheduleBtn = document.getElementById('saveScheduleBtn');
  var editAddKeyTimeBtn = document.getElementById('editAddKeyTimeBtn');
  var editCancelBtn = document.getElementById('editCancelBtn');
  var deletePtsBtn = document.getElementById('deletePtsBtn');
  var newScheduleBtn = document.getElementById('newScheduleBtn');
  var newScheduleNameEl = document.getElementById('newScheduleName');
  var addKeyTimeBtn = document.getElementById('addKeyTimeBtn');
  var saveNewScheduleBtn = document.getElementById('saveNewScheduleBtn');
  var cancelNewScheduleBtn = document.getElementById('cancelNewScheduleBtn');
  var adminBtn = document.getElementById('adminBtn');
  var adminPasswordModal = document.getElementById('adminPasswordModal');
  var adminPasswordInput = document.getElementById('adminPasswordInput');
  var adminPasswordCancelBtn = document.getElementById('adminPasswordCancelBtn');
  var adminPasswordOkBtn = document.getElementById('adminPasswordOkBtn');
  var focusSink = document.getElementById('focusSink');
  var filterBtn = document.getElementById('filterBtn');
  var groupBtn = document.getElementById('groupBtn');

  // --- LocalStorage for Favorites ---
  function getFavorites() {
    try {
      var stored = localStorage.getItem('pts_favorites');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }

  function saveFavorites(favorites) {
    try {
      localStorage.setItem('pts_favorites', JSON.stringify(favorites));
    } catch (e) {
      console.error('Could not save favorites', e);
    }
  }

  function toggleFavorite(scheduleId) {
    var favorites = getFavorites();
    var index = favorites.indexOf(scheduleId);
    if (index >= 0) {
      favorites.splice(index, 1);
    } else {
      favorites.push(scheduleId);
    }
    saveFavorites(favorites);
  }

  function isFavorite(scheduleId) {
    return getFavorites().indexOf(scheduleId) >= 0;
  }

  function getFilterMode() {
    try {
      var stored = localStorage.getItem('pts_filter_mode');
      return stored === 'favorites' ? 'favorites' : 'all';
    } catch (e) {
      return 'all';
    }
  }

  function saveFilterMode(mode) {
    try {
      localStorage.setItem('pts_filter_mode', mode);
    } catch (e) {
      console.error('Could not save filter mode', e);
    }
  }

  // --- LocalStorage for Group Mode ---
  function getGroupMode() {
    try {
      var stored = localStorage.getItem('pts_group_mode');
      return stored === 'ungrouped' ? 'ungrouped' : 'grouped';
    } catch (e) {
      return 'grouped';
    }
  }

  function saveGroupMode(mode) {
    try {
      localStorage.setItem('pts_group_mode', mode);
    } catch (e) {
      console.error('Could not save group mode', e);
    }
  }

  // --- Admin UI ---
  function updateAdminUI() {
    if (adminBtn) adminBtn.textContent = isAdminMode ? 'Exit Admin' : 'Admin';
    if (newScheduleBtn) newScheduleBtn.style.display = isAdminMode ? '' : 'none';
    if (editScheduleBtn) editScheduleBtn.style.display = isAdminMode ? '' : 'none';
  }

  // --- Supabase API (tables: aircraft, key_time) ---
  function loadScheduleList() {
    if (!supabase) return Promise.resolve([]);
    return supabase
      .from('aircraft')
      .select('id, name')
      .order('name')
      .then(function (res) {
        if (res.error) {
          console.error('loadScheduleList', res.error);
          return [];
        }
        return res.data || [];
      });
  }

  function loadKeyTimes(aircraftId) {
    if (!supabase) return Promise.resolve([]);
    return supabase
      .from('key_time')
      .select('id, name, offset_minutes, sort_order, is_key_time, department, duration_minutes, notes, is_conditional, category')
      .eq('aircraft_id', aircraftId)
      .order('sort_order', { ascending: true })
      .then(function (res) {
        if (res.error) {
          console.error('loadKeyTimes', res.error);
          return [];
        }
        var rows = res.data || [];
        var list = rows.map(function (r, i) {
          return {
            id: r.id,
            name: r.name || '',
            offsetMinutes: Number(r.offset_minutes),
            sortOrder: r.sort_order != null ? r.sort_order : i + 1,
            isKeyTime: r.is_key_time === true,
            department: r.department || null,
            durationMinutes: r.duration_minutes != null ? Number(r.duration_minutes) : null,
            notes: r.notes || null,
            isConditional: r.is_conditional === true,
            category: r.category || null
          };
        });
        list.sort(function (a, b) { return a.offsetMinutes - b.offsetMinutes; });
        return list;
      });
  }

  function saveKeyTimes(aircraftId, keyTimesToSave) {
    if (!supabase) return Promise.reject(new Error('No Supabase'));
    var sorted = keyTimesToSave.slice().sort(function (a, b) { return a.offsetMinutes - b.offsetMinutes; });
    return supabase
      .from('key_time')
      .delete()
      .eq('aircraft_id', aircraftId)
      .then(function (delRes) {
        if (delRes.error) return Promise.reject(delRes.error);
        if (sorted.length === 0) return Promise.resolve();
        var rows = sorted.map(function (kt, i) {
          return {
            aircraft_id: aircraftId,
            name: kt.name || ('Time ' + (i + 1)),
            offset_minutes: Number(kt.offsetMinutes),
            sort_order: i + 1,
            is_key_time: !!kt.isKeyTime,
            department: kt.department || null,
            duration_minutes: kt.durationMinutes != null ? Number(kt.durationMinutes) : null,
            notes: kt.notes || null,
            is_conditional: !!kt.isConditional,
            category: kt.category || null
          };
        });
        return supabase.from('key_time').insert(rows);
      })
      .then(function (insertRes) {
        if (insertRes && insertRes.error) return Promise.reject(insertRes.error);
        return Promise.resolve();
      });
  }

  function loadScheduleMetadata(aircraftId) {
    if (!supabase) return Promise.resolve(null);
    return supabase
      .from('schedule_metadata')
      .select('general_notes')
      .eq('aircraft_id', aircraftId)
      .single()
      .then(function (res) {
        if (res.error) {
          if (res.error.code === 'PGRST116') return null; // No metadata yet
          console.error('loadScheduleMetadata', res.error);
          return null;
        }
        return res.data ? (res.data.general_notes || '') : '';
      });
  }

  function saveScheduleMetadata(aircraftId, generalNotes) {
    if (!supabase) return Promise.reject(new Error('No Supabase'));
    var notesTrim = (generalNotes || '').trim();
    
    // If notes empty, delete metadata row if it exists
    if (!notesTrim) {
      return supabase
        .from('schedule_metadata')
        .delete()
        .eq('aircraft_id', aircraftId)
        .then(function (res) {
          if (res.error) console.error('Delete metadata', res.error);
          return Promise.resolve();
        });
    }
    
    // Otherwise upsert (insert or update)
    return supabase
      .from('schedule_metadata')
      .upsert({
        aircraft_id: aircraftId,
        general_notes: notesTrim
      }, {
        onConflict: 'aircraft_id'
      })
      .then(function (res) {
        if (res.error) return Promise.reject(res.error);
        return Promise.resolve();
      });
  }

  function createSchedule(name, keyTimesToSave) {
    if (!supabase) return Promise.reject(new Error('No Supabase'));
    var nameTrim = (name || '').trim();
    if (!nameTrim) return Promise.reject(new Error('Schedule name is required'));
    var valid = keyTimesToSave.filter(function (kt) {
      return (kt.name && kt.name.trim()) || (kt.offsetMinutes !== undefined && kt.offsetMinutes !== null);
    });
    if (valid.length === 0) return Promise.reject(new Error('Add at least one time'));

    var sorted = valid.slice().sort(function (a, b) { return a.offsetMinutes - b.offsetMinutes; });
    return supabase
      .from('aircraft')
      .insert({ name: nameTrim })
      .select('id')
      .single()
      .then(function (res) {
        if (res.error) return Promise.reject(res.error);
        var scheduleId = res.data.id;
        var rows = sorted.map(function (kt, i) {
          return {
            aircraft_id: scheduleId,
            name: (kt.name && kt.name.trim()) || ('Time ' + (i + 1)),
            offset_minutes: Number(kt.offsetMinutes),
            sort_order: i + 1,
            is_key_time: !!kt.isKeyTime,
            department: kt.department || null,
            duration_minutes: kt.durationMinutes != null ? Number(kt.durationMinutes) : null,
            notes: kt.notes || null,
            is_conditional: !!kt.isConditional,
            category: kt.category || null
          };
        });
        return supabase.from('key_time').insert(rows).then(function (ir) {
          if (ir.error) return Promise.reject(ir.error);
          return scheduleId;
        });
      });
  }

  function deleteSchedule(scheduleId) {
    if (!supabase) return Promise.reject(new Error('No Supabase'));
    return supabase.from('key_time').delete().eq('aircraft_id', scheduleId).then(function (delRes) {
      if (delRes.error) return Promise.reject(delRes.error);
      return supabase.from('aircraft').delete().eq('id', scheduleId);
    }).then(function (res) {
      if (res.error) return Promise.reject(res.error);
      return Promise.resolve();
    });
  }

  // --- Navigation ---
  function showLanding() {
    document.body.classList.add('on-landing');
    landingScreen.classList.remove('hidden');
    mainScreen.classList.add('hidden');
    editScreen.classList.add('hidden');
    newScheduleScreen.classList.add('hidden');
    scheduleNameEl.classList.add('hidden');
    backToSchedulesBtn.classList.add('hidden');
    if (filterBtn) filterBtn.classList.remove('hidden');
    if (groupBtn) groupBtn.classList.add('hidden');
    adminBtn.classList.remove('hidden');
    updateAdminUI();
  }

  function showPTS() {
    document.body.classList.remove('on-landing');
    landingScreen.classList.add('hidden');
    newScheduleScreen.classList.add('hidden');
    mainScreen.classList.remove('hidden');
    editScreen.classList.add('hidden');
    scheduleNameEl.textContent = currentScheduleName;
    scheduleNameEl.classList.remove('hidden');
    backToSchedulesBtn.classList.remove('hidden');
    if (filterBtn) filterBtn.classList.add('hidden');
    if (groupBtn) {
      groupBtn.classList.remove('hidden');
      updateGroupButton();
    }
    adminBtn.classList.add('hidden');
    updateAdminUI();
  }

  function showNewScheduleEditor() {
    document.body.classList.remove('on-landing');
    landingScreen.classList.add('hidden');
    mainScreen.classList.add('hidden');
    editScreen.classList.add('hidden');
    newScheduleScreen.classList.remove('hidden');
    scheduleNameEl.classList.add('hidden');
    backToSchedulesBtn.classList.add('hidden');
    if (filterBtn) filterBtn.classList.add('hidden');
    if (groupBtn) groupBtn.classList.add('hidden');
    adminBtn.classList.add('hidden');
  }

  function showEditScreen() {
    document.body.classList.remove('on-landing');
    mainScreen.classList.add('hidden');
    editScreen.classList.remove('hidden');
    if (filterBtn) filterBtn.classList.add('hidden');
    if (groupBtn) groupBtn.classList.add('hidden');
  }

  // --- Landing ---
  function updateFilterButton() {
    if (!filterBtn) return;
    filterBtn.innerHTML = '<span class="filter-option' + (filterMode === 'favorites' ? ' active' : '') + '">Fav</span><span class="filter-divider">|</span><span class="filter-option' + (filterMode === 'all' ? ' active' : '') + '">All</span>';
  }

  function updateGroupButton() {
    if (!groupBtn) return;
    groupBtn.innerHTML = '<span class="group-option' + (groupMode === 'grouped' ? ' active' : '') + '">⊟</span><span class="group-divider">|</span><span class="group-option' + (groupMode === 'ungrouped' ? ' active' : '') + '">☰</span>';
  }

  function renderLanding() {
    // Load filter mode from localStorage
    filterMode = getFilterMode();
    updateFilterButton();
    
    scheduleListEl.innerHTML = '';
    scheduleListEl.appendChild(document.createTextNode('Loading…'));
    loadScheduleList().then(function (list) {
      scheduleListEl.innerHTML = '';
      if (list.length === 0) {
        var empty = document.createElement('p');
        empty.className = 'hint';
        empty.textContent = 'No schedules yet. Create one with "New schedule".';
        scheduleListEl.appendChild(empty);
        return;
      }

      var favorites = getFavorites();
      
      // Sort: favorites first, then alphabetically
      var sortedList = list.slice().sort(function (a, b) {
        var aIsFav = favorites.indexOf(a.id) >= 0;
        var bIsFav = favorites.indexOf(b.id) >= 0;
        if (aIsFav && !bIsFav) return -1;
        if (!aIsFav && bIsFav) return 1;
        return a.name.localeCompare(b.name);
      });

      // Filter based on mode
      var filteredList = filterMode === 'favorites'
        ? sortedList.filter(function (a) { return favorites.indexOf(a.id) >= 0; })
        : sortedList;

      if (filteredList.length === 0) {
        var empty = document.createElement('p');
        empty.className = 'hint';
        empty.textContent = 'No favorites yet. Tap the star on a schedule to add it here.';
        scheduleListEl.appendChild(empty);
        return;
      }

      filteredList.forEach(function (a) {
        var isFav = favorites.indexOf(a.id) >= 0;
        var card = document.createElement('div');
        card.className = 'schedule-card' + (isFav ? ' favorited' : '');
        
        var star = document.createElement('span');
        star.className = 'schedule-star';
        star.textContent = isFav ? '★' : '☆';
        star.addEventListener('click', function (e) {
          e.stopPropagation();
          toggleFavorite(a.id);
          renderLanding();
        });

        var nameSpan = document.createElement('span');
        nameSpan.className = 'schedule-card-name';
        nameSpan.textContent = a.name;
        nameSpan.addEventListener('click', function () {
          openSchedule(a.id, a.name);
        });

        card.appendChild(star);
        card.appendChild(nameSpan);
        scheduleListEl.appendChild(card);
      });
    });
  }

  function openSchedule(id, name) {
    currentScheduleId = id;
    currentScheduleName = name;
    // Load group mode from localStorage
    groupMode = getGroupMode();
    phaseListEl.innerHTML = '';
    phaseListEl.appendChild(document.createTextNode('Loading…'));
    
    // Load both key times and metadata
    Promise.all([
      loadKeyTimes(id),
      loadScheduleMetadata(id)
    ]).then(function (results) {
      keyTimes = results[0];
      currentScheduleNotes = results[1] || '';
      anchorIndex = null;
      if (keyTimes.length === 0) {
        phaseListEl.innerHTML = '<p class="hint">No times for this schedule. Edit Schedule to add some.</p>';
        showPTS();
        return;
      }
      showPTS();
      renderMainScreen();
    });
  }

  // --- Main schedule screen (timeline) ---
  function applyScheduleFromAnchor(anchorMinutes) {
    if (anchorIndex == null) return;
    var anchorOffset = keyTimes[anchorIndex].offsetMinutes;
    isApplying = true;
    
    if (groupMode === 'grouped') {
      // In grouped mode, update inputs by offset
      phaseListEl.querySelectorAll('.timeline-input').forEach(function (input) {
        var offset = parseInt(input.getAttribute('data-offset'), 10);
        var diff = offset - anchorOffset;
        var minutes = anchorMinutes + diff;
        input.value = formatTime(minutes);
      });
    } else {
      // In ungrouped mode, update inputs by index
      var inputs = phaseListEl.querySelectorAll('.timeline-input');
      for (var i = 0; i < keyTimes.length; i++) {
        var diff = keyTimes[i].offsetMinutes - anchorOffset;
        var minutes = anchorMinutes + diff;
        if (inputs[i]) inputs[i].value = formatTime(minutes);
      }
    }
    
    isApplying = false;
  }

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

    if (groupMode === 'grouped') {
      // --- GROUPED VIEW: Group tasks by offsetMinutes ---
      var groups = {};
      keyTimes.forEach(function (kt, index) {
        var offset = kt.offsetMinutes;
        if (!groups[offset]) {
          groups[offset] = [];
        }
        groups[offset].push({ task: kt, originalIndex: index });
      });

      var sortedOffsets = Object.keys(groups).map(Number).sort(function (a, b) { return a - b; });
      
      sortedOffsets.forEach(function (offset) {
        var group = groups[offset];
        var offsetLabel = offset <= 0 ? String(offset) : '+' + offset;
        
        // Determine if whole group should be highlighted (only if ALL tasks are key times)
        var allKeyTimes = group.every(function (item) { return item.task.isKeyTime; });
        
        // Find if any task in this group is the current anchor
        var isAnchorGroup = group.some(function (item) { return item.originalIndex === anchorIndex; });
        
        // Build the row
        var row = document.createElement('div');
        row.className = 'timeline-row grouped-row' + (isAnchorGroup ? ' anchor' : '') + (allKeyTimes ? ' key-time-highlight' : '');
        row.setAttribute('data-offset', offset);
        
        // Check if group has any expandable content
        var groupHasDetails = group.some(function (item) {
          return item.task.department || item.task.durationMinutes || item.task.notes || item.task.category;
        });

        // Build tasks list
        var tasksHtml = '';
        group.forEach(function (item) {
          var taskNameHtml = escapeHtml(item.task.name);
          if (item.task.notes) taskNameHtml += ' <span class="notes-indicator">ⓘ</span>';
          var taskClass = item.task.isKeyTime ? ' class="grouped-task-item key-time-task' : ' class="grouped-task-item';
          if (item.task.isConditional) taskClass += ' conditional-task';
          taskClass += '"';
          tasksHtml += '<div' + taskClass + '>' + taskNameHtml + '</div>';
        });

        // Build details panel (one section per task in the group that has details)
        var detailsPanelHtml = '<div class="grouped-details-panel hidden">';
        group.forEach(function (item) {
          var hasItemDetails = item.task.department || item.task.durationMinutes || item.task.notes || item.task.category;
          if (!hasItemDetails) return;
          detailsPanelHtml += '<div class="grouped-detail-task">';
          detailsPanelHtml += '<div class="grouped-detail-task-name">' + escapeHtml(item.task.name) + '</div>';
          if (item.task.department) {
            detailsPanelHtml += '<div class="detail-row"><span class="detail-label">Department:</span> ' + escapeHtml(item.task.department) + '</div>';
          }
          if (item.task.durationMinutes) {
            detailsPanelHtml += '<div class="detail-row"><span class="detail-label">Duration:</span> ' + item.task.durationMinutes + ' minutes</div>';
          }
          if (item.task.category) {
            detailsPanelHtml += '<div class="detail-row"><span class="detail-label">Category:</span> ' + escapeHtml(item.task.category) + '</div>';
          }
          if (item.task.notes) {
            detailsPanelHtml += '<div class="detail-row"><span class="detail-label">Notes:</span> ' + escapeHtml(item.task.notes) + '</div>';
          }
          detailsPanelHtml += '</div>';
        });
        detailsPanelHtml += '</div>';

        row.innerHTML =
          '<div class="timeline-offset' + (groupHasDetails ? ' offset-expandable' : '') + '" data-offset="' + offset + '">' + offsetLabel + '</div>' +
          '<div class="timeline-content">' +
            '<div class="grouped-tasks-wrapper">' + tasksHtml + '</div>' +
            '<div class="grouped-time-input-wrapper"><input type="text" class="timeline-input" placeholder="HHMM" data-offset="' + offset + '" /></div>' +
            detailsPanelHtml +
          '</div>';

        // Offset badge expand/collapse
        if (groupHasDetails) {
          var offsetBadge = row.querySelector('.timeline-offset');
          offsetBadge.style.cursor = 'pointer';
          offsetBadge.addEventListener('click', function () {
            var panel = row.querySelector('.grouped-details-panel');
            var isExpanded = !panel.classList.contains('hidden');
            panel.classList.toggle('hidden');
            offsetBadge.classList.toggle('offset-expanded', !isExpanded);
          });
        }
        
        var input = row.querySelector('.timeline-input');
        input.addEventListener('focus', function () {
          input.select();
        });
        input.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') {
            e.preventDefault();
            var value = input.value.trim();
            if (!value) return;
            var minutes = parseTime(value);
            if (minutes == null) return;
            
            // Set anchor to first task in this group
            anchorIndex = group[0].originalIndex;
            anchorOffsetMinutes = offset;
            
            // Update anchor styling
            phaseListEl.querySelectorAll('.timeline-row').forEach(function (r) {
              var rowOffset = parseInt(r.getAttribute('data-offset'), 10);
              r.classList.toggle('anchor', rowOffset === offset);
            });
            
            applyScheduleFromAnchor(minutes);
            input.value = formatTime(minutes);
            input.blur();
            if (focusSink) focusSink.focus();
          }
        });
        input.addEventListener('change', function () {
          var value = input.value.trim();
          if (!value) return;
          var minutes = parseTime(value);
          if (minutes == null) return;
          
          anchorIndex = group[0].originalIndex;
          anchorOffsetMinutes = offset;
          
          phaseListEl.querySelectorAll('.timeline-row').forEach(function (r) {
            var rowOffset = parseInt(r.getAttribute('data-offset'), 10);
            r.classList.toggle('anchor', rowOffset === offset);
          });
          
          applyScheduleFromAnchor(minutes);
          input.value = formatTime(minutes);
        });
        
        phaseListEl.appendChild(row);
      });
      
    } else {
      // --- UNGROUPED VIEW: Individual rows (original behavior) ---
      keyTimes.forEach(function (kt, index) {
        var row = document.createElement('div');
        var rowClasses = 'timeline-row' + (index === anchorIndex ? ' anchor' : '') + (kt.isKeyTime ? ' key-time-highlight' : '');
        if (kt.isConditional) rowClasses += ' conditional-task';
        row.className = rowClasses;
        var offsetLabel = kt.offsetMinutes <= 0 ? String(kt.offsetMinutes) : '+' + kt.offsetMinutes;
        
        var hasDetails = kt.department || kt.durationMinutes || kt.category || kt.notes || kt.isConditional;
        var hasNoteOnly = kt.notes && !kt.department && !kt.durationMinutes && !kt.category && !kt.isConditional;

        // Task name: clickable if has notes, with ⓘ indicator
        var labelTag = kt.notes ? 'button type="button" class="timeline-label timeline-label-note" data-index="' + index + '"' : 'span class="timeline-label"';
        var labelClose = kt.notes ? 'button' : 'span';
        var taskNameHtml = escapeHtml(kt.name);
        if (kt.notes) taskNameHtml += ' <span class="notes-indicator">ⓘ</span>';

        // Inline note panel (shown when task name is tapped)
        var inlineNoteHtml = kt.notes
          ? '<div class="inline-note hidden" data-index="' + index + '">' + escapeHtml(kt.notes) + '</div>'
          : '';

        // Expand button (only if has non-note details too)
        var expandBtnHtml = '';
        var detailsPanelHtml = '';
        if (hasDetails) {
          expandBtnHtml = '<button type="button" class="btn-expand-view" data-index="' + index + '" title="Show details">▼</button>';
          detailsPanelHtml = '<div class="view-details hidden" data-index="' + index + '">';
          if (kt.department) {
            detailsPanelHtml += '<div class="detail-row"><span class="detail-label">Department:</span> ' + escapeHtml(kt.department) + '</div>';
          }
          if (kt.durationMinutes) {
            detailsPanelHtml += '<div class="detail-row"><span class="detail-label">Duration:</span> ' + kt.durationMinutes + ' minutes</div>';
          }
          if (kt.category) {
            detailsPanelHtml += '<div class="detail-row"><span class="detail-label">Category:</span> ' + escapeHtml(kt.category) + '</div>';
          }
          if (kt.notes) {
            detailsPanelHtml += '<div class="detail-row"><span class="detail-label">Notes:</span> ' + escapeHtml(kt.notes) + '</div>';
          }
          detailsPanelHtml += '</div>';
        }

        // Layout: [label] [expand▼] [input]  — expand button sits just left of input
        row.innerHTML =
          '<div class="timeline-offset">' + offsetLabel + '</div>' +
          '<div class="timeline-content">' +
            '<' + labelTag + '>' + taskNameHtml + '</' + labelClose + '>' +
            inlineNoteHtml +
            expandBtnHtml +
            '<input type="text" class="timeline-input" placeholder="HHMM" data-index="' + index + '" />' +
            detailsPanelHtml +
          '</div>';

        var input = row.querySelector('.timeline-input');
        input.addEventListener('focus', function () {
          input.select();
        });
        input.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') {
            e.preventDefault();
            commitTime(index, input);
            input.blur();
            if (focusSink) focusSink.focus();
          }
        });
        input.addEventListener('change', function () {
          commitTime(index, input);
        });

        // Tap task label to show/hide inline note
        var labelEl = row.querySelector('.timeline-label-note');
        if (labelEl) {
          labelEl.addEventListener('click', function () {
            var i = parseInt(this.getAttribute('data-index'), 10);
            var noteEl = row.querySelector('.inline-note[data-index="' + i + '"]');
            if (noteEl) noteEl.classList.toggle('hidden');
          });
        }

        var expandBtn = row.querySelector('.btn-expand-view');
        if (expandBtn) {
          expandBtn.addEventListener('click', function () {
            var i = parseInt(this.getAttribute('data-index'), 10);
            var details = phaseListEl.querySelector('.view-details[data-index="' + i + '"]');
            if (details) {
              details.classList.toggle('hidden');
              this.textContent = details.classList.contains('hidden') ? '▼' : '▲';
            }
          });
        }

        phaseListEl.appendChild(row);
      });
    }
    
    // Add schedule notes at the bottom if they exist
    if (currentScheduleNotes && currentScheduleNotes.trim()) {
      var notesBox = document.createElement('div');
      notesBox.className = 'schedule-notes-box';
      notesBox.innerHTML = '<div class="schedule-notes-label">Schedule Notes:</div><div class="schedule-notes-content">' + escapeHtml(currentScheduleNotes).replace(/\n/g, '<br>') + '</div>';
      phaseListEl.appendChild(notesBox);
    }
  }

  // --- Edit schedule (times) ---
  function renderEditScreen() {
    var editing = keyTimes.map(function (p) {
      return { 
        id: p.id, 
        name: p.name, 
        offsetMinutes: p.offsetMinutes, 
        isKeyTime: !!p.isKeyTime,
        department: p.department || '',
        durationMinutes: p.durationMinutes,
        notes: p.notes || '',
        isConditional: !!p.isConditional,
        category: p.category || ''
      };
    });
    
    var editScheduleName = currentScheduleName;
    var editScheduleNotes = currentScheduleNotes;

    function renderEditList() {
      editing.sort(function (a, b) { return a.offsetMinutes - b.offsetMinutes; });
      editListEl.innerHTML = '';
      
      // Add schedule name input at the top
      var nameRow = document.createElement('div');
      nameRow.className = 'schedule-name-edit';
      nameRow.innerHTML = 
        '<label class="schedule-name-edit-label">Schedule Name:</label>' +
        '<input type="text" class="schedule-name-edit-input" placeholder="e.g., Q400 Domestic - 25min Turn" value="' + 
        escapeHtml(editScheduleName || '') + '" />';
      editListEl.appendChild(nameRow);
      
      var scheduleNameInput = editListEl.querySelector('.schedule-name-edit-input');
      scheduleNameInput.addEventListener('input', function () {
        editScheduleName = this.value.trim();
      });
      
      // Add schedule notes textarea
      var notesRow = document.createElement('div');
      notesRow.className = 'schedule-notes-edit';
      notesRow.innerHTML = 
        '<label class="schedule-notes-edit-label">Schedule Notes (general information):</label>' +
        '<textarea class="schedule-notes-edit-textarea" placeholder="e.g., All times refer to the latest tasks can occur to ensure on-time departure..." rows="3">' + 
        escapeHtml(editScheduleNotes || '') + '</textarea>';
      editListEl.appendChild(notesRow);
      
      var notesTextarea = editListEl.querySelector('.schedule-notes-edit-textarea');
      notesTextarea.addEventListener('input', function () {
        editScheduleNotes = this.value;
      });
      
      editing.forEach(function (kt, index) {
        var row = document.createElement('div');
        row.className = 'timeline-row edit-row edit-key-time-row' + (kt.isKeyTime ? ' key-time-highlight' : '');
        var offsetLabel = kt.offsetMinutes <= 0 ? String(kt.offsetMinutes) : '+' + kt.offsetMinutes;
        var canRemove = editing.length > 1;
        
        // Main row with basic fields
        var hasNotes = kt.notes && kt.notes.trim().length > 0;
        row.innerHTML =
          '<div class="timeline-offset">' + offsetLabel + '</div>' +
          '<div class="timeline-content">' +
            '<label class="timeline-label">Time ' + (index + 1) + (hasNotes ? ' <span class="notes-indicator">ⓘ</span>' : '') + '<button type="button" class="btn-expand" data-index="' + index + '" title="Show details">▼</button></label>' +
            '<input type="text" class="timeline-input-name" placeholder="Task name" value="' + escapeHtml(kt.name) + '" data-index="' + index + '" />' +
            '<input type="number" class="timeline-input-offset" placeholder="Offset" value="' + kt.offsetMinutes + '" data-index="' + index + '" />' +
            '<button type="button" class="btn-key-time" data-index="' + index + '" title="Toggle key time (red border in schedule)">' + (kt.isKeyTime ? 'Key time ✓' : 'Key time') + '</button>' +
            (canRemove ? '<button type="button" class="btn-remove-key-time" data-index="' + index + '" title="Remove time">Remove</button>' : '') +
            '<div class="edit-details hidden" data-index="' + index + '">' +
              '<input type="text" class="timeline-input-department" placeholder="Department (e.g., Engineering, GSP)" value="' + escapeHtml(kt.department || '') + '" data-index="' + index + '" />' +
              '<input type="number" class="timeline-input-duration" placeholder="Duration (mins)" value="' + (kt.durationMinutes != null ? kt.durationMinutes : '') + '" data-index="' + index + '" />' +
              '<input type="text" class="timeline-input-category" placeholder="Category (e.g., Turnaround)" value="' + escapeHtml(kt.category || '') + '" data-index="' + index + '" />' +
              '<textarea class="timeline-input-notes" placeholder="Notes..." data-index="' + index + '" rows="2">' + escapeHtml(kt.notes || '') + '</textarea>' +
              '<label class="timeline-checkbox-label"><input type="checkbox" class="timeline-input-conditional" data-index="' + index + '" ' + (kt.isConditional ? 'checked' : '') + ' /> Conditional (*)</label>' +
            '</div>' +
          '</div>';
        editListEl.appendChild(row);
      });
      
      // Add expand/collapse functionality
      editListEl.querySelectorAll('.btn-expand').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var i = parseInt(this.getAttribute('data-index'), 10);
          var details = editListEl.querySelector('.edit-details[data-index="' + i + '"]');
          if (details) {
            details.classList.toggle('hidden');
            this.textContent = details.classList.contains('hidden') ? '▼' : '▲';
          }
        });
      });
      
      // Add event handlers for new enhanced fields
      editListEl.querySelectorAll('.timeline-input-department').forEach(function (input) {
        input.addEventListener('input', function () {
          var i = parseInt(input.getAttribute('data-index'), 10);
          editing[i].department = input.value.trim();
        });
      });
      
      editListEl.querySelectorAll('.timeline-input-duration').forEach(function (input) {
        input.addEventListener('input', function () {
          var i = parseInt(input.getAttribute('data-index'), 10);
          var n = input.value === '' ? null : parseInt(input.value, 10);
          editing[i].durationMinutes = isNaN(n) ? null : n;
        });
      });
      
      editListEl.querySelectorAll('.timeline-input-category').forEach(function (input) {
        input.addEventListener('input', function () {
          var i = parseInt(input.getAttribute('data-index'), 10);
          editing[i].category = input.value.trim();
        });
      });
      
      editListEl.querySelectorAll('.timeline-input-notes').forEach(function (input) {
        input.addEventListener('input', function () {
          var i = parseInt(input.getAttribute('data-index'), 10);
          editing[i].notes = input.value.trim();
        });
      });
      
      editListEl.querySelectorAll('.timeline-input-conditional').forEach(function (input) {
        input.addEventListener('change', function () {
          var i = parseInt(input.getAttribute('data-index'), 10);
          editing[i].isConditional = input.checked;
        });
      });

      function commitEditAndRefresh() {
        renderEditList();
      }
      editListEl.querySelectorAll('.timeline-input-name').forEach(function (input) {
        input.addEventListener('input', function () {
          var i = parseInt(input.getAttribute('data-index'), 10);
          editing[i].name = input.value.trim() || ('Time ' + (i + 1));
        });
        input.addEventListener('blur', function () {
          var i = parseInt(input.getAttribute('data-index'), 10);
          editing[i].name = input.value.trim() || ('Time ' + (i + 1));
          commitEditAndRefresh();
        });
        input.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') {
            e.preventDefault();
            input.blur();
            if (focusSink) focusSink.focus();
          }
        });
      });
      editListEl.querySelectorAll('.timeline-input-offset').forEach(function (input) {
        input.addEventListener('input', function () {
          var i = parseInt(input.getAttribute('data-index'), 10);
          var n = parseInt(input.value, 10);
          if (!isNaN(n)) editing[i].offsetMinutes = n;
        });
        input.addEventListener('blur', function () {
          var i = parseInt(input.getAttribute('data-index'), 10);
          var n = parseInt(input.value, 10);
          if (!isNaN(n)) editing[i].offsetMinutes = n;
          commitEditAndRefresh();
        });
        input.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') {
            e.preventDefault();
            input.blur();
            if (focusSink) focusSink.focus();
          }
        });
      });
      editListEl.querySelectorAll('.btn-key-time').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var i = parseInt(this.getAttribute('data-index'), 10);
          editing[i].isKeyTime = !editing[i].isKeyTime;
          renderEditList();
        });
      });
      editListEl.querySelectorAll('.btn-remove-key-time').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var i = parseInt(this.getAttribute('data-index'), 10);
          editing.splice(i, 1);
          renderEditList();
        });
      });
    }

    renderEditList();

    editAddKeyTimeBtn.onclick = function () {
      editing.push({ id: null, name: '', offsetMinutes: 0, isKeyTime: false });
      renderEditList();
    };

    editCancelBtn.onclick = function () {
      mainScreen.classList.remove('hidden');
      editScreen.classList.add('hidden');
    };

    deletePtsBtn.onclick = function () {
      if (!confirm('Delete this PTS?\n\n"' + currentScheduleName + '"\n\nThis cannot be undone.')) return;
      deleteSchedule(currentScheduleId)
        .then(function () {
          showLanding();
          renderLanding();
        })
        .catch(function (err) {
          alert('Could not delete PTS: ' + (err.message || err));
        });
    };

    saveScheduleBtn.onclick = function () {
      if (editing.length === 0) {
        alert('Keep at least one time.');
        return;
      }
      if (!editScheduleName || !editScheduleName.trim()) {
        alert('Schedule name is required.');
        return;
      }
      
      var oldAnchorOffset = anchorIndex != null ? keyTimes[anchorIndex].offsetMinutes : null;
      keyTimes = editing.map(function (e) { 
        return { 
          id: e.id, 
          name: e.name, 
          offsetMinutes: e.offsetMinutes, 
          isKeyTime: e.isKeyTime,
          department: e.department || null,
          durationMinutes: e.durationMinutes,
          notes: e.notes || null,
          isConditional: e.isConditional,
          category: e.category || null
        }; 
      });
      keyTimes.sort(function (a, b) { return a.offsetMinutes - b.offsetMinutes; });
      if (oldAnchorOffset != null) {
        var idx = keyTimes.findIndex(function (kt) { return kt.offsetMinutes === oldAnchorOffset; });
        anchorIndex = idx >= 0 ? idx : null;
      }
      
      // Update schedule name if it changed
      var namePromise = editScheduleName !== currentScheduleName
        ? supabase.from('aircraft').update({ name: editScheduleName }).eq('id', currentScheduleId)
        : Promise.resolve();
      
      // Save schedule name, key times, and schedule notes
      Promise.all([
        namePromise,
        saveKeyTimes(currentScheduleId, keyTimes),
        saveScheduleMetadata(currentScheduleId, editScheduleNotes)
      ])
        .then(function () {
          currentScheduleName = editScheduleName;
          currentScheduleNotes = editScheduleNotes;
          scheduleNameEl.textContent = currentScheduleName; // Update header
          mainScreen.classList.remove('hidden');
          editScreen.classList.add('hidden');
          renderMainScreen();
          if (anchorIndex != null) {
            var inputs = phaseListEl.querySelectorAll('.timeline-input');
            var current = inputs[anchorIndex].value;
            var minutes = parseTime(current);
            if (minutes != null) applyScheduleFromAnchor(minutes);
          }
        })
        .catch(function (err) {
          alert('Could not save: ' + (err.message || err));
        });
    };
  }

  // --- New schedule editor ---
  var newKeyTimes = [{ name: '', offsetMinutes: 0, isKeyTime: false }];

  function renderNewScheduleEditor() {
    newScheduleNameEl.value = '';
    newKeyTimes = [{ name: '', offsetMinutes: 0, isKeyTime: false }];
    renderNewKeyTimeList();
  }

  function renderNewKeyTimeList() {
    newKeyTimes.sort(function (a, b) { return (a.offsetMinutes || 0) - (b.offsetMinutes || 0); });
    newKeyTimeListEl.innerHTML = '';
    newKeyTimes.forEach(function (kt, index) {
      var row = document.createElement('div');
      row.className = 'timeline-row edit-row new-key-time-row' + (kt.isKeyTime ? ' key-time-highlight' : '');
      var offsetVal = kt.offsetMinutes !== undefined && kt.offsetMinutes !== null ? kt.offsetMinutes : '';
      var canRemove = newKeyTimes.length > 1;
      row.innerHTML =
        '<div class="timeline-offset">' + (kt.offsetMinutes <= 0 ? String(kt.offsetMinutes) : (kt.offsetMinutes > 0 ? '+' + kt.offsetMinutes : '')) + '</div>' +
        '<div class="timeline-content">' +
          '<label class="timeline-label">Time ' + (index + 1) + '</label>' +
          '<input type="text" class="timeline-input-name" placeholder="e.g. Doors closed" data-index="' + index + '" value="' + escapeHtml(kt.name || '') + '" />' +
          '<input type="number" class="timeline-input-offset" placeholder="0" data-index="' + index + '" value="' + (offsetVal === '' ? '' : offsetVal) + '" />' +
          '<button type="button" class="btn-key-time" data-index="' + index + '" title="Toggle key time (red border in schedule)">' + (kt.isKeyTime ? 'Key time ✓' : 'Key time') + '</button>' +
          (canRemove ? '<button type="button" class="btn-remove-key-time" data-index="' + index + '" title="Remove time">Remove</button>' : '') +
        '</div>';
      newKeyTimeListEl.appendChild(row);
    });

    function commitNewKeyTimeAndRefresh() {
      newKeyTimeListEl.querySelectorAll('.timeline-input-name').forEach(function (input) {
        var i = parseInt(input.getAttribute('data-index'), 10);
        if (newKeyTimes[i]) newKeyTimes[i].name = input.value.trim();
      });
      newKeyTimeListEl.querySelectorAll('.timeline-input-offset').forEach(function (input) {
        var i = parseInt(input.getAttribute('data-index'), 10);
        var n = input.value === '' ? null : parseInt(input.value, 10);
        if (newKeyTimes[i]) newKeyTimes[i].offsetMinutes = isNaN(n) ? 0 : n;
      });
      newKeyTimes.sort(function (a, b) { return (a.offsetMinutes || 0) - (b.offsetMinutes || 0); });
      renderNewKeyTimeList();
    }
    newKeyTimeListEl.querySelectorAll('.timeline-input-name').forEach(function (input) {
      input.addEventListener('input', function () {
        var i = parseInt(input.getAttribute('data-index'), 10);
        newKeyTimes[i].name = input.value.trim();
      });
      input.addEventListener('blur', commitNewKeyTimeAndRefresh);
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          input.blur();
          if (focusSink) focusSink.focus();
        }
      });
    });
    newKeyTimeListEl.querySelectorAll('.timeline-input-offset').forEach(function (input) {
      input.addEventListener('input', function () {
        var i = parseInt(input.getAttribute('data-index'), 10);
        var n = input.value === '' ? null : parseInt(input.value, 10);
        newKeyTimes[i].offsetMinutes = isNaN(n) ? 0 : n;
      });
      input.addEventListener('blur', commitNewKeyTimeAndRefresh);
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          input.blur();
          if (focusSink) focusSink.focus();
        }
      });
    });
    newKeyTimeListEl.querySelectorAll('.btn-key-time').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var i = parseInt(this.getAttribute('data-index'), 10);
        newKeyTimes[i].isKeyTime = !newKeyTimes[i].isKeyTime;
        renderNewKeyTimeList();
      });
    });
    newKeyTimeListEl.querySelectorAll('.btn-remove-key-time').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var i = parseInt(this.getAttribute('data-index'), 10);
        newKeyTimes.splice(i, 1);
        renderNewKeyTimeList();
      });
    });
  }

  addKeyTimeBtn.addEventListener('click', function () {
    newKeyTimes.push({ name: '', offsetMinutes: 0, isKeyTime: false });
    renderNewKeyTimeList();
  });

  saveNewScheduleBtn.addEventListener('click', function () {
    var name = newScheduleNameEl.value.trim();
    var toSave = newKeyTimes.map(function (kt) {
      return {
        name: (kt.name && kt.name.trim()) || '',
        offsetMinutes: kt.offsetMinutes !== undefined && kt.offsetMinutes !== null ? Number(kt.offsetMinutes) : 0,
        isKeyTime: !!kt.isKeyTime
      };
    }).filter(function (kt) {
      return (kt.name && kt.name.length) > 0 || kt.offsetMinutes !== undefined;
    });
    if (!name) {
      alert('Enter a schedule name.');
      return;
    }
    if (toSave.length === 0) {
      alert('Add at least one time.');
      return;
    }
    saveNewScheduleBtn.disabled = true;
    createSchedule(name, toSave)
      .then(function (scheduleId) {
        currentScheduleId = scheduleId;
        currentScheduleName = name;
        return loadKeyTimes(scheduleId);
      })
      .then(function (list) {
        keyTimes = list;
        anchorIndex = null;
        showPTS();
        renderMainScreen();
      })
      .catch(function (err) {
        alert('Could not create schedule: ' + (err.message || err));
      })
      .finally(function () {
        saveNewScheduleBtn.disabled = false;
      });
  });

  cancelNewScheduleBtn.addEventListener('click', function () {
    showLanding();
    renderLanding();
  });

  // --- Admin button & password modal ---
  function hideAdminPasswordModal() {
    adminPasswordModal.classList.add('hidden');
    adminPasswordInput.value = '';
  }

  adminBtn.addEventListener('click', function () {
    if (isAdminMode) {
      isAdminMode = false;
      updateAdminUI();
      return;
    }
    adminPasswordModal.classList.remove('hidden');
    adminPasswordInput.value = '';
    adminPasswordInput.focus();
  });

  adminPasswordCancelBtn.addEventListener('click', hideAdminPasswordModal);
  adminPasswordOkBtn.addEventListener('click', function () {
    var entered = adminPasswordInput.value;
    hideAdminPasswordModal();
    if (entered !== ADMIN_PASSWORD) {
      alert('Incorrect password');
      return;
    }
    isAdminMode = true;
    updateAdminUI();
  });
  adminPasswordInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') adminPasswordOkBtn.click();
  });

  // --- Edit Schedule (admin only; button visibility set by updateAdminUI) ---
  editScheduleBtn.addEventListener('click', function () {
    showEditScreen();
    renderEditScreen();
  });

  // --- Back to schedule list ---
  backToSchedulesBtn.addEventListener('click', function () {
    showLanding();
    renderLanding();
  });

  // --- New schedule button ---
  newScheduleBtn.addEventListener('click', function () {
    showNewScheduleEditor();
    renderNewScheduleEditor();
  });

  // --- Filter button ---
  if (filterBtn) {
    filterBtn.addEventListener('click', function () {
      filterMode = filterMode === 'all' ? 'favorites' : 'all';
      saveFilterMode(filterMode);
      renderLanding();
    });
  }

  // --- Group button ---
  if (groupBtn) {
    groupBtn.addEventListener('click', function () {
      // Save current anchor time before switching modes
      var anchorTime = null;
      if (anchorIndex != null) {
        var inputs = phaseListEl.querySelectorAll('.timeline-input');
        if (groupMode === 'grouped') {
          // In grouped mode, find the input with matching offset
          var anchorOffset = keyTimes[anchorIndex].offsetMinutes;
          inputs.forEach(function (input) {
            var offset = parseInt(input.getAttribute('data-offset'), 10);
            if (offset === anchorOffset && input.value) {
              anchorTime = parseTime(input.value);
            }
          });
        } else {
          // In ungrouped mode, use the anchor index directly
          if (inputs[anchorIndex] && inputs[anchorIndex].value) {
            anchorTime = parseTime(inputs[anchorIndex].value);
          }
        }
      }
      
      // Switch modes
      groupMode = groupMode === 'grouped' ? 'ungrouped' : 'grouped';
      saveGroupMode(groupMode);
      updateGroupButton();
      renderMainScreen();
      
      // Re-apply the anchor time if it was set
      if (anchorTime != null && anchorIndex != null) {
        applyScheduleFromAnchor(anchorTime);
      }
    });
  }

  // --- Init: show landing ---
  updateAdminUI();
  showLanding();
  renderLanding();
})();
