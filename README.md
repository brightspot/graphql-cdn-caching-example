# Fresh Enough: Caching Brightspot GraphQL on a CDN

Example News is a headless Brightspot site with a React front end. It shows how to cache its GraphQL responses on a
CDN, and how to keep them fresh when content changes. Varnish stands in for a CDN such as Cloudflare, Amazon
CloudFront or Akamai, and each part of **How it works** ends with what to use on each of them.

Caching starts with **persisted queries**, which turn GraphQL requests into GETs carrying a short hash of the query,
so a CDN can cache them like any other URL.

There are two levers for keeping the cache fresh, one at save time and one at request time, and Brightspot has a hook
for each:

- **Purging by cache tag, at save time.** Each response is tagged with the IDs of the content it shows, and saving
  content purges exactly the responses tagged with it. Changes show up within seconds, so responses can be cached for a
  long time.
- **Conditional requests, at request time.** Each response carries an `ETag`. Once its TTL runs out, the CDN asks
  Brightspot whether it changed, and gets a `304 Not Modified` with no body if it didn't. `stale-while-revalidate`
  means visitors don't wait on that check. There's nothing to wire up on save, but a change can take up to a TTL to
  show.

They also work well together: purging for immediate changes, and conditional requests so the refresh after each TTL
never keeps a visitor waiting.

How you pull each lever depends on your content and how it's accessed:

- Purging runs in the data model when content is saved, but what each response shows is decided in the view models
  when it's rendered. So the model can only purge the responses it expects a change to affect, and for some content
  that can never be complete.
- A check at request time can cover everything a response actually rendered, which means running the query again, or
  only the content the request asked for, which skips the rest of the query but can miss changes to related content.

Only checking everything a response rendered is perfectly accurate, and it's also the most expensive, so it's all a
balancing act.

Not every word on a page has to be fresh the moment it changes. What matters is getting readers the content they care
about as soon as they need it, and only you know your content and your audience well enough to decide what that is. The
demo has a setting for each of these choices, to show where the hooks are and how they change what visitors see. None
of its settings is a recommended configuration.

This tutorial boots everything from scratch, then turns each piece on in turn so you can watch what it does: persisted
queries, then purging, then conditional requests on their own with an accurate check and then a fast one, and finally
purging and the fast check together.

## Prerequisites

- JDK 11 for the Gradle build. `.java-version` pins it, and this project's Gradle 6 doesn't run on newer JDKs.
- Docker.
- Yarn 1.
- Node 23.6 or newer. The seed script runs TypeScript directly.

## 1. Boot the backend

From the repository root, wipe this project's containers and volumes (other projects' volumes aren't touched), build
the war, and start everything:

```sh
docker/down
./gradlew
docker/start
```

The CMS is at http://localhost/cms. Brightspot initializes on its first request, so it can take a minute to respond.

## 2. Seed the content

There's nothing to set up in the CMS first. The seed script creates a home page, sections, authors and articles through
the management API, with permalinks on the `Example News` site. It's safe to rerun.

```sh
cd fe
yarn
yarn seed
```

## 3. Run the front end

Still in `fe/`:

```sh
yarn dev
```

Open http://localhost:5173. The **GraphQL requests** panel on the right lists every request the site makes, newest
first, with its response time and its CDN result from Varnish. Above the list are the current time and how long you've
been on the page, handy for timing reloads against the TTL. On narrow screens the panel sits below the page.

Browse around and reload a few pages. Persisted queries are off, so:

- The first request on each page load is a `GET · hash only`, which Brightspot rejects with
  `PersistedQueryNotSupported`.
- Apollo then sends every query as a `POST · full query`.
- Every request is a `MISS`, because CDNs don't cache POSTs.

## 4. Turn on persisted queries

Open [`DeliveryApiEndpoint`][delivery-endpoint] in the CMS, under **Admin** > **APIs**. Turn on **Enable Persisted
Queries** and save. Reload the front end, since Apollo only checks for persisted query support when the page loads.

[delivery-endpoint]: http://localhost/cms/admin/apis?typeId=8aed56da-e1b6-3e8c-b4f4-34bdca30a3f2

Now each query goes out as a `GET · hash only`:

- The first time Brightspot sees a query's hash, it answers `PersistedQueryNotFound`, and Apollo sends a
  `POST · full query` that registers it.
- The next reload is a `MISS` that stores the response in Varnish.
- From then on, reloads are `HIT`s.

## 5. Change some content

Open an article in the front end, click its **Edit in CMS** link, change the headline, and publish.

Reload the article. Until its cached copy is a minute old, it still shows the old headline and the request is a `HIT`:
Varnish keeps serving what it cached. That 1-minute TTL is the endpoint's **CDN TTL** field, under **TTL**. It's short
so the demo doesn't take all day; in production it would be hours or days.

