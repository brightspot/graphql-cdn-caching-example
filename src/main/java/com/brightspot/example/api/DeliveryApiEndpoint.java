package com.brightspot.example.api;

import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

import javax.servlet.http.HttpServletResponse;

import com.brightspot.example.cache.CacheTagRequest;
import com.brightspot.example.cache.CdnPurge;
import com.brightspot.example.cache.RenderedContentValidator;
import com.brightspot.example.vm.ArticleViewModel;
import com.brightspot.example.vm.AuthorViewModel;
import com.brightspot.example.vm.HomePageViewModel;
import com.brightspot.example.vm.SectionViewModel;
import com.psddev.cms.db.ToolUi;
import com.psddev.cms.ui.form.Note;
import com.psddev.cms.ui.form.Placeholder;
import com.psddev.cms.view.ViewResponse;
import com.psddev.conditionalrequest.ConditionalRequest;
import com.psddev.conditionalrequest.DefaultConditionalRequestValidator;
import com.psddev.conditionalrequest.handler.ViewConditionalResponseHandler;
import com.psddev.conditionalrequest.handler.WebConditionalResponseHandler;
import com.psddev.dari.db.Recordable;
import com.psddev.dari.db.Singleton;
import com.psddev.dari.web.WebRequest;
import com.psddev.dari.web.WebResponse;
import com.psddev.graphql.GraphQLApiAccessOption;
import com.psddev.graphql.GraphQLApiAccessOptionImplicit;
import com.psddev.graphql.GraphQLApiRequest;
import com.psddev.graphql.GraphQLApiResponse;
import com.psddev.graphql.IntrospectionQueryRule;
import com.psddev.graphql.cda.ContentDeliveryApiEndpoint;
import com.psddev.graphql.cda.ContentDeliveryApiResponse;
import com.psddev.graphql.cda.ContentDeliveryEntryPointField;
import com.psddev.graphql.pqp.PersistedQueryProtocol;

/**
 * GraphQL Content Delivery API endpoint for the front end, with a setting for each caching strategy the demo shows.
 *
 * <p>Its responses carry {@code Cache-Tag} and {@code Cache-Control} headers for the CDN, and an {@code X-Content-Id}
 * header for the front end's Edit in CMS link.</p>
 */
public class DeliveryApiEndpoint extends ContentDeliveryApiEndpoint implements Singleton {

    private static final String CACHE_TAG_HEADER = "Cache-Tag";

    private static final String CONTENT_ID_HEADER = "X-Content-Id";

    // Cloudflare's limit for the Cache-Tag header. CloudFront allows 50 tags per response, and Akamai 128 tags within
    // an 8 KB header, so change this check to match your CDN.
    private static final int MAX_CACHE_TAG_HEADER_LENGTH = 16000;

    private static final String NO_CACHE = "private, max-age=0, no-cache";

    // Long enough to edit content before a cached copy expires, short enough to sit and watch it revalidate. Production
    // would use hours or days.
    private static final int DEFAULT_CDN_TTL_SECONDS = 60;
    private static final int DEFAULT_REVALIDATION_TTL_SECONDS = 10;
    private static final int UNTAGGED_TTL_SECONDS = 60;

    private static final Pattern UUID_PATTERN =
        Pattern.compile("(?i)[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}");

    @Note("Lets clients send a GET with a hash of the query instead of the full query, so a CDN can cache the "
        + "response. When off, clients send every query as a POST, which CDNs don't cache.")
    private boolean enablePersistedQueries;

    @Note("When content is saved, purges the cached responses that show it, and the pages that list it, from "
        + "the CDN by cache tag, so changes appear within seconds.")
    private boolean enableCachePurge;

    @Note("Adds an ETag and stale-while-revalidate. Once a cached response's TTL runs out, the CDN keeps serving "
        + "it while checking back, and Brightspot answers 304 Not Modified if nothing changed.")
    private boolean enableConditionalRequests;

    @Note("What Brightspot checks to tell whether a cached response changed. Everything Rendered runs the query and "
        + "checks all the content it shows. Requested Content Only checks just the content the query asked for, and "
        + "skips running the query if it hasn't changed, but misses changes to related content, like an article's "
        + "author.")
    @Placeholder("Everything Rendered (Accurate)")
    private ConditionalRequestCheck conditionalRequestCheck;

    @DisplayName("CDN TTL (Seconds)")
    @Minimum(0)
    @ToolUi.Cluster("TTL")
    @Placeholder("" + DEFAULT_CDN_TTL_SECONDS)
    private Integer cdnTtlSeconds;

