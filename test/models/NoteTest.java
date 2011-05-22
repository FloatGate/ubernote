package models;

import org.junit.Test;

import play.test.UnitTest;

public class NoteTest extends UnitTest {
	@Test
	public void testInsert() {
		// Given
		Note note = new Note();
		note.name = "test";
		note.contents = "test content";
		long beforeSave = System.currentTimeMillis() - 1;
		
		// When
		note.save();
		
		// Then
		assertNotNull(note.id);
		assertTrue(note.lastModified > beforeSave);
	}
}
