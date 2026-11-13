package com.brightspot.example.cache;

import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Collection;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import com.psddev.dari.util.Settings;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Client for the demo CDN's purge endpoint, Varnish standing in for a CDN's purge-by-tag API.
 */
public final class CdnPurge {

    private static final Logger LOGGER = LoggerFactory.getLogger(CdnPurge.class);

    private static final String PURGE_URL_SETTING = "example/cdnPurgeUrl";

    // Purging before Solr shows a save would let the next request re-cache a stale article list.
    private static final long PURGE_DELAY_SECONDS = 3;

    private static final ScheduledExecutorService EXECUTOR = Executors.newSingleThreadScheduledExecutor(r -> {
        Thread thread = new Thread(r, "cdn-purge");
        thread.setDaemon(true);
        return thread;
    });

    // Static methods only.
    private CdnPurge() {
    }

    /**
     * Purges the given cache tags from the CDN a few seconds from now, in the background.
     *
     * <p>It does nothing when there are no tags, or when the {@code example/cdnPurgeUrl} setting is missing.</p>
     *
     * @param tags Cache tags to purge.
     */
    public static void purgeTags(Collection<String> tags) {
        String purgeUrl = Settings.get(String.class, PURGE_URL_SETTING);

        if (purgeUrl != null && !tags.isEmpty()) {
            String tagHeader = String.join(",", tags);
            EXECUTOR.schedule(() -> send(purgeUrl, tagHeader), PURGE_DELAY_SECONDS, TimeUnit.SECONDS);
        }
    }

    // Logs failures instead of throwing, since nothing waits on the result.
    private static void send(String purgeUrl, String tags) {
        try {
            HttpURLConnection connection = (HttpURLConnection) new URL(purgeUrl).openConnection();
            connection.setRequestMethod("POST");
            connection.setRequestProperty("X-Purge-Tags", tags);
            connection.setConnectTimeout(2000);
            connection.setReadTimeout(2000);

            int status = connection.getResponseCode();
            connection.disconnect();

            if (status == HttpURLConnection.HTTP_OK) {
                LOGGER.info("Purged CDN tags: {}", tags);

            } else {
                LOGGER.warn("CDN purge returned HTTP {} for tags: {}", status, tags);
            }

        } catch (IOException e) {
            LOGGER.warn("CDN purge failed for tags: " + tags, e);
        }
    }
}