    @DisplayName("Revalidation TTL (Seconds)")
    @Minimum(0)
    @ToolUi.Cluster("TTL")
    @Note("Replaces the CDN TTL when conditional requests are on and cache purging is off, since revalidating is "
        + "then the only way content refreshes.")
    @Placeholder("" + DEFAULT_REVALIDATION_TTL_SECONDS)
    private Integer revalidationTtlSeconds;

    /**
     * Returns whether clients can send a persisted query hash instead of the full query.
     */
    public boolean isEnablePersistedQueries() {
        return enablePersistedQueries;
    }

    /**
     * Sets whether clients can send a persisted query hash instead of the full query.
     */
    public void setEnablePersistedQueries(boolean enablePersistedQueries) {
        this.enablePersistedQueries = enablePersistedQueries;
    }

    /**
     * Returns whether saving content purges the cached responses that show it.
     */
    public boolean isEnableCachePurge() {
        return enableCachePurge;
    }

    /**
     * Sets whether saving content purges the cached responses that show it.
     */
    public void setEnableCachePurge(boolean enableCachePurge) {
        this.enableCachePurge = enableCachePurge;
    }

    /**
     * Returns whether responses carry an ETag and {@code stale-while-revalidate}, so the CDN can revalidate them.
     */
    public boolean isEnableConditionalRequests() {
        return enableConditionalRequests;
    }

    /**
     * Sets whether responses carry an ETag and {@code stale-while-revalidate}, so the CDN can revalidate them.
     */
    public void setEnableConditionalRequests(boolean enableConditionalRequests) {
        this.enableConditionalRequests = enableConditionalRequests;
    }

    /**
     * Returns what a conditional request checks, {@link ConditionalRequestCheck#RENDERED_CONTENT} by default.
     */
    public ConditionalRequestCheck getConditionalRequestCheck() {
        return conditionalRequestCheck != null ? conditionalRequestCheck : ConditionalRequestCheck.RENDERED_CONTENT;
    }

    /**
     * Sets what a conditional request checks, or {@code null} for the default.
     */
    public void setConditionalRequestCheck(ConditionalRequestCheck conditionalRequestCheck) {
        this.conditionalRequestCheck = conditionalRequestCheck;
    }

    /**
     * Returns how long the CDN caches a response, in seconds, 60 by default.
     */
    public int getCdnTtlSeconds() {
        return cdnTtlSeconds != null ? cdnTtlSeconds : DEFAULT_CDN_TTL_SECONDS;
    }

    /**
     * Sets how long the CDN caches a response, in seconds, or {@code null} for the default.
     */
    public void setCdnTtlSeconds(Integer cdnTtlSeconds) {
        this.cdnTtlSeconds = cdnTtlSeconds;
    }

    /**
     * Returns the CDN TTL, in seconds, used instead of {@link #getCdnTtlSeconds()} when conditional requests are on
     * and cache purging is off, 10 by default.
     */
    public int getRevalidationTtlSeconds() {
        return revalidationTtlSeconds != null ? revalidationTtlSeconds : DEFAULT_REVALIDATION_TTL_SECONDS;
    }

    /**
     * Sets the revalidation TTL, in seconds, or {@code null} for the default.
     */
    public void setRevalidationTtlSeconds(Integer revalidationTtlSeconds) {
        this.revalidationTtlSeconds = revalidationTtlSeconds;
    }

    /**
     * Returns the default protocol, or {@code null} when persisted queries aren't enabled.
     *
     * <p>Without a protocol, requests that carry a persisted query hash get a PersistedQueryNotSupported error.
     * Apollo's persisted query link then sends full queries as POSTs for the rest of the page's life, which the CDN
     * never caches.</p>
     */
    @Override
    public PersistedQueryProtocol getPersistedQueryProtocol() {
        return enablePersistedQueries ? super.getPersistedQueryProtocol() : null;
    }

    /**
     * Runs the fast conditional request check, on just the content the query asked for, before the rest of the query
     * runs.
     *
     * <p>It only checks when conditional requests are on and set to
     * {@link ConditionalRequestCheck#REQUESTED_CONTENT}. A change to related content alone, like an article's author,
     * goes unnoticed, so the CDN keeps its cached response until the requested content itself changes or is
     * purged.</p>
     *
     * @param content Content the query asked for.
     * @param response View response, which gets the {@code ETag}, and the 304 status if nothing changed.
     * @return {@code true} if the content hasn't changed, so the caller should throw the view response to stop the
     *     query.
     */
    public boolean checkRequestedContent(Recordable content, ViewResponse response) {
        if (!enableConditionalRequests || getConditionalRequestCheck() != ConditionalRequestCheck.REQUESTED_CONTENT) {
            return false;
        }

        return ConditionalRequest.newBuilder(content)
            .addValidator(new DefaultConditionalRequestValidator(content))
            .responseHandler(new ViewConditionalResponseHandler(response))
            .build()
            .process()
            .isNotModified();
    }

