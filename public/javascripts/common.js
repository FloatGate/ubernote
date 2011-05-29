$(document).ready(function() {
	
	window.log = function() {
		var print = function(level) {
			var messageClass = level + 'Log';
			return function(message) {
				var time = new Date().toLocaleTimeString();
				$('#logs').append(
						$('<span></span>').attr('class', 'timeLog').text(time),
						$('<span></span>').attr('class', messageClass).text(message)
				).scrollTop($('#logs')[0].scrollHeight);
			};
		};
		return {
			info: print('info'),
			warn: print('warn'),
			error: print('error')
		};
	}();
	
	
	// Check HTML5 support
	var hasLocalStorage = ('localStorage' in window) && window['localStorage'] !== null;
	var hasOffline = !!window.applicationCache;
	
	log.info('Local storage support: ' + hasLocalStorage);
	log.info('Offline support: ' + hasOffline);
	
	if (!hasLocalStorage || !hasOffline) {
		$('#localStorage').html(hasLocalStorage ? 'supported' : 'not supported');
		$('#offline').html(hasOffline ? 'supported' : 'not supported');
		$('#browser_support').height($(document).height()).show();
		return;
	}
	
	
	// Log application cache events
	var cache = window.applicationCache;
	$(cache)
		.bind('checking', function() {
			log.info('[offline] Checking the cache manifest...');
		})
		.bind('noupdate', function() {
			log.info('[offline] The cache manifest hasn\'t changed, will use cached resources.');
		})
		.bind('downloading', function() {
			log.info('[offline] Starting download of offline resources...');
		})
		.bind('progress', function() {
			// Could not find any interesting info on the event in Firefox :-(
			log.info('[offline] Downloading offline resources...');
		})
		.bind('cached', function() {
			log.info('[offline] Local cache populated, the application is ready for offline use.');
		})
		.bind('updateready', function() {
			window.location.reload(); // to use the new version immediately
		})
		.bind('error', function() {
			if (cache.status == cache.IDLE || cache.status == cache.UPDATEREADY) {
				log.warn('[offline] Error while updating the local cache, will use previously cached resources.');
			} else {
				log.error('[offline] Error while updating the local cache! The application will probably not work offline.');
			}
		});
	
	
	window.noteStore = function() {
		var s = window.localStorage;
		var prefix = 'note_';
		var localPrefix = prefix + 'local_';
		var getByKey = function(key) {
			var stored = localStorage.getItem(key);
			if (stored) return JSON.parse(stored);
		};
		var find = function(filter) {
			return function() {
				var notes = [];
				for (var i = 0; i < s.length; i++) {
					var key = s.key(i);
					if (key.indexOf(prefix) != 0) continue;
					var note = getByKey(key);
					if (filter(note)) notes.push(note);
				}
				return notes;
			};
		};
		
		var lastSync = s.getItem('lastSync') || 0;
		
		return {
			get: function(id) {	return getByKey(prefix + id); },
			getLocal: function(id) { return getByKey(localPrefix + id); },
			remove: function(id) { s.removeItem(prefix + id); },
			removeLocal: function(id) { s.removeItem(localPrefix + id); },
			findVisible: find(function(note) { return !note.locallyDeleted; }),
			findLocallyCreated: find(function(note) { return !note.id; }),
			findUpdatedSince: function (ts) {
				var filter = function(note) { return note.id && note.lastModified > ts };
				return find(filter)();
			},
			// Saves a single note or an array of notes
			put: function(o) {
				if (o.id)
					s.setItem(prefix + o.id, JSON.stringify(o));
				else if (o.localId)
					s.setItem(localPrefix + o.localId, JSON.stringify(o));
				else
					for (var i = 0; i < o.length; i++) this.put(o[i]);
			},
			lastSync: function() { return s.getItem('lastSync') || 0; },
			setLastSync: function(ms) { s.setItem('lastSync', ms); }
		};
	}();
});