vcl 4.1;

# Stands in for Cloudflare in the demo: caches GraphQL API responses per the origin's Cache-Control and purges them
# by the origin's Cache-Tag header.

import std;

# Tomcat directly: Apache's own cache would keep serving API responses after a purge here.
backend default {
    .host = "tomcat";
    .port = "8080";
}

acl purgers {
    "localhost";
    "10.0.0.0"/8;
    "172.16.0.0"/12;
    "192.168.0.0"/16;
}

sub vcl_recv {
    # Stand-in for Cloudflare's purge-by-tag API: POST /.cdn/purge with a comma-separated X-Purge-Tags header.
    if (req.url == "/.cdn/purge") {
        if (req.method != "POST" || client.ip !~ purgers) {
            return (synth(403));
        }

        if (!req.http.X-Purge-Tags) {
            return (synth(400, "Missing X-Purge-Tags"));
        }

        if (std.ban("obj.http.Cache-Tag ~ (?i)(^|,)(" + regsuball(req.http.X-Purge-Tags, ",", "|") + ")(,|$)")) {
            return (synth(200, "Purged"));
        }

        return (synth(400, std.ban_error()));
    }

    # Like a Cloudflare Cache Rule scoped to the API. Everything else, including the CMS, bypasses the cache.
    if (req.url !~ "^/delivery/graphql") {
        return (pass);
    }

    # A CMS login cookie on the same host would otherwise make Varnish skip the cache.
    unset req.http.Cookie;
}

sub vcl_backend_response {
    # Otherwise Varnish serves expired responses for another 10 seconds (its default_grace) even when Cache-Control
    # has no stale-while-revalidate.
    if (beresp.http.Cache-Control !~ "stale-while-revalidate") {
        set beresp.grace = 0s;
    }

    # Keeps expired responses that have an ETag, so Varnish can revalidate them with If-None-Match.
    if (beresp.http.ETag) {
        set beresp.keep = 1d;
    }
}

# An expired response still within its stale-while-revalidate window is served while Varnish revalidates it in the
# background.
sub vcl_hit {
    if (obj.ttl < 0s) {
        set req.http.X-Cache-Stale = "true";
    }
}

# The same path can resolve to different content per site, so the site is part of the cache key alongside the URL.
sub vcl_hash {
    hash_data(req.http.X-Site);
}

sub vcl_deliver {
    if (obj.hits > 0 && req.http.X-Cache-Stale) {
        set resp.http.X-Cache = "STALE";

    } else if (obj.hits > 0) {
        set resp.http.X-Cache = "HIT";

    } else {
        set resp.http.X-Cache = "MISS";
    }
}
