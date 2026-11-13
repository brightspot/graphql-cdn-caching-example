package com.brightspot.example.cache;

import java.util.Collections;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicReference;

import com.psddev.dari.web.WebRequestExtension;

/**
 * Collects the IDs of content rendered during the current request so they can be sent as CDN cache tags.
 */
public class CacheTagRequest extends WebRequestExtension {

    private final Set<UUID> contentIds = ConcurrentHashMap.newKeySet();

    private final AtomicReference<UUID> mainContentId = new AtomicReference<>();

    /**
     * Returns the cache tag for the given content ID, {@code c-<id>}.
     *
     * <p>The CMS purge code must use this too, so purged tags match the ones sent on responses. The tag uses a hyphen
     * rather than a colon, since Akamai doesn't allow colons in cache tags.</p>
     */
    public static String toContentTag(UUID id) {
        return "c-" + id;
    }

    /**
     * Records that the content with the given ID was rendered, ignoring {@code null}.
     *
     * <p>The first ID recorded becomes the main content ID.</p>
     *
     * @param id Nullable.
     * @return {@code true} if the ID became the main content ID.
     */
    public boolean addContentId(UUID id) {
        if (id == null) {
            return false;
        }

        contentIds.add(id);
        return mainContentId.compareAndSet(null, id);
    }

    /**
     * Returns the IDs of all the content rendered so far.
     */
    public Set<UUID> getContentIds() {
        return Collections.unmodifiableSet(contentIds);
    }

    /**
     * Returns the ID of the first content rendered, or {@code null} if nothing has been.
     *
     * <p>It's the queried entry point's ID, since nested view models are created after it.</p>
     */
    public UUID getMainContentId() {
        return mainContentId.get();
    }
}
