package controllers;

import static play.Play.Mode.DEV;

import java.lang.reflect.Type;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;

import models.Note;
import play.Logger;
import play.Play;
import play.Play.Mode;
import play.cache.Cache;
import play.data.validation.Error;
import play.data.validation.Valid;
import play.db.jpa.JPABase;
import play.mvc.Before;
import play.mvc.Controller;

import com.google.common.collect.Lists;
import com.google.common.collect.Maps;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

public class Ajax extends Controller {
	@Before
	public static void testHook() {
		if (Play.mode == DEV && Cache.get(Test.AJAX_DISABLED) == Boolean.TRUE)
			notFound();
	}

	public static void byId(Long id) {
		Note note = Note.findById(id);
		if (note == null)
			notFound();
		else
			renderJSON(note);
	}
	
	public static void save(Long id, String name, String contents) {
		Note received = new Note();
		received.id = id;
		received.name = name;
		received.contents = contents;
		
		Note persisted = received.merge();
		persisted.save(); // Play makes save explicit !
		renderJSON(persisted);
	}
	
	public static void remove(Long id) {
		Note note = Note.findById(id);
		if (note == null)
			notFound();
		else {
			note.archived = true;
			note.save();
			renderText("");
		}
	}

	public static void sync(Long lastSync, String created, String updated) {
		Logger.debug("sync(lastSync=%s, created=%s, updated=%s)", lastSync,
				created, updated);
		List<Note> createdOnClient = parseNotes(created);
		List<Note> updatedOnClient = parseNotes(updated);
		List<Note> updatedOnServer = Note.find("byLastModifiedGreaterThan",
				lastSync).fetch();
		Logger.debug("%s notes updated on server", updatedOnServer.size());

		List<Note> result = Lists.newArrayList();
		for (Note n : merge(updatedOnClient, updatedOnServer)) {
			n.merge()._save();
			result.add(n);
		}
		for (Note n : createdOnClient) {
			n.save();
			result.add(n);
		}
		renderJSON(result);
	}

	/** Merge by comparing ids; on conflicts, keep the most recent. */
	private static Iterable<Note> merge(List<Note> l1, List<Note> l2) {
		Map<Long, Note> m = Maps.newHashMap();
		for (Note n1 : l1) {
			m.put(n1.id, n1);
		}
		for (Note n2 : l2) {
			Note n1 = m.get(n2.id);
			Note last = (n1 == null || n1.lastModified < n2.lastModified) ? n2
					: n1;
			m.put(last.id, last);
		}
		return m.values();
	}

	static List<Note> parseNotes(String json) {
		List<Note> notes = GSON.fromJson(json, NOTE_LIST_TYPE);
		return notes;
	}

	private static final Gson GSON = new Gson();
	private static final Type NOTE_LIST_TYPE = new TypeToken<List<Note>>() {
	}.getType();
}
