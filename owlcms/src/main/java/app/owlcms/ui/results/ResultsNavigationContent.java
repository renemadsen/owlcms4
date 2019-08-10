/***
 * Copyright (c) 2009-2019 Jean-François Lamy
 * 
 * Licensed under the Non-Profit Open Software License version 3.0  ("Non-Profit OSL" 3.0)  
 * License text at https://github.com/jflamy/owlcms4/blob/master/LICENSE.txt
 */
package app.owlcms.ui.results;

import org.slf4j.LoggerFactory;

import com.github.appreciated.layout.FlexibleGridLayout;
import com.vaadin.flow.component.UI;
import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.component.html.Div;
import com.vaadin.flow.component.orderedlayout.HorizontalLayout;
import com.vaadin.flow.router.HasDynamicTitle;
import com.vaadin.flow.router.Route;

import app.owlcms.components.NavigationPage;
import app.owlcms.spreadsheet.JXLSTimingStats;
import app.owlcms.ui.home.HomeNavigationContent;
import app.owlcms.ui.shared.BaseNavigationContent;
import app.owlcms.ui.shared.DownloadButtonFactory;
import app.owlcms.ui.shared.OwlcmsRouterLayout;
import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;

/**
 * The Class ResultsNavigationContent.
 */
@SuppressWarnings("serial")
@Route(value = "results", layout = OwlcmsRouterLayout.class)
public class ResultsNavigationContent extends BaseNavigationContent implements NavigationPage, HasDynamicTitle {
	
	final private static Logger logger = (Logger)LoggerFactory.getLogger(ResultsNavigationContent.class);
	static { logger.setLevel(Level.INFO);}

	/**
	 * Instantiates a new wrapup navigation content.
	 */
	public ResultsNavigationContent() {
		Button groupResults = new Button(getTranslation("GroupResults"),
			buttonClickEvent -> UI.getCurrent().navigate(ResultsContent.class));
		
        Button finalPackage = new Button(getTranslation("FinalResultsPackage"),
                buttonClickEvent -> UI.getCurrent().navigate(PackageContent.class));
		
        Div timingStats = DownloadButtonFactory.createDynamicDownloadButton(
                "timingStats",
                getTranslation("TimingStatistics"),
                new JXLSTimingStats());
		
		finalPackage.setEnabled(true);
		timingStats.setEnabled(true);
		FlexibleGridLayout grid1 = HomeNavigationContent.navigationGrid(
			groupResults
			);
		FlexibleGridLayout grid2 = HomeNavigationContent.navigationGrid(
			finalPackage,
			timingStats
			);
		
		doGroup(getTranslation("ForEachCompetitionGroup"), grid1, this);
		doGroup(getTranslation("EndOfCompetitionDocuments"), grid2, this);
    }


	
	@Override
	protected String getTitle() {
		return getTranslation("ResultDocuments");
	}
	
	@Override
	protected HorizontalLayout createTopBarFopField(String label, String placeHolder) {
		return null;
	}
	
	@Override
	protected HorizontalLayout createTopBarGroupField(String label, String placeHolder) {
		return null;
	}

	@Override
	public String getPageTitle() {
		return getTranslation("OWLCMS_Results");
	}
	
}
