package com.brightspot.example.model;

import java.util.Collection;

import com.brightspot.example.cache.CachePurgeable;
import com.psddev.cms.db.Content;
import com.psddev.cms.db.Directory;
import com.psddev.cms.db.Site;
import com.psddev.dari.db.Query;
import com.psddev.dari.db.Recordable;
import com.psddev.dari.util.DariUtils;
import org.apache.commons.lang3.StringUtils;

/**
 * Article author, with a page at {@code /people/<name>} listing their latest articles.
 */
public class Author extends Content implements Directory.Item, CachePurgeable {

    @Indexed(unique = true)
    @Required
    private String name;

    /**
     * Returns the author's name.
     */
    public String getName() {
        return name;
    }

    /**
     * Sets the author's name.
     */
    public void setName(String name) {
        this.name = name;
    }

    /**
     * Returns {@code /people/<name>}, normalized.
     *
     * @param site Site the permalink is for, which doesn't change the path.
     * @return Permalink path, or {@code null} when the name is blank.
     */
    @Override
    public String createPermalink(Site site) {
        String normalizedHeadline = DariUtils.toNormalized(name);

        if (StringUtils.isBlank(normalizedHeadline)) {
            return null;
        }

        return "/people/" + normalizedHeadline;
    }

    /**
     * Returns the author's articles, since article pages show the author's name.
     */
    @Override
    public Collection<? extends Recordable> getRelatedContentToPurge() {
        return Query.from(Article.class).where("author = ?", this).selectAll();
    }
}
