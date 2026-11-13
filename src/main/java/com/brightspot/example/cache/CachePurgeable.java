package com.brightspot.example.cache;

import java.util.Collection;
import java.util.Collections;

import com.psddev.dari.db.Recordable;

/**
 * Content whose cached web pages and GraphQL responses are purged when it's saved or deleted.
 *
 * @see CachePurgeModification
 */
public interface CachePurgeable extends Recordable {

    /**
     * Returns other content whose cached pages or responses can change when this content changes.
     */
    default Collection<? extends Recordable> getRelatedContentToPurge() {
        return Collections.emptyList();
    }
}
