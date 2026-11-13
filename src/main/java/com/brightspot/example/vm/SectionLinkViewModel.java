package com.brightspot.example.vm;

import com.brightspot.example.model.Section;
import com.psddev.cms.view.ViewInterface;

/**
 * Link to a section's page.
 */
@ViewInterface
public class SectionLinkViewModel extends AbstractViewModel<Section> {

    /**
     * Returns the section's name.
     */
    public String getName() {
        return model.getName();
    }

    /**
     * Returns the path of the section's page.
     */
    public String getPath() {
        return Permalinks.path(model);
    }
}
