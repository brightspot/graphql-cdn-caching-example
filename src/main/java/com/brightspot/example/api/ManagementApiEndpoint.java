package com.brightspot.example.api;

import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import com.brightspot.example.model.Article;
import com.brightspot.example.model.Author;
import com.brightspot.example.model.HomePage;
import com.brightspot.example.model.Section;
import com.psddev.dari.db.Singleton;
import com.psddev.graphql.cma.ContentManagementApiEndpoint;
import com.psddev.graphql.cma.ContentManagementEntryPointField;

/**
 * GraphQL Content Management API endpoint that reads and writes the site's content.
 *
 * <p>Unlike the delivery endpoint, every request needs an API client with access to this endpoint, since
 * {@code getApiAccessOption()} is final here. The seed script uses the client that
 * {@link com.brightspot.example.bootstrap.DemoBootstrapFilter} creates.</p>
 */
public class ManagementApiEndpoint extends ContentManagementApiEndpoint implements Singleton {

    /**
     * Returns {@code /management/graphql}.
     */
    @Override
    public Set<String> getPaths() {
        Set<String> paths = new LinkedHashSet<>();
        paths.add("/management/graphql");
        return paths;
    }

    /**
     * Returns home pages, sections, authors and articles, each of which can be queried and saved.
     */
    @Override
    public List<ContentManagementEntryPointField> getEntryFields() {
        return Arrays.asList(
            new ContentManagementEntryPointField(HomePage.class, true),
            new ContentManagementEntryPointField(Section.class, true),
            new ContentManagementEntryPointField(Author.class, true),
            new ContentManagementEntryPointField(Article.class, true)
        );
    }
}