## 6. Turn on cache purging

On [`DeliveryApiEndpoint`][delivery-endpoint], turn on **Enable Cache Purge** and save. Saving the endpoint clears
everything it served from the CDN, so a reload now shows the headline from step 5.

Change the article's headline again and publish. Wait a few seconds, then reload:

- The article is a `MISS` with the new headline, then a `HIT` again on the next reload.
- The home page, the article's section page and its author's page were purged too, since they list the article.

## 7. Try conditional requests instead

Instead of being told what changed, the CDN can check back with Brightspot itself.

On [`DeliveryApiEndpoint`][delivery-endpoint], turn off **Enable Cache Purge**, turn on **Enable Conditional
Requests**, and save. Saving clears the CDN again, so the new settings apply right away.

Leave **Conditional Request Check** at **Everything Rendered (Accurate)**, which checks all the content a response
shows.

Responses now carry an `ETag` and `stale-while-revalidate`, and their CDN TTL drops to 10 seconds. That's the
endpoint's **Revalidation TTL** field, which replaces the CDN TTL when purging is off, since revalidating is then the
only way content refreshes. Reload an article a few times:

- The first reload is a `MISS`, then reloads are `HIT`s for 10 seconds.
- After that, the next reload is `STALE`: Varnish serves its copy right away and asks Brightspot in the background
  whether it changed. It didn't, so Brightspot answers `304 Not Modified` and the copy is good for another 10 seconds.

Now change the article's headline and publish. Reload until you see `STALE`: that response still has the old headline
while Varnish fetches the new one, and the reload after it shows the new headline.

No purge wiring is needed, but every change is served stale once. And since this check covers everything a response
rendered, Brightspot runs the query again every 10 seconds for each cached response, and a `304` only saves sending the
result.

## 8. Check less, faster

On [`DeliveryApiEndpoint`][delivery-endpoint], set **Conditional Request Check** to **Requested Content Only (Fast)**
and save.

Now each check looks at just the content the query asked for, like the article on an article page, before the rest of
the query runs. If that content hasn't changed, Brightspot answers `304 Not Modified` without running the query at
all.

Change the article's headline and publish, then reload a few pages until they're `STALE`, and once more after that:

- The article shows the new headline, as in step 7, since the article is what its check looks at.
- The home page and the article's section page keep showing the old headline, however long you wait. Their checks
  look only at the home page and the section, which didn't change.

That's the trade-off: each check is cheap, but a change to anything besides the requested content waits until that
content changes or something purges it.

## 9. Use both

On [`DeliveryApiEndpoint`][delivery-endpoint], turn **Enable Cache Purge** back on, keep **Enable Conditional
Requests** on with **Requested Content Only (Fast)**, and save.

Responses go back to the 1-minute TTL, but keep their `ETag` and `stale-while-revalidate`:

- Change the article's headline and publish. A few seconds later, the article, the home page and the section page all
  show the new headline: saving the article purged the responses that list it, so the edit is never served stale.
- Leave a page alone for a minute, then reload. It's `STALE`, served right away while Varnish checks back, and
  Brightspot answers `304 Not Modified` without running the query.

This pairing puts the expensive, accurate work at save time, which happens once per edit, and keeps the checks at
request time, which happen for every cached response every TTL, cheap. It's a strong starting point for a site that's
read far more than it's edited, as long as purging covers the relationships your readers care about. Anything purging
misses stays stale, since every check comes back `304`. Switching back to **Everything Rendered (Accurate)** limits
that to one TTL, at the cost of running the query on every check.

## How it works

The snippets are simplified pseudocode. The real classes add error handling and the endpoint's settings.

### Persisted queries make responses cacheable

The front end sends each query as a GET carrying a hash of the query instead of the query itself, so the CDN can
cache it like any other URL:

```ts
const link = createPersistedQueryLink({ sha256, useGETForHashedQueries: true })
  .concat(new HttpLink({ uri: '/delivery/graphql' }));
```

On your CDN, cache GETs to the GraphQL path:

| CDN | Setup |
| --- | --- |
| Cloudflare | JSON isn't cached by default, so add a Cache Rule for `/delivery/graphql` that makes responses eligible for cache, with Edge TTL and Browser TTL set to respect the origin's `Cache-Control`. |
| CloudFront | Add a cache behavior for `/delivery/graphql` whose cache policy includes all query strings, with a Minimum TTL of 0 so `private, no-cache` responses aren't cached. |
| Akamai | Cache `/delivery/graphql` with the caching behavior set to honor the origin's `Cache-Control`. Akamai's GraphQL Caching can also cache GraphQL POSTs, which makes persisted queries optional there. |

The demo sends the site in an `X-Site` header, which Varnish adds to its cache key. On a real CDN, either add that
header to the cache key, or send the site as Brightspot's `site` query parameter instead, which every CDN already keys
on.

### Responses are tagged with the content they show

Every view model records its model's ID for the current request:

```java
public abstract class AbstractViewModel<M> extends ViewModel<M> {

    @Override
    protected void onCreate(ViewResponse response) {
        CacheTagRequest.current().addContentId(model.getId());
    }
}
```

The delivery endpoint writes those IDs into the response headers:

```java
public class DeliveryApiEndpoint extends ContentDeliveryApiEndpoint {

    @Override
    protected void finalizeResponse(GraphQLApiResponse response, WebResponse webResponse) {
        Set<UUID> ids = CacheTagRequest.current().getContentIds();

        webResponse.setHeader("Cache-Tag", join(",", ids, id -> "c-" + id));
        webResponse.setHeader("Cache-Control", "public, max-age=0, s-maxage=60");
    }
}
```

So an article page comes back tagged with the article, its author and its section:

```http
Cache-Tag: c-<article id>,c-<author id>,c-<section id>
Cache-Control: public, max-age=0, s-maxage=60
```

`s-maxage` lets the CDN cache the response. `max-age=0` keeps browsers from caching it, because a browser's cache
can't be purged.

On your CDN, the tag header and its limits differ:

| CDN | Tag header | Limits |
| --- | --- | --- |
| Cloudflare | `Cache-Tag` | 16 KB of tags per response. Hidden from visitors. |
| CloudFront | Whichever header you name in the distribution's `CacheTagConfig` | 50 tags per response; extra tags are ignored. Up to 256 characters each. |
| Akamai | `Edge-Cache-Tag` | 128 tags per response, up to 128 characters each, within an 8 KB header. No colons, and case-sensitive. Hidden from visitors by default. |

The demo's `c-<id>` tags work on all three. Its 16 KB cap on the tag header is Cloudflare's, so match it to your CDN.

### Saving content purges its tags

After content is saved, its tag and the tags of the pages that list it go to the CDN's purge API:

```java
public class CachePurgeModification extends Modification<CachePurgeable> {

    @Override
    protected void afterSave() {
        List<String> tags = new ArrayList<>();
        tags.add("c-" + getId());

        for (Recordable related : getOriginalObject().getRelatedContentToPurge()) {
            tags.add("c-" + related.getId());
        }

        // A few seconds later, once the search index has caught up.
        cdn.purgeTags(tags);
    }
}
```

```java
public class Article extends Content implements CachePurgeable {

    // These pages list recent articles, so saving an article changes them too.
    @Override
    public Collection<Recordable> getRelatedContentToPurge() {
        return Arrays.asList(homePage, section, author);
    }
}
```

`getRelatedContentToPurge()` lives on the model, which doesn't know how the view models render each response. The home
page shows the 5 most recently updated articles, but a saved article can't tell whether it's among them, so it purges
every home page to be safe. A response it doesn't think of, like one a new view model adds later, is never purged. Save
time is where purging is fast and immediate, not where it's guaranteed complete.

The CDN then drops every cached response carrying one of those tags. Here, Varnish does it with a ban:

```vcl
std.ban("obj.http.Cache-Tag ~ (^|,)(" + tags + ")(,|$)");
```

Every response also carries an `ep-<endpoint id>` tag, and saving the delivery endpoint purges it, since its settings
change how every response is cached.

On your CDN, send the tags to its purge API:

| CDN | Purge by tag |
| --- | --- |
| Cloudflare | `POST /zones/{zone_id}/purge_cache` with `{"tags": [...]}`, up to 100 tags per request, on every plan. |
| CloudFront | `CreateInvalidation` with each tag as a path starting with `#`, like `#c-<id>`. Each tag counts toward the invalidation limits like a path does. |
| Akamai | Fast Purge's `POST /ccu/v3/invalidate/tag/{network}`. Tag purges are rate-limited to bursts of 5,000 tags, refilling at 500 a minute. |

### Conditional requests let the CDN check back

