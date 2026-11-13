package com.brightspot.example.vm;

import com.brightspot.example.model.Article;
import com.brightspot.example.model.Section;
import com.psddev.cms.db.Content;
import com.psddev.cms.view.ViewInterface;
import com.psddev.dari.db.Query;

/**
 * Section page.
 */
@ViewInterface
public class SectionViewModel extends AbstractViewModel<Section> {

    /**
     * Returns the section's name.
     */
    public String getName() {
        return model.getName();
    }

    /**
     * Returns the section's 5 most recently updated articles.
     */
    public Iterable<? extends ArticlePromoViewModel> getArticles() {

        Query<Article> recentArticlesQuery = Query.from(Article.class)
            .where("section = ?", model)
            .sortDescending(Content.UPDATE_DATE_FIELD);

        return createViews(ArticlePromoViewModel.class, recentArticlesQuery.select(0, 5).getItems());
    }
}
