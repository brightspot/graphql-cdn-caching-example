package com.brightspot.example.vm;

import com.brightspot.example.model.Article;
import com.psddev.cms.view.ViewInterface;

/**
 * Article teaser in a list, linking to the article.
 */
@ViewInterface
public class ArticlePromoViewModel extends AbstractViewModel<Article> {

    /**
     * Returns the article's headline.
     */
    public String getHeadline() {
        return model.getHeadline();
    }

    /**
     * Returns the article's path.
     */
    public String getPath() {
        return Permalinks.path(model);
    }

    /**
     * Returns a link to the article's author, or {@code null} if it has none.
     */
    public AuthorLinkViewModel getAuthor() {
        return createView(AuthorLinkViewModel.class, model.getAuthor());
    }

    /**
     * Returns a link to the article's section, or {@code null} if it has none.
     */
    public SectionLinkViewModel getSection() {
        return createView(SectionLinkViewModel.class, model.getSection());
    }
}
