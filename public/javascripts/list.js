$(document).ready(function() {
	var store = window.noteStore;
	var notesPerPage = 10;
	var page = 1;
	var renderedNotes;
	var lastPage;
	
	var byDateDesc = function(n1, n2) { return n2.lastModified - n1.lastModified; }
	
	var renderNote = function(note) {
		var ms = note.lastModified;
		var d = new Date(ms);
		var ts = d.toLocaleDateString() + " " + d.toLocaleTimeString();
		
		var status;
		if (note.locallyCreated) status = 'Locally created';
		else if (note.locallyModified) status = 'Locally modified';
		else status = 'Up-to-date';
		
		var link, removeButton;
		if (note.locallyCreated) {
			link = window.localNoteAction({id: note.localId});
			removeButton = $('<input type="button" class="removeLocally" value="Remove">').attr("id", note.localId);
		} else {
			link = window.noteAction({id: note.id});
			removeButton = $('<input type="button" class="remove" value="Remove">').attr("id", note.id);
		}
		
		$('#list>table>tbody').append(
			$('<tr></tr>').append(
				$('<td></td>').append($('<a></a>').attr('href', link).text(note.name)),
				$('<td></td>').text(ts),
				$('<td></td>').text(status),
				$('<td></td>').append(removeButton)
			)
		);
	};
	
	// Removes a note that was never sent to the server
	var removeLocally = function() {
		var localId = $(this).attr('id');
		for (var i = 0; i < renderedNotes.length; i++)
			if (renderedNotes[i].localId == localId) {
				renderedNotes.splice(i, 1);
				break;
			}
		store.removeLocal(localId);
		renderList();
	};
	
	// Removes a note that was synchronized with the server at least once
	var remove = function() {
		var id = $(this).attr('id');
		$.ajax({
			url: window.removeAction({id: id}),
			type: 'DELETE',
			success: function() {
				for (var i = 0; i < renderedNotes.length; i++)
					if (renderedNotes[i].id == id) {
						renderedNotes.splice(i, 1);
						break;
					}
				store.remove(id);
				renderList();
			}
		}).error(function() {
			var note;
			for (var i = 0; i < renderedNotes.length; i++)
				if (renderedNotes[i].id == id) {
					note = renderedNotes.splice(i, 1)[0];
					break;
				}
			note.archived = true;
			note.lastModified = new Date().getTime();
			store.put(note);
			renderList();
		});
	};
	
	var renderList = function() {
		renderedNotes.sort(byDateDesc);

		$('#list>table>tbody').children().remove();
		var from = (page - 1) * notesPerPage;
		var to = Math.min(from + notesPerPage, renderedNotes.length);
		for (var i = from; i < to; i++) renderNote(renderedNotes[i]);
		
		$('#pageNumber').text('Page ' + page);
		
		if (page > 1) $('#previousPage').show();
		else $('#previousPage').hide();
		
		lastPage = Math.ceil(renderedNotes.length / notesPerPage);
		if (page < lastPage) $('#nextPage').show();
		else $('#nextPage').hide();
		
		$('.removeLocally').click(removeLocally);
		$('.remove').click(remove);
	};
	
	var sync = function() {
		var lastSync = store.lastSync();
	
		log.info('[sync] Synchronizing with server...');
		
		var created = store.findLocallyCreated();
		var updated = store.findUpdatedSince(lastSync);
		
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
				
				// Remove local notes that were pending server-side creation
				for (i = 0; i < created.length; i++) {
					note = created[i];
					if (note.locallyCreated) store.removeLocal(note.localId);
				}
				
				// Update store with returned notes
				var i, note;
				for (i = 0; i < syncedNotes.length; i++) {
					note = syncedNotes[i];
					if (note.archived) store.remove(note.id);
					else store.put(note);
				}
				
				renderedNotes = store.findVisible();
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
	
	renderedNotes = store.findVisible();
	log.info('[sync] Loaded ' + renderedNotes.length + ' notes from local storage.');
	sync();
});