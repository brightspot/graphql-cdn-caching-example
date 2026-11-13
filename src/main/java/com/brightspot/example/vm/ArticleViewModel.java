package com.brightspot.example.vm;

import com.brightspot.example.model.Article;
import com.psddev.cms.view.ViewInterface;

/**
 * Article page.
 */
@ViewInterface
public class ArticleViewModel extends AbstractViewModel<Article> {

    /**
     * Returns the article's headline.
     */
    public String getHeadline() {
        return model.getHeadline();
    }

    /**
     * Returns a link to the article's author, or {@code null} if it has none.
     */
    public AuthorLinkViewModel getAuthor() {
        return createView(AuthorLinkViewModel.class, model.getAuthor());
    }

    /**
     * Returns the article's body.
     */
    public String getBody() {
        return model.getBody();
    }

    /**
     * Returns a link to the article's section, or {@code null} if it has none.
     */
    public SectionLinkViewModel getSection() {
        return createView(SectionLinkViewModel.class, model.getSection());
    }
}
