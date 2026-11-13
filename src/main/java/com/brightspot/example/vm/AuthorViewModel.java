package com.brightspot.example.vm;

import com.brightspot.example.model.Article;
import com.brightspot.example.model.Author;
import com.psddev.cms.db.Content;
import com.psddev.cms.view.ViewInterface;
import com.psddev.dari.db.Query;

/**
 * Author page.
 */
@ViewInterface
public class AuthorViewModel extends AbstractViewModel<Author> {

    /**
     * Returns the author's name.
     */
    public String getName() {
        return model.getName();
    }

    /**
     * Returns the author's 10 most recently updated articles.
     */
    public Iterable<? extends ArticlePromoViewModel> getArticles() {

        Query<Article> recentArticlesQuery = Query.from(Article.class)
            .where("author = ?", model)
            .sortDescending(Content.UPDATE_DATE_FIELD);

        return createViews(ArticlePromoViewModel.class, recentArticlesQuery.select(0, 10).getItems());
    }
}
