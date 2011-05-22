package controllers;

import static play.Play.Mode.PROD;
import models.Note;
import play.Play;
import play.Play.Mode;
import play.cache.Cache;
import play.mvc.Before;
import play.mvc.Controller;

/** Helper URIs to mock stuff from the Selenium tests. */
public class Test extends Controller {
	@Before
	public static void hideInProd() {
		if (Play.mode == PROD)
			notFound();
	}

	public static void clearLocalStorage() {
		render();
	}

	/** @see Pages#cache() */
	public static void touchCacheManifest() {
		String ts = Long.toString(System.currentTimeMillis());
		Cache.set(MANIFEST_TIMESTAMP, ts);
		renderText("Touched cache manifest at " + ts);
	}

	/**
	 * Simulate loss of server connectivity
	 * 
	 * @see Ajax#testHook()
	 */
	public static void disableAjax() {
		Cache.set(AJAX_DISABLED, Boolean.TRUE);
		renderText("Ajax requests disabled");
	}

	public static void enableAjax() {
		Cache.delete(AJAX_DISABLED);
		renderText("Ajax requests enabled");
	}

	public static void showServerNote(String name) {
		Note note = Note.find("byName", name).first();
		if (note == null)
			renderText("not found");
		else
			renderText("name=" + note.name + "\ncontents=" + note.contents);
	}

	public static void touchServerNote(String name) {
		Note note = Note.find("byName", name).first();
		note.contents = note.contents.endsWith(" ") ? note.contents.trim()
				: note.contents + " ";
		note.save();
		renderText("Touched note '%s' at %s", note.name, note.lastModified);
	}

	static final String AJAX_DISABLED = "testAjaxFlag";
	static final String MANIFEST_TIMESTAMP = "manifestTimeStamp";
}
