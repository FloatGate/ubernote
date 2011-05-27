package controllers;

import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

import javax.persistence.LockModeType;

import models.Note;

import org.junit.Before;
import org.junit.Ignore;
import org.junit.Test;

import play.db.jpa.JPA;
import play.mvc.Http.Response;
import play.test.Fixtures;
import play.test.FunctionalTest;

import com.google.common.collect.ImmutableMap;
import com.google.common.collect.ImmutableBiMap.Builder;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

public class AjaxTest extends FunctionalTest {
	private long beforeLoad;
	private long afterLoad;

	@Before
	public void setup() {
		Fixtures.deleteAllModels();
		beforeLoad = System.currentTimeMillis();
		Fixtures.loadModels("notes.yml");
		afterLoad = System.currentTimeMillis();
	}

	@Test
	public void testByIdWhenDoesNotExist() {
		// When
		Response response = GET("/data/notes/42");

		// Then
		assertIsNotFound(response);
	}

	@Test
	public void testByIdWhenExists() {
		// Given
		Long note1Id = loadNote(1).id;

		// When
		Response response = GET("/data/notes/" + note1Id);

		// Then
		Note note = parseNote(response);
		assertEquals("note 1", note.name);
		assertEquals("note 1 contents", note.contents);
	}

	@Test
	public void testSync() {
		// Given
		Note dbNote1 = loadNote(1);
		Note dbNote2 = loadNote(2);

		List<Note> updated = Arrays.asList(mockNote(dbNote2.id, "note 2",
				"note 2 new client contents", afterLoad));
		List<Note> created = Arrays.asList(mockNote(null, "note 4",
				"note 4 contents", afterLoad));

		Map<String, String> params = ImmutableMap.<String, String> builder()
				.put("lastSync", Long.toString(afterLoad))
				.put("created", GSON.toJson(created))
				.put("updated", GSON.toJson(updated)).build();

		// Note 1 gets updated on server:
		dbNote1.contents = "note 1 new server contents";
		dbNote1.save();

		// When
		Response response = POST("/data/notes/sync", params);

		// Then
		List<Note> results = parseNotes(response);
		assertEquals(3, results.size());
		Collections.sort(results, BY_ID);
		Iterator<Note> it = results.iterator();
		Note mergedNote1 = it.next();
		assertEquals("note 1", mergedNote1.name);
		assertEquals("note 1 new server contents", mergedNote1.contents);
		assertEquals(dbNote1.lastModified, mergedNote1.lastModified);

		Note mergedNote2 = it.next();
		assertEquals("note 2", mergedNote2.name);
		assertEquals("note 2 new client contents", mergedNote2.contents);

		Note mergedNote3 = it.next();
		assertEquals("note 4", mergedNote3.name);
		assertEquals("note 4 contents", mergedNote3.contents);

		dbNote2.refresh();
		assertEquals("note 2 new client contents", dbNote2.contents);

		assertNotNull(loadNote(4));
	}

	@Test
	public void testSyncWhenNoLocalData() {
		// Given
		Map<String, String> params = ImmutableMap.<String, String> builder()
				.put("lastSync", Long.toString(beforeLoad))
				.put("created", "[]").put("updated", "[]").build();

		// When
		Response response = POST("/data/notes/sync", params);

		// Then
		List<Note> results = parseNotes(response);
		assertEquals(4, results.size());
		Collections.sort(results, BY_ID);
		Iterator<Note> it = results.iterator();
		assertEquals("note 1", it.next().name);
		assertEquals("note 2", it.next().name);
		assertEquals("note 3", it.next().name);
		assertEquals("note 666", it.next().name);
	}

	@Test
	public void testCreate() {
		// Given
		Map<String, String> params = ImmutableMap.<String, String> builder()
				.put("id", "").put("name", "note 4")
				.put("contents", "note 4 contents").put("lastModified", "0")
				.build();

		// When
		Response response = POST("/data/notes", params);

		// Then
		Note returnedNote = parseNote(response);
		assertEquals("note 4", returnedNote.name);
		assertEquals("note 4 contents", returnedNote.contents);

		Note dbNote = loadNote(4);
		assertEquals(returnedNote.id, dbNote.id);
		assertEquals("note 4", dbNote.name);
		assertEquals("note 4 contents", dbNote.contents);
		// generated field, HTTP param must be ignored:
		assertNotSame(dbNote.lastModified, 0L);
	}

	@Test
	public void testModify() {
		// Given
		Note dbNote1 = loadNote(1);
		Map<String, String> params = ImmutableMap.<String, String> builder()
				.put("id", dbNote1.id.toString())
				.put("name", "note 1 new name")
				.put("contents", "note 1 new contents")
				.put("lastModified", Long.toString(afterLoad)).build();

		// When
		Response response = POST("/data/notes", params);

		// Then
		Note returnedNote = parseNote(response);
		assertEquals(dbNote1.id, returnedNote.id);
		assertEquals("note 1 new name", returnedNote.name);
		assertEquals("note 1 new contents", returnedNote.contents);

		dbNote1.refresh();
		assertEquals("note 1 new name", dbNote1.name);
		assertEquals("note 1 new contents", dbNote1.contents);
	}

	@Test
	public void testRemove() {
		// Given
		Note dbNote1 = loadNote(1);

		// When
		Response response = DELETE("/data/notes/" + dbNote1.id);

		// Then
		assertIsOk(response);
		dbNote1.refresh();
		assertTrue(dbNote1.archived);
	}

	private static final Gson GSON = new Gson();

	private Note loadNote(int index) {
		return Note.find("byName", "note " + index).first();
	}

	private Note mockNote(Long id, String name, String contents,
			long lastModified) {
		Note n = new Note();
		n.id = id;
		n.name = name;
		n.contents = contents;
		n.lastModified = lastModified;
		return n;
	}

	private Note parseNote(Response jsonResponse) {
		assertIsOk(jsonResponse);
		Gson gson = new Gson();
		Note note = gson.fromJson(getContent(jsonResponse), Note.class);
		return note;
	}

	private List<Note> parseNotes(Response jsonResponse) {
		assertIsOk(jsonResponse);
		return Ajax.parseNotes(getContent(jsonResponse));
	}

	private Comparator<Note> BY_ID = new Comparator<Note>() {
		@Override
		public int compare(Note n1, Note n2) {
			return n1.id.compareTo(n2.id);
		}
	};
}
