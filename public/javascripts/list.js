$(document).ready(function() {
	var notesPerPage = 10;
	var page = 1;
	var localNotes;
	var lastPage;
	
	var byId = function(n1, n2) {
		if (n1.id && n2.id) return n1.id - n2.id; // NB: this will not overflow
		else if (n1.localId && n2.localId) return n1.localId - n2.localId;
		else if (n1.id) return -1;
		else return 1;
	}; 
	var byDateDesc = function(n1, n2) { return n2.lastModified - n1.lastModified; }
	
	var renderNote = function(note) {
		var ms = note.lastModified;
		var d = new Date(ms);
		var ts = d.toLocaleDateString() + " " + d.toLocaleTimeString();
		
		var status;
		if (note.locallyCreated) status = 'Locally created';
		else if (note.locallyModified) status = 'Locally modified';
		else status = 'Up-to-date';
		
		var link = note.id ? window.noteAction({id: note.id}) : window.localNoteAction({id: note.localId});
		
		$('#list>table>tbody').append(
			$('<tr></tr>').append(
				$('<td></td>').append($('<a></a>').attr('href', link).text(note.name)),
				$('<td></td>').text(ts),
				$('<td></td>').text(status)
			)
		);
	};
	
	var renderList = function() {
		localNotes.sort(byDateDesc);

		$('#list>table>tbody').children().remove();
		var from = (page - 1) * notesPerPage;
		var to = Math.min(from + notesPerPage, localNotes.length);
		for (var i = from; i < to; i++) renderNote(localNotes[i]);
		
		$('#pageNumber').text('Page ' + page);
		
		if (page > 1) $('#previousPage').show();
		else $('#previousPage').hide();
		
		lastPage = Math.ceil(localNotes.length / notesPerPage);
		if (page < lastPage) $('#nextPage').show();
		else $('#nextPage').hide();
		window.notesRendered = true;
	};
	
	var sync = function() {
		localNotes.sort(byId);
		
		var lastSync = window.noteStore.lastSync();
		var created = [];
		var updated = [];
		
		for (var i = 0; i < localNotes.length; i++) {
			var note = localNotes[i];
			if (!note.id) created.push(note);
			else if (note.lastModified > lastSync) updated.push(note);
		}
	
		log.info('[sync] Synchronizing with server...');
		var beforeRequest = new Date().getTime();
		$.post(window.syncAction(),
			{
				lastSync: lastSync,
				created: JSON.stringify(created),
				updated: JSON.stringify(updated)
			},
			function(syncedNotes) {
				log.info('[sync] ' + syncedNotes.length + ' notes sync\'ed.');
				store.setLastSync(beforeRequest);
				store.put(syncedNotes);
				
				// Handle notes that were pending server-side creation
				var i, note;
				for (i = 0; i < localNotes.length; i++) {
					note = localNotes[i];
					if (!note.id) {
						window.noteStore.deleteLocal(note.localId);
						localNotes.splice(i, 1);
						i -= 1;
					}
				}
				// Re-insert notes returned by server
				var j = 0;
				for (i = 0; i < syncedNotes.length; i++) {
					note = syncedNotes[i];
					while (j < localNotes.length && localNotes[j].id < note.id) j += 1;
					var del = (j < localNotes.length && localNotes[j].id == note.id) ? 1 : 0;
					localNotes.splice(j, del, note);
				}
				for (i = 0; i < created.length; i++) window.noteStore.deleteLocal(created[i].localId);
				renderList();
			}
		).error(function() {
			log.error('[sync] Error synchronizing notes with server! Will use local data.');
			renderList();
		});
	};
	
	$('#previousPage').click(function(e) {
		if (page > 1) page = page - 1;
		renderList();
		e.preventDefault();
	});
	
	$('#nextPage').click(function(e) {
		if (page < lastPage) page = page + 1;
		renderList();
		e.preventDefault();
	});
	
	$('#sync').click(function(e) {
		sync();
		e.preventDefault();
	});
	
	var store = window.noteStore;
	localNotes = noteStore.getAll();
	log.info('[sync] Loaded ' + localNotes.length + ' notes from local storage.');
	sync();
});