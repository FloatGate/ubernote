package controllers;

import static play.Play.Mode.DEV;
import play.Logger;
import play.Play;
import play.Play.Mode;
import play.cache.Cache;
import play.mvc.Controller;

public class Pages extends Controller {
	public static void list() {
		Logger.debug("Rendering list page");
		render();
	}

	/** @see Test#touchCacheManifest() */
	public static void cacheManifest() {
		if (Play.mode == DEV)
			renderArgs.put("timestamp", Cache.get(Test.MANIFEST_TIMESTAMP));
		request.format = "manifest";
		renderTemplate("Pages/cache.manifest");
	}

	public static void detail(Long id) {
		detail();
	}

	public static void localDetail(Long id) {
		detail();
	}

	private static void detail() {
		renderTemplate("Pages/detail.html");
	}
}
