package com.brightspot.example.vm;

import com.brightspot.example.api.DeliveryApiEndpoint;
import com.brightspot.example.cache.CacheTagRequest;
import com.psddev.cms.api.ApiEndpoint;
import com.psddev.cms.api.ApiRequest;
import com.psddev.cms.view.ViewModel;
import com.psddev.cms.view.ViewResponse;
import com.psddev.dari.db.Recordable;
import com.psddev.dari.web.WebRequest;

/**
 * Base class for the site's view models.
 *
 * <p>It records the model's ID so GraphQL responses are tagged with every piece of content they render, even when the
 * query doesn't select an ID or looks the content up by path. For the content the query asked for, it also runs the
 * delivery endpoint's fast conditional request check. Subclasses that override {@link #onCreate(ViewResponse)} must
 * call {@code super.onCreate(response)}.</p>
 */
public abstract class AbstractViewModel<M> extends ViewModel<M> {

    /**
     * Records the model's ID in the current request's {@link CacheTagRequest}, and stops the query if the delivery
     * endpoint's fast check finds the requested content unchanged.
     *
     * @param response View response, which gets the conditional request headers and status.
     * @throws ViewResponse If the requested content hasn't changed since the CDN cached its response.
     */
    @Override
    protected void onCreate(ViewResponse response) {
        super.onCreate(response);

        if (!(model instanceof Recordable) || !WebRequest.isAvailable()) {
            return;
        }

        Recordable content = (Recordable) model;
        WebRequest request = WebRequest.getCurrent();
        boolean requested = request.as(CacheTagRequest.class).addContentId(content.getState().getId());
        ApiEndpoint endpoint = request.as(ApiRequest.class).getEndpoint();

        // The first view model created is the content the query asked for, before any of its other fields resolve.
        // Throwing the view response stops the query there, and DeliveryApiEndpoint sends the 304.
        if (requested
            && endpoint instanceof DeliveryApiEndpoint
            && ((DeliveryApiEndpoint) endpoint).checkRequestedContent(content, response)) {

            throw response;
        }
    }
}
