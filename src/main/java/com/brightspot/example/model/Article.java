package com.brightspot.example.model;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import com.brightspot.example.cache.CachePurgeable;
import com.psddev.cms.db.Content;
import com.psddev.cms.db.Directory;
import com.psddev.cms.db.Site;
import com.psddev.dari.db.Query;
import com.psddev.dari.db.Recordable;
import com.psddev.dari.util.DariUtils;
import org.apache.commons.lang3.StringUtils;

/**
 * News article, at a path under its section, like {@code /business/central-bank-holds-rates-steady}.
 */
public class Article extends Content implements Directory.Item, CachePurgeable {

    @Required
    @Indexed
    private String headline;

    @Indexed
    private Author author;

    @Indexed
    private Section section;

    private String body;

    /**
     * Returns the headline.
     */
    public String getHeadline() {
        return headline;
    }

    /**
     * Sets the headline.
     */
    public void setHeadline(String headline) {
        this.headline = headline;
    }

    /**
     * Returns the author.
     */
    public Author getAuthor() {
        return author;
    }

    /**
     * Sets the author.
     */
    public void setAuthor(Author author) {
        this.author = author;
    }

    /**
     * Returns the section the article is filed under.
     */
    public Section getSection() {
        return section;
    }

    /**
     * Sets the section the article is filed under.
     */
    public void setSection(Section section) {
        this.section = section;
    }

    /**
     * Returns the body.
     */
    public String getBody() {
        return body;
    }

    /**
     * Sets the body.
     */
    public void setBody(String body) {
        this.body = body;
    }

    /**
     * Returns {@code /<section>/<headline>}, normalized, or {@code /articles/<headline>} without a section.
     *
     * @param site Site the permalink is for, which doesn't change the path.
     * @return Permalink path, or {@code null} when the headline is blank.
     */
    @Override
    public String createPermalink(Site site) {
        String normalizedHeadline = DariUtils.toNormalized(headline);

        if (StringUtils.isBlank(normalizedHeadline)) {
            return null;
        }

        String pathPrefix = Optional.ofNullable(getSection())
            .map(Section::getPathPrefix)
            .orElse("articles");

        return "/" + pathPrefix + "/" + normalizedHeadline;
    }

    /**
     * Returns the home pages, and the article's section and author.
     *
     * <p>Their pages list the most recently updated articles, so any article save can change them.</p>
     */
    @Override
    public Collection<? extends Recordable> getRelatedContentToPurge() {
        List<Recordable> related = new ArrayList<>(Query.from(HomePage.class).selectAll());

        if (section != null) {
            related.add(section);
        }

        if (author != null) {
            related.add(author);
        }

        return related;
    }
}