    /**
     * Purges everything this endpoint served from the CDN, whether or not cache purging is enabled for content.
     *
     * <p>These settings change how every response is cached, and saving the endpoint invalidates its persisted
     * queries.</p>
     */
    @Override
    protected void afterSave() {
        super.afterSave();
        CdnPurge.purgeTags(Collections.singletonList(endpointTag()));
    }

    /**
     * Returns {@code /delivery/graphql}.
     */
    @Override
    public Set<String> getPaths() {
        Set<String> paths = new LinkedHashSet<>();
        paths.add("/delivery/graphql");
        return paths;
    }

    /**
     * Returns the home page, article, author and section view models.
     */
    @Override
    public List<ContentDeliveryEntryPointField> getQueryEntryFields() {
        return Arrays.asList(
            new ContentDeliveryEntryPointField(HomePageViewModel.class),
            new ContentDeliveryEntryPointField(ArticleViewModel.class),
            new ContentDeliveryEntryPointField(AuthorViewModel.class),
            new ContentDeliveryEntryPointField(SectionViewModel.class)
        );
    }

    /**
     * Returns a rule that allows every introspection query, so the front end's codegen can read the schema.
     */
    @SuppressWarnings("deprecation")
    @Override
    public IntrospectionQueryRule getIntrospectionQueryRule() {
        return () -> true;
    }

    /**
     * Returns implicit access, so the front end needs no API client.
     */
    @Override
    public GraphQLApiAccessOption getApiAccessOption() {
        return new GraphQLApiAccessOptionImplicit();
    }

    /**
     * Adds the {@code X-Content-Id} header, and the cache headers for whichever caching strategies are enabled.
     *
     * <p>Errors and previews are never cached.</p>
     *
     * @param graphQLApiResponse Response to the GraphQL request.
     * @param webResponse HTTP response that gets the headers.
     */
    @Override
    protected void finalizeResponse(GraphQLApiResponse graphQLApiResponse, WebResponse webResponse) {
        super.finalizeResponse(graphQLApiResponse, webResponse);

        CacheTagRequest cacheTagRequest = WebRequest.getCurrent().as(CacheTagRequest.class);
        UUID mainContentId = cacheTagRequest.getMainContentId();

        // Lets the front end link to the content in the CMS without adding an ID to the schema.
        if (mainContentId != null) {
            webResponse.setHeader(CONTENT_ID_HEADER, mainContentId.toString());
        }

        // The fast check found the requested content unchanged and stopped the query.
        if (isStoppedNotModified(graphQLApiResponse)) {
            webResponse.setStatus(HttpServletResponse.SC_NOT_MODIFIED);

            // No Cache-Tag: a CDN replaces the cached response's headers with the ones a 304 sends, and this request
            // stopped before rendering the related content, so its tags would be incomplete.
            webResponse.setHeader("Cache-Control", revalidatingCacheControl(
                enableCachePurge ? getCdnTtlSeconds() : getRevalidationTtlSeconds()));
            return;
        }

        // isNoCache covers previews and PersistedQueryNotFound; GraphQL errors still return 200.
        if (graphQLApiResponse.isNoCache() || graphQLApiResponse.getResponseMap().containsKey("errors")) {
            webResponse.setHeader("Cache-Control", NO_CACHE);
            return;
        }

        // Demo housekeeping rather than part of either strategy: saving this endpoint invalidates the persisted queries
        // behind every response it served, so afterSave purges them all by this tag.
        Set<String> cacheTags = new LinkedHashSet<>();
        cacheTags.add(endpointTag());

        int ttl = getCdnTtlSeconds();

        // A response that can't be tagged with its content, e.g. for a path that doesn't exist yet, won't be purged
        // when the content changes.
        if (enableCachePurge && !addContentTags(cacheTagRequest, cacheTags)) {
            ttl = Math.min(UNTAGGED_TTL_SECONDS, ttl);
        }

        webResponse.setHeader(CACHE_TAG_HEADER, String.join(",", cacheTags));

        if (enableConditionalRequests) {
            webResponse.setHeader("Cache-Control", revalidatingCacheControl(
                enableCachePurge ? ttl : getRevalidationTtlSeconds()));

            // The fast check, if selected, already ran in AbstractViewModel before the query.
            if (getConditionalRequestCheck() == ConditionalRequestCheck.RENDERED_CONTENT) {
                checkRenderedContent(cacheTagRequest, webResponse);
            }

        } else {
            // max-age=0 because browser caches can't be purged.
            webResponse.setHeader("Cache-Control", "public, max-age=0, s-maxage=" + ttl);
        }
    }

