package app.owlcms.nui.displays.scoreboards;

import java.util.Map;

import org.slf4j.LoggerFactory;

import com.vaadin.flow.router.QueryParameters;
import com.vaadin.flow.router.Route;

import app.owlcms.apputils.queryparameters.ContentParameters;
import app.owlcms.apputils.queryparameters.DisplayParameters;
import app.owlcms.data.config.Config;
import app.owlcms.displays.scoreboard.ResultsNoLeaders;
import app.owlcms.init.OwlcmsSession;
import ch.qos.logback.classic.Logger;

@SuppressWarnings("serial")
@Route("displays/results")

public class ResultsNoLeadersPage extends ResultsBoardPage {

	Logger logger = (Logger) LoggerFactory.getLogger(ResultsNoLeadersPage.class);

	public ResultsNoLeadersPage() {
		var board = new ResultsNoLeaders(this);
		this.setBoard(board);
		board.setLeadersDisplay(false);
		board.setRecordsDisplay(false);
		this.addComponent(board);
		
		// when navigating to the page, Vaadin will call setParameter+readParameters
		// these parameters will be applied.
		setDefaultParameters(QueryParameters.simple(Map.of(
		        ContentParameters.SILENT, "true",
		        ContentParameters.DOWNSILENT, "true",
		        DisplayParameters.DARK, "true",
		        DisplayParameters.LEADERS, "false",
		        DisplayParameters.RECORDS, "false",
		        DisplayParameters.VIDEO, "false",
		        DisplayParameters.PUBLIC, "false",
		        DisplayParameters.SINGLEREF, "false",
		        DisplayParameters.ABBREVIATED,
		        Boolean.toString(Config.getCurrent().featureSwitch("shortScoreboardNames")))));
	}

	@Override
	public String getPageTitle() {
		return getTranslation("Scoreboard") + OwlcmsSession.getFopNameIfMultiple();
	}
}
