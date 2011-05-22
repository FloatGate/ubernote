$(document).ready(function() {
	var fillForm = function(note) {
		if (note.id) $('#id').val(note.id);
		if (note.localId) $('#name').val(note.localId);
		$('#name').val(note.name);
		$('#contents').val(note.contents);
	};
	
	var readField = function(name, into) {
		var fieldText = $('#' + name).val();
		if (fieldText.length > 0) into[name] = fieldText;
	};
	
	var readForm = function() {
		var note = {};
		readField('id', note);
		readField('localId', note);
		readField('name', note);
		readField('contents', note);
		
		var ts =  new Date().getTime();
		note.lastModified = ts;
		if (!note.id && !note.localId) note.localId = ts;
		return note;
	};
	
	var notFound = function() {
		$('#errors').text('This note does not exist.');
		$('#save').attr('disabled', 'disabled');
	};
	
	var save = function() {
		var formData = readForm();
		if (!formData.name || !formData.contents) {
			$('#errors').text('All fields are mandatory.');
		} else {
			$('#errors').text('');
			$.post(window.saveAction(), formData,
				function(serverNote) {
					window.noteStore.put(serverNote);
					// Delete stale local data:
					if (!formData.id) window.noteStore.deleteLocal(formData.localId);
					window.location.href = '/';
				}
			).error(function() {
				log.error('Error sending note to server! Will save locally');
				window.noteStore.put(formData);
				window.location.href = '/';
			});
		}
	};
	
	$('#save').click(function(e) {
		save();
		e.preventDefault();
	});
	$('#cancel').click(function() { window.location.href = '/' });
	
	var parts = window.location.pathname.split('/');
	var where = parts[1];
	var id = parts[2];
	
	if (where == 'notes') {
		if (id == 'new') {
			log.info('Creating a new note');
		} else {
			log.info('Editing note with remote id ' + id);
			var localNote = window.noteStore.get(id);
			$.get(window.loadAction({id: id}),
				function(serverNote) {
					var last = (localNote && localNote.lastModified > serverNote.lastModified) ? localNote : serverNote;
					fillForm(last);
				}
			).error(function() {
				log.error('Error loading note from server! Will use local data.');
				if (localNote) fillForm(localNote);
				else notFound();
			});
		}
	} else if (where == 'localNotes') {
		log.info('Editing note with local id ' + id);
		var note = window.noteStore.getLocal(id);
		fillForm(note);
	}
});
