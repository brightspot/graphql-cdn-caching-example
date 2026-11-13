package com.brightspot.example.vm;

import java.net.URI;

import com.psddev.cms.db.Directory;
import com.psddev.dari.db.Recordable;

/**
 * Permalink helpers for the view models.
 */
final class Permalinks {

    // Static methods only.
    private Permalinks() {
    }

    /**
     * Returns the path of the content's permalink, or {@code null} if it has none.
     *
     * <p>Site-owned content's permalink is a full URL on the site's host, but the front end routes on the path
     * alone.</p>
     */
    static String path(Recordable content) {
        String permalink = content.as(Directory.ObjectModification.class).getPermalink();
        return permalink != null ? URI.create(permalink).getRawPath() : null;
    }
}
