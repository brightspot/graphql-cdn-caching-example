package com.brightspot.example.cache;

import java.time.Instant;
import java.util.Collection;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import com.psddev.conditionalrequest.ConditionalRequestValidator;
import com.psddev.conditionalrequest.DefaultConditionalRequestValidator;
import com.psddev.dari.db.Query;
import com.psddev.dari.db.Recordable;

/**
 * Conditional request validator covering every piece of content a response rendered, not just its main content.
 *
 * <p>A change to related content, like the author's name or the articles in a list, changes the ETag too.</p>
 */
public class RenderedContentValidator implements ConditionalRequestValidator {

    private final List<Recordable> contents;

    /**
     * Creates a validator for the content with the given IDs.
     *
     * @param contentIds IDs of the content the response rendered.
     */
    public RenderedContentValidator(Collection<UUID> contentIds) {
        this.contents = contentIds.isEmpty()
            ? Collections.emptyList()
            : Query.fromAll().where("_id = ?", contentIds).selectAll().stream()
                .map(Recordable.class::cast)
                .sorted(Comparator.comparing((Recordable content) -> content.getState().getId()))
                .collect(Collectors.toList());
    }

    /**
     * Returns the default ETag of each piece of content, in ID order, joined with periods.
     */
    @Override
    public String getETag() {
        return contents.stream()
            .map(content -> new DefaultConditionalRequestValidator(content).getETag())
            .collect(Collectors.joining("."));
    }

    /**
     * Returns {@code null}, since the plugin answers 304 when either the ETag or this date matches, and a latest update
     * date can't tell when content drops out of a list.
     */
    @Override
    public Instant getLastModified() {
        return null;
    }
}