When conditional requests are on, the delivery endpoint adds `stale-while-revalidate` to the TTL, and the
[conditional request plugin](https://github.com/perfectsense/brightspot/tree/release/4.8/fe/conditional-request) sets
the `ETag` or answers `304 Not Modified`. What it checks is up to you, and the demo has two checks to choose from: an
accurate one after the query runs, and a fast one before.

**Everything Rendered (Accurate)** runs in the rest of the endpoint's `finalizeResponse`, once the query has rendered
everything:

```java
public class DeliveryApiEndpoint extends ContentDeliveryApiEndpoint {

    @Override
    protected void finalizeResponse(GraphQLApiResponse response, WebResponse webResponse) {
        // ...the Cache-Tag header from above, then:

        if (enableConditionalRequests) {
            // A minute when purging keeps content fresh; 10 seconds when revalidating is all there is.
            int ttl = enableCachePurge ? 60 : 10;

            webResponse.setHeader("Cache-Control", "public, max-age=0, s-maxage=" + ttl + ", stale-while-revalidate=86400");

            // No main object, since one GraphQL request can look up several pieces of content.
            ConditionalRequest.newBuilder(null)
                .addValidator(new RenderedContentValidator(CacheTagRequest.current().getContentIds()))
                .responseHandler(new WebConditionalResponseHandler(webResponse))
                .build()
                .process();
        }
    }
}
```

The plugin's default validator only looks at a page's main content. `RenderedContentValidator` applies it to every
piece of content the response rendered, the same IDs that become cache tags, so a change to an article's author or to
the articles in a section's list changes the `ETag` too:

```java
public class RenderedContentValidator implements ConditionalRequestValidator {

    @Override
    public String getETag() {
        return renderedContent.stream()
            .map(content -> new DefaultConditionalRequestValidator(content).getETag())
            .collect(joining("."));
    }
}
```

Because the validator needs to know what the response rendered, every check runs the query again, and a `304` saves
sending the response but not building it.

**Requested Content Only (Fast)** runs in the view model's `onCreate`, as soon as the query's entry point is looked up
and before any of its other fields resolve. It's the plugin's
[ViewModel example](https://github.com/perfectsense/brightspot/tree/release/4.8/fe/conditional-request#viewmodel-example):
if the content hasn't changed, throwing the `ViewResponse` stops the query there.

```java
public abstract class AbstractViewModel<M> extends ViewModel<M> {

    @Override
    protected void onCreate(ViewResponse response) {
        // ...record the ID for cache tags, then, for the content the query asked for:
        ConditionalResponse result = ConditionalRequest.newBuilder(model)
            .addValidator(new DefaultConditionalRequestValidator(model))
            .responseHandler(new ViewConditionalResponseHandler(response))
            .build()
            .process();

        // The handler has already set the 304 status; throwing stops the query before its other fields resolve.
        if (result.isNotModified()) {
            throw response;
        }
    }
}
```

In 4.8, the delivery API copies a thrown `ViewResponse`'s headers to the HTTP response, but not its status, so the
endpoint's `finalizeResponse` sends the `304` itself. It leaves `Cache-Tag` off that `304`: a CDN replaces the cached
response's headers with the ones a `304` sends, and the query stopped before rendering the related content, so its tags
would be incomplete.

The fast check skips the query, but a change to anything besides the requested content, like an article's author or
the articles in a list, goes unnoticed until the requested content changes or something purges it. That can be the
right trade-off when you know how your content is fetched, say a mobile app that only ever looks up articles by ID or
path, and which parts of it your readers need fresh. Which check is right depends on your content, your readers and
how they get to it.

On your CDN, stale serving and revalidation work differently:

| CDN | Support |
| --- | --- |
| Cloudflare | Serves stale content while it revalidates in the background (`cf-cache-status: UPDATING`), sending the stored `ETag`. But `s-maxage` turns stale serving off, so Cloudflare's docs suggest sending `max-age` with `stale-while-revalidate` and setting Cloudflare's own TTL in a Cache Rule. Note that `max-age` also reaches browsers. |
| CloudFront | Honors `s-maxage` and `stale-while-revalidate`, capped at the cache policy's Maximum TTL, and revalidates with `If-None-Match`. It skips conditional requests when it forwards cookies. |
| Akamai | Doesn't document `stale-while-revalidate`. Its Cache Prefreshing refreshes objects in the background near the end of their TTL, at 90% by default. Its docs describe that as an `If-Modified-Since` request, so check how it handles a response with only an `ETag`, like the demo's accurate check sends. |

## CDN docs

- Cloudflare: [purging by cache tag](https://developers.cloudflare.com/cache/how-to/purge-cache/purge-by-tags/),
  [revalidation and stale-while-revalidate](https://developers.cloudflare.com/cache/concepts/revalidation/),
  [Cache Rules](https://developers.cloudflare.com/cache/how-to/cache-rules/settings/)
- CloudFront: [invalidating by cache tag](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/invalidation-by-tags.html),
  [expiration and stale-while-revalidate](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Expiration.html),
  [conditional requests to the origin](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/RequestAndResponseBehaviorCustomOrigin.html)
- Akamai: [cache tags](https://techdocs.akamai.com/purge-cache/docs/assign-cache-tags),
  [purging by cache tag](https://techdocs.akamai.com/purge-cache/docs/purge-content-cache-tag),
  [Cache Prefreshing](https://techdocs.akamai.com/property-mgr/reference/latest-prefresh-cache),
  [GraphQL Caching](https://techdocs.akamai.com/property-mgr/docs/graphql-caching)
