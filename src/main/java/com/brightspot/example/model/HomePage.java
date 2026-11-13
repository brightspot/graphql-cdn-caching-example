package com.brightspot.example.model;

import com.brightspot.example.cache.CachePurgeable;
import com.psddev.cms.db.Content;
import com.psddev.cms.db.Directory;
import com.psddev.cms.db.Site;

/**
 * Site home page, at {@code /}, listing the latest articles.
 */
public class HomePage extends Content implements Directory.Item, CachePurgeable {

    @Required
    private String name;

    /**
     * Returns the home page's name.
     */
    public String getName() {
        return name;
    }

    /**
     * Sets the home page's name.
     */
    public void setName(String name) {
        this.name = name;
    }

    /**
     * Returns {@code /}.
     */
    @Override
    public String createPermalink(Site site) {
        return "/";
    }
}
