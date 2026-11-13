package com.brightspot.example.model;

import com.brightspot.example.cache.CachePurgeable;
import com.psddev.cms.db.Content;
import com.psddev.cms.db.Directory;
import com.psddev.cms.db.Site;
import com.psddev.dari.util.DariUtils;
import org.apache.commons.lang3.StringUtils;

/**
 * Site section, like World or Business, with a page listing its latest articles.
 */
public class Section extends Content implements Directory.Item, CachePurgeable {

    @Required
    @Indexed(unique = true)
    private String name;

    /**
     * Returns the section's name.
     */
    public String getName() {
        return name;
    }

    /**
     * Sets the section's name.
     */
    public void setName(String name) {
        this.name = name;
    }

    // Shared with Article, whose paths start with their section's.
    String getPathPrefix() {
        return DariUtils.toNormalized(name);
    }

    /**
     * Returns {@code /<name>}, normalized.
     *
     * @param site Site the permalink is for, which doesn't change the path.
     * @return Permalink path, or {@code null} when the name is blank.
     */
    @Override
    public String createPermalink(Site site) {
        String pathPrefix = getPathPrefix();

        if (StringUtils.isBlank(pathPrefix)) {
            return null;
        }

        return "/" + pathPrefix;
    }
}
