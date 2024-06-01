/*******************************************************************************
 * Copyright (c) 2009-2023 Jean-François Lamy
 *
 * Licensed under the Non-Profit Open Software License version 3.0  ("NPOSL-3.0")
 * License text at https://opensource.org/licenses/NPOSL-3.0
 *******************************************************************************/
package app.owlcms.nui.results;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.LoggerFactory;

import com.github.appreciated.layout.FlexibleGridLayout;
import com.vaadin.flow.component.UI;
import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.component.button.ButtonVariant;
import com.vaadin.flow.component.html.Div;
import com.vaadin.flow.component.orderedlayout.HorizontalLayout;
import com.vaadin.flow.router.HasDynamicTitle;
import com.vaadin.flow.router.Route;

import app.owlcms.apputils.DebugUtils;
import app.owlcms.components.JXLSDownloader;
import app.owlcms.i18n.Translator;
import app.owlcms.nui.home.HomeNavigationContent;
import app.owlcms.nui.preparation.TeamSelectionContent;
import app.owlcms.nui.shared.BaseNavigationContent;
import app.owlcms.nui.shared.NavigationPage;
import app.owlcms.nui.shared.OwlcmsLayout;
import app.owlcms.spreadsheet.JXLSExportRecords;
import app.owlcms.spreadsheet.JXLSTimingStats;
import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;

/**
 * The Class ResultsNavigationContent.
 */
@SuppressWarnings("serial")
@Route(value = "results", layout = OwlcmsLayout.class)
public class ResultsNavigationContent extends BaseNavigationContent implements NavigationPage, HasDynamicTitle {

	final private static Logger logger = (Logger) LoggerFactory.getLogger(ResultsNavigationContent.class);
	static {
		logger.setLevel(Level.INFO);
	}
	Map<String, List<String>> urlParameterMap = new HashMap<>();

	/**
	 * Instantiates a new wrapup navigation content.
	 */
	public ResultsNavigationContent() {
		Button groupResults = openInNewTab(ResultsContent.class, getTranslation("GroupResults"));
		highlight(groupResults);
		// Button medals = openInNewTab(ResultsContent.class,
		// getTranslation("Results.Medals"));
		Button teamResults = openInNewTabNoParam(TeamResultsContent.class, getTranslation("TeamResults.Title"));
		Button teams = openInNewTabNoParam(TeamSelectionContent.class, getTranslation(TeamSelectionContent.TITLE));
		// Button categoryResults = openInNewTabNoParam(PackageContent.class,
		// getTranslation("CategoryResults"));
		Button finalPackage = openInNewTabNoParam(PackageContent.class, getTranslation("CompetitionResults"));
		highlight(finalPackage);

		// Div timingStats = DownloadButtonFactory.createDynamicXLSDownloadButton("timingStats",
		// getTranslation("TimingStatistics"), new JXLSTimingStats(UI.getCurrent()));
		// ((Button) timingStats.getComponentAt(0)).setWidth("100%");

		var timingWriter = new JXLSTimingStats(UI.getCurrent());
		JXLSDownloader dd1 = new JXLSDownloader(
		        () -> {
			        return timingWriter;
		        },
		        "/templates/timing",
		        // template name used only to generate the results file name. Localized template determined by
		        // JXLSTimingStats
		        "TimingStats.xlsx",
		        Translator.translate("TimingStatistics"),
		        fileName -> fileName.endsWith(".xlsx"));
		Div timingStats = new Div();
		timingStats.add(dd1.createImmediateDownloadButton());
		timingStats.setWidthFull();

		// Div newRecords = DownloadButtonFactory.createDynamicXLSDownloadButton("records",
		// getTranslation("Results.NewRecords"), new JXLSExportRecords(UI.getCurrent(),false));
		// ((Button) newRecords.getComponentAt(0)).setWidth("100%");

		var recordsWriter = new JXLSExportRecords(UI.getCurrent(), false);
		JXLSDownloader dd2 = new JXLSDownloader(
		        () -> {
			        return recordsWriter;
		        },
		        "/templates/records",
		        "exportRecords.xlsx",
		        Translator.translate("Results.NewRecords"),
		        fileName -> fileName.endsWith(".xlsx"));
		Div newRecords = new Div();
		newRecords.add(dd2.createImmediateDownloadButton());
		newRecords.setWidthFull();

		FlexibleGridLayout grid1 = HomeNavigationContent.navigationGrid(groupResults);
		FlexibleGridLayout grid2 = HomeNavigationContent.navigationGrid(teamResults, teams);
		FlexibleGridLayout grid3 = HomeNavigationContent.navigationGrid(finalPackage, newRecords,
		        timingStats);

		doGroup(getTranslation("ForEachCompetitionGroup"), grid1, this);
		doGroup(getTranslation("TeamResults.Title"), grid2, this);
		doGroup(getTranslation("Results.EndOfCompetition"), grid3, this);

		DebugUtils.gc();
	}

	@Override
	public String getMenuTitle() {
		return getTranslation("ShortTitle.Results");
	}

	@Override
	public String getPageTitle() {
		return getTranslation("ShortTitle.Results");
	}

	@Override
	protected HorizontalLayout createMenuBarFopField(String label, String placeHolder) {
		return null;
	}

	private void highlight(Button button) {
		button.addThemeVariants(ButtonVariant.LUMO_SUCCESS, ButtonVariant.LUMO_PRIMARY);
	}
}
