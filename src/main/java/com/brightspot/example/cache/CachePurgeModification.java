package com.brightspot.example.cache;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import com.brightspot.example.api.DeliveryApiEndpoint;
import com.psddev.cms.db.Directory;
import com.psddev.cms.db.Site;
import com.psddev.dari.db.Modification;
import com.psddev.dari.db.Query;
import com.psddev.dari.db.Recordable;
import com.psddev.dari.db.State;
import org.apache.commons.lang3.Strings;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Modification that purges content from the demo CDN by cache tag when it's saved or deleted.
 *
 * <p>It only purges when the delivery endpoint's {@code enableCachePurge} setting is on. Varnish stands in for a real
 * CDN. Web permalinks are only logged, since the demo has no cached web pages.</p>
 */
public class CachePurgeModification extends Modification<CachePurgeable> {

    private static final Logger LOGGER = LoggerFactory.getLogger(CachePurgeModification.class);

    /**
     * Purges the saved content, and its related content, from the CDN.
     */
    @Override
    protected void afterSave() {
        purge("save");
    }

    /**
     * Purges the deleted content, and its related content, from the CDN.
     */
    @Override
    protected void afterDelete() {
        purge("delete");
    }

    // Purges by cache tag, and logs the URLs a cache of web pages would also need purged.
    private void purge(String event) {
        DeliveryApiEndpoint endpoint = Query.from(DeliveryApiEndpoint.class).first();

        if (endpoint == null || !endpoint.isEnableCachePurge()) {
            return;
        }

        Map<UUID, Recordable> contents = new LinkedHashMap<>();
        contents.put(getId(), getOriginalObject());

        for (Recordable related : getOriginalObject().getRelatedContentToPurge()) {
            if (related != null) {
                contents.putIfAbsent(related.getState().getId(), related);
            }
        }

        Set<String> urls = new LinkedHashSet<>();
        List<String> tags = new ArrayList<>();
        List<String> descriptions = new ArrayList<>();

        for (Recordable content : contents.values()) {
            State state = content.getState();

            for (Directory.Path path : content.as(Directory.Data.class).getPaths()) {
                urls.addAll(toUrls(path));
            }

            tags.add(CacheTagRequest.toContentTag(state.getId()));
            descriptions.add(state.getType().getDisplayName() + " \"" + state.getLabel() + "\" (" + state.getId() + ")");
        }

        LOGGER.info(
            "CDN purge after {} of {}:\n  urls (logged only): {}\n  tags: {}\n  content: {}",
            event,
            descriptions.get(0),
            urls,
            tags,
            String.join(", ", descriptions));

        CdnPurge.purgeTags(tags);
    }

    // A site path is served on each of that site's URLs; a path with no site can be served on any site's.
    private static List<String> toUrls(Directory.Path path) {
        List<Site> sites = path.getSite() != null
            ? Collections.singletonList(path.getSite())
            : Query.from(Site.class).selectAll();

        List<String> urls = new ArrayList<>();

        for (Site site : sites) {
            List<String> siteUrls = site.getUrls();

            if (siteUrls != null) {
                for (String siteUrl : siteUrls) {
                    urls.add(Strings.CS.removeEnd(siteUrl, "/") + path.getPath());
                }
            }
        }

        return urls;
    }
}
