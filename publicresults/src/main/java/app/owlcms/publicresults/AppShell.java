package app.owlcms.publicresults;

import com.vaadin.flow.component.page.AppShellConfigurator;
import com.vaadin.flow.component.page.Push;
import com.vaadin.flow.server.AppShellSettings;
import com.vaadin.flow.theme.Theme;
import com.vaadin.flow.theme.lumo.Lumo;

/**
 * Use the @PWA annotation make the application installable on phones, tablets
 * and some desktop browsers.
 */
//@PWA(name = "owlcms remote scoreboard", shortName = "publicresults")
@Theme(variant = Lumo.DARK)
@Push
public class AppShell implements AppShellConfigurator {

    @Override
    public void configurePage(AppShellSettings settings) {
        settings.addLink("shortcut icon", "icons/owlcms.ico");
        settings.addFavIcon("icon", "icons/owlcms.png", "96x96");
    }
}