    // A view model that throws its ViewResponse stops the query. 4.8's delivery API copies that response's headers,
    // like the ETag, but not its status, and reports the throw as a GraphQL error.
    private static boolean isStoppedNotModified(GraphQLApiResponse graphQLApiResponse) {
        ViewResponse viewResponse = graphQLApiResponse instanceof ContentDeliveryApiResponse
            ? ((ContentDeliveryApiResponse) graphQLApiResponse).getViewResponse()
            : null;

        return viewResponse != null
            && Integer.valueOf(HttpServletResponse.SC_NOT_MODIFIED).equals(viewResponse.getStatus());
    }

    // Once the TTL runs out, the CDN keeps serving its copy while it checks back with If-None-Match.
    private static String revalidatingCacheControl(int ttl) {
        return "public, max-age=0, s-maxage=" + ttl + ", stale-while-revalidate=86400";
    }

    // Adds a tag for each piece of content the response rendered or looked up. Adds nothing and returns false when
    // there are none, or too many to fit in the header.
    private boolean addContentTags(CacheTagRequest cacheTagRequest, Set<String> cacheTags) {
        Set<String> contentTags = new LinkedHashSet<>();

        for (UUID id : cacheTagRequest.getContentIds()) {
            contentTags.add(CacheTagRequest.toContentTag(id));
        }

        // Covers lookups of content that rendered nothing, e.g., not yet published.
        collectVariableIds(WebRequest.getCurrent().as(GraphQLApiRequest.class).getVariables(), contentTags);

        int headerLength = String.join(",", cacheTags).length() + 1 + String.join(",", contentTags).length();

        if (contentTags.isEmpty() || headerLength > MAX_CACHE_TAG_HEADER_LENGTH) {
            return false;
        }

        cacheTags.addAll(contentTags);
        return true;
    }

    // The accurate conditional request check, on everything the response rendered, after the query runs.
    private void checkRenderedContent(CacheTagRequest cacheTagRequest, WebResponse webResponse) {
        // Sets the ETag, or a 304 status when the CDN's If-None-Match still matches. The query has already run, since
        // the ETag covers what it rendered, so a 304 saves sending the response but not building it. The endpoint
        // still writes the body afterward, and the servlet container leaves it out of the 304, as HTTP requires.
        // No main object, since one GraphQL request can look up several; the validator covers everything it rendered.
        ConditionalRequest.newBuilder(null)
            .addValidator(new RenderedContentValidator(cacheTagRequest.getContentIds()))
            .responseHandler(new WebConditionalResponseHandler(webResponse))
            .build()
            .process();
    }

    // On every response this endpoint serves, so saving the endpoint can purge them all.
    private String endpointTag() {
        return "ep-" + getId();
    }

    // Adds a content tag for every UUID in the query's variables, however deeply nested.
    private static void collectVariableIds(Object node, Set<String> tags) {
        if (node instanceof Map) {
            for (Object value : ((Map<?, ?>) node).values()) {
                collectVariableIds(value, tags);
            }

        } else if (node instanceof Collection) {
            for (Object value : (Collection<?>) node) {
                collectVariableIds(value, tags);
            }

        } else if (node instanceof String && UUID_PATTERN.matcher((String) node).matches()) {
            tags.add(CacheTagRequest.toContentTag(UUID.fromString((String) node)));
        }
    }

    /**
     * What a conditional request checks to tell whether a cached response changed.
     */
    public enum ConditionalRequestCheck {

        /**
         * Everything the response rendered, after the query runs, so a 304 saves sending the response but not
         * building it.
         */
        RENDERED_CONTENT("Everything Rendered (Accurate)"),

        /**
         * Just the content the query asked for, before the rest of the query runs, so a 304 skips running it, but a
         * change to related content alone goes unnoticed.
         */
        REQUESTED_CONTENT("Requested Content Only (Fast)");

        private final String label;

        ConditionalRequestCheck(String label) {
            this.label = label;
        }

        /**
         * Returns the label shown in the CMS.
         */
        @Override
        public String toString() {
            return label;
        }
    }
}
