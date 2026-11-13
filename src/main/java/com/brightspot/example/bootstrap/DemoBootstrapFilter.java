package com.brightspot.example.bootstrap;

import java.util.Collections;
import java.util.Date;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.brightspot.example.api.ManagementApiEndpoint;
import com.psddev.cms.api.ApiClient;
import com.psddev.cms.api.ApiEndpoint;
import com.psddev.cms.api.ApiKey;
import com.psddev.cms.api.ServletApiEndpointFilter;
import com.psddev.cms.db.Site;
import com.psddev.dari.db.Query;
import com.psddev.dari.db.Singleton;
import com.psddev.dari.util.AbstractFilter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Filter that creates the demo's site and a management API client before the first request is handled.
 *
 * <p>A fresh install then needs no setup in the CMS. It only creates what's missing, so it's safe on every
 * startup.</p>
 */
public class DemoBootstrapFilter extends AbstractFilter implements AbstractFilter.Auto {

    private static final Logger LOGGER = LoggerFactory.getLogger(DemoBootstrapFilter.class);

    /**
     * Name of the site the filter creates.
     */
    public static final String SITE_NAME = "Example News";

    /**
     * URL of the site the filter creates, which the front end sends in its {@code X-Site} header.
     */
    public static final String SITE_URL = "http://example.localhost";

    /**
     * ID of the API client the filter creates for the seed script.
     *
     * <p>It's fixed, like {@link #CLIENT_SECRET}, so the seed script works without any setup, which also means anyone
     * can use them: local demos only. {@code fe/scripts/seed.ts} defaults to the same values.</p>
     */
    public static final UUID CLIENT_ID = UUID.fromString("00000000-0000-4000-8000-000000000001");

    /**
     * Secret of the API key the filter creates for {@link #CLIENT_ID}.
     */
    public static final String CLIENT_SECRET = "example-news-demo-secret";

    private static volatile boolean bootstrapped;

    /**
     * Runs this filter before the one that serves API endpoints, so the seed script's first request finds the API
     * client.
     *
     * @param filterClass Filter whose dependencies are being resolved.
     * @param dependencies Filters that run before it.
     */
    @Override
    public void updateDependencies(
        Class<? extends AbstractFilter> filterClass,
        List<Class<? extends Filter>> dependencies) {

        if (ServletApiEndpointFilter.class.isAssignableFrom(filterClass)) {
            dependencies.add(getClass());
        }
    }

    /**
     * Creates the site and API client on the first request, then passes every request along.
     *
     * @param request HTTP request.
     * @param response HTTP response.
     * @param chain Rest of the filter chain.
     * @throws Exception If the rest of the chain throws.
     */
    @Override
    protected void doRequest(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
        throws Exception {

        if (!bootstrapped) {
            synchronized (DemoBootstrapFilter.class) {
                if (!bootstrapped) {
                    bootstrap();
                    bootstrapped = true;
                }
            }
        }

        chain.doFilter(request, response);
    }

    // Logs a failure instead of throwing. It isn't retried, so a failure costs one log entry, not one per request.
    private static void bootstrap() {
        try {
            createSite();
            createApiClient();

        } catch (RuntimeException e) {
            // Don't take the CMS down with it; the site and client can still be created there by hand.
            LOGGER.error("Demo bootstrap failed. Create the site and API client in the CMS instead.", e);
        }
    }

    // Skipped when a site already has the URL.
    private static void createSite() {
        if (Site.Static.findByUrl(SITE_URL) != null) {
            return;
        }

        Site site = new Site();
        site.setName(SITE_NAME);
        site.setUrls(Collections.singletonList(SITE_URL));
        site.saveImmediately();
        LOGGER.info("Created the {} site at {}", SITE_NAME, SITE_URL);
    }

    // Creates the client, its access to the management endpoint and its key, skipping whatever already exists.
    private static void createApiClient() {
        ManagementApiEndpoint endpoint = Singleton.getInstance(ManagementApiEndpoint.class);
        ApiClient client = Query.from(ApiClient.class).where("_id = ?", CLIENT_ID).first();

        if (client == null) {
            client = new ApiClient();
            client.getState().setId(CLIENT_ID);
            client.setName(SITE_NAME + " Seed");
        }

        Set<ApiEndpoint> endpoints = new LinkedHashSet<>();

        if (client.getEndpoints() != null) {
            endpoints.addAll(client.getEndpoints());
        }

        if (endpoints.stream().noneMatch(e -> e.getId().equals(endpoint.getId()))) {
            endpoints.add(endpoint);
            client.setEndpoints(endpoints);
            client.saveImmediately();
            LOGGER.info("Gave API client {} access to the management endpoint", CLIENT_ID);
        }

        if (Query.from(ApiKey.class).where("client = ? && value = ?", client, CLIENT_SECRET).first() == null) {
            ApiKey key = new ApiKey();
            key.setClient(client);
            key.setName("Seed");
            key.setValue(CLIENT_SECRET);
            key.setCreatedOn(new Date());
            key.saveImmediately();
            LOGGER.info("Created the API key for client {}", CLIENT_ID);
        }
    }
}
