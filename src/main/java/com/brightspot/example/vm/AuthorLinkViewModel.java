package com.brightspot.example.vm;

import com.brightspot.example.model.Author;
import com.psddev.cms.view.ViewInterface;

/**
 * Link to an author's page.
 */
@ViewInterface
public class AuthorLinkViewModel extends AbstractViewModel<Author> {

    /**
     * Returns the author's name.
     */
    public String getName() {
        return model.getName();
    }

    /**
     * Returns the path of the author's page.
     */
    public String getPath() {
        return Permalinks.path(model);
    }
}
