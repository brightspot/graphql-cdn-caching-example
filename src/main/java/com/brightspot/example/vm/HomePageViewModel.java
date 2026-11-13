package com.brightspot.example.vm;

import com.brightspot.example.model.Article;
import com.brightspot.example.model.HomePage;
import com.psddev.cms.db.Content;
import com.psddev.cms.view.ViewInterface;
import com.psddev.dari.db.Query;

/**
 * Home page.
 */
@ViewInterface
public class HomePageViewModel extends AbstractViewModel<HomePage> {

    /**
     * Returns the home page's name.
     */
    public String getName() {
        return model.getName();
    }

    /**
     * Returns the 5 most recently updated articles.
     */
    public Iterable<? extends ArticlePromoViewModel> getArticles() {

        Query<Article> recentArticlesQuery = Query.from(Article.class)
            .sortDescending(Content.UPDATE_DATE_FIELD);

        return createViews(ArticlePromoViewModel.class, recentArticlesQuery.select(0, 5).getItems());
    }
}
