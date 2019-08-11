/***
 * Copyright (c) 2009-2019 Jean-François Lamy
 * 
 * Licensed under the Non-Profit Open Software License version 3.0  ("Non-Profit OSL" 3.0)  
 * License text at https://github.com/jflamy/owlcms4/blob/master/LICENSE.txt
 */

package app.owlcms.ui.results;

import java.io.IOException;
import java.util.Arrays;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.LoggerFactory;
import org.vaadin.crudui.crud.impl.GridCrud;

import com.vaadin.flow.component.AttachEvent;
import com.vaadin.flow.component.HasElement;
import com.vaadin.flow.component.UI;
import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.component.combobox.ComboBox;
import com.vaadin.flow.component.grid.Grid;
import com.vaadin.flow.component.html.Anchor;
import com.vaadin.flow.component.html.H3;
import com.vaadin.flow.component.icon.Icon;
import com.vaadin.flow.component.icon.VaadinIcon;
import com.vaadin.flow.component.notification.Notification;
import com.vaadin.flow.component.notification.Notification.Position;
import com.vaadin.flow.component.orderedlayout.FlexComponent;
import com.vaadin.flow.component.orderedlayout.HorizontalLayout;
import com.vaadin.flow.dom.ThemeList;
import com.vaadin.flow.router.BeforeEvent;
import com.vaadin.flow.router.HasDynamicTitle;
import com.vaadin.flow.router.Location;
import com.vaadin.flow.router.OptionalParameter;
import com.vaadin.flow.router.QueryParameters;
import com.vaadin.flow.router.Route;
import com.vaadin.flow.server.StreamResource;

import app.owlcms.data.athlete.Athlete;
import app.owlcms.data.athlete.AthleteRepository;
import app.owlcms.data.athleteSort.AthleteSorter;
import app.owlcms.data.athleteSort.AthleteSorter.Ranking;
import app.owlcms.data.competition.Competition;
import app.owlcms.data.competition.CompetitionRepository;
import app.owlcms.data.group.Group;
import app.owlcms.data.group.GroupRepository;
import app.owlcms.fieldofplay.FieldOfPlay;
import app.owlcms.init.OwlcmsFactory;
import app.owlcms.spreadsheet.JXLSResultSheet;
import app.owlcms.ui.crudui.OwlcmsCrudFormFactory;
import app.owlcms.ui.crudui.OwlcmsGridLayout;
import app.owlcms.ui.shared.AthleteCrudGrid;
import app.owlcms.ui.shared.AthleteGridContent;
import app.owlcms.ui.shared.AthleteGridLayout;
import app.owlcms.utils.ResourceWalker;
import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;

/**
 * Class ResultsContent.
 * 
 * @author Jean-François Lamy
 */
@SuppressWarnings("serial")
@Route(value = "results/results", layout = AthleteGridLayout.class)
public class ResultsContent extends AthleteGridContent implements HasDynamicTitle {

    final private static Logger logger = (Logger) LoggerFactory.getLogger(ResultsContent.class);
    final private static Logger jexlLogger = (Logger) LoggerFactory.getLogger("org.apache.commons.jexl2.JexlEngine");
    static {
        logger.setLevel(Level.INFO);
        jexlLogger.setLevel(Level.ERROR);
    }

    private Button download;
    private Anchor groupResults;
    private Group currentGroup;
    private JXLSResultSheet xlsWriter;
    private ComboBox<Resource> templateSelect;

    /**
     * Instantiates a new announcer content. Does nothing. Content is created in
     * {@link #setParameter(BeforeEvent, String)} after URL parameters are parsed.
     */
    public ResultsContent() {
        super();
        defineFilters(crudGrid);
        setTopBarTitle(getTranslation("GroupResults"));
    }

    /**
     * We do not connect to the event bus, and we do not track a field of play
     * (non-Javadoc)
     * 
     * @see com.vaadin.flow.component.Component#onAttach(com.vaadin.flow.component.AttachEvent)
     */
    @Override
    protected void onAttach(AttachEvent attachEvent) {
        createTopBar();
    }

    /**
     * Create the top bar.
     * 
     * Note: the top bar is created before the content.
     * 
     * @see #showRouterLayoutContent(HasElement) for how to content to layout and
     *      vice-versa
     * 
     * @param topBar
     */
    @Override
    protected void createTopBar() {
        // show arrow but close menu
        getAppLayout().setMenuVisible(true);
        getAppLayout().closeDrawer();

        topBar = getAppLayout().getAppBarElementWrapper();

        H3 title = new H3();
        title.setText(getTranslation("GroupResults"));
        title.add();
        title.getStyle().set("margin", "0px 0px 0px 0px")
                .set("font-weight", "normal");

        groupSelect = new ComboBox<Group>();
        groupSelect.setPlaceholder(getTranslation("Group"));
        groupSelect.setItems(GroupRepository.findAll());
        groupSelect.setItemLabelGenerator(Group::getName);
        groupSelect.setValue(null);
        groupSelect.setWidth("8em");
        setGroupSelectionListener();

        xlsWriter = new JXLSResultSheet();
        StreamResource href = new StreamResource("resultSheet.xls", xlsWriter);
        groupResults = new Anchor(href, "");
        groupResults.getStyle().set("margin-left", "1em");
        download = new Button(getTranslation("GroupResults"), new Icon(VaadinIcon.DOWNLOAD_ALT));
        groupResults.add(download);

        templateSelect = new ComboBox<Resource>();
        templateSelect.setPlaceholder(getTranslation("PreDefinedTemplates"));
        List<Resource> resourceList = new ResourceWalker().getResourceList("/templates/protocol",
                ResourceWalker::relativeName);
        templateSelect.setItems(resourceList);
        templateSelect.setValue(null);
        templateSelect.setWidth("15em");
        templateSelect.getStyle().set("margin-left", "1em");
        setTemplateSelectionListener(resourceList);

        HorizontalLayout buttons = new HorizontalLayout(groupResults);
        buttons.setAlignItems(FlexComponent.Alignment.BASELINE);

        topBar.getElement().getStyle().set("flex", "100 1");
        topBar.removeAll();
        topBar.add(title, groupSelect, templateSelect, buttons);
        topBar.setJustifyContentMode(FlexComponent.JustifyContentMode.START);
        topBar.setFlexGrow(0.2, title);
//        topBar.setSpacing(true);
        topBar.setAlignItems(FlexComponent.Alignment.CENTER);
    }

    private void setTemplateSelectionListener(List<Resource> resourceList) {
        try {
            String curTemplateName = Competition.getCurrent().getProtocolFileName();
            Resource found = searchMatch(resourceList, curTemplateName);
            templateSelect.addValueChangeListener((e) -> {
                Competition.getCurrent().setProtocolFileName(e.getValue().getFileName());
                try {
                    Competition.getCurrent().setProtocolTemplate(e.getValue().getByteArray());
                } catch (IOException e1) {
                    throw new RuntimeException(e1);
                }
                CompetitionRepository.save(Competition.getCurrent());
            });
            templateSelect.setValue(found);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }
    
    private Resource searchMatch(List<Resource> resourceList, String curTemplateName) {
        Resource found = null;
        for (Resource curResource : resourceList) {
            String fileName = curResource.getFileName();
            if (fileName.equals(curTemplateName)) {
                found = curResource;
                break;
            }
        }
        return found;
    }


    protected void setGroupSelectionListener() {
        groupSelect.setValue(getGridGroup());
        groupSelect.addValueChangeListener(e -> {
            setGridGroup(e.getValue());
            currentGroup = e.getValue();
            // the name of the resulting file is set as an attribute on the <a href tag that
            // surrounds
            // the download button.
            xlsWriter.setGroup(currentGroup);
            groupResults.getElement().setAttribute("download",
                    "results" + (currentGroup != null ? "_" + currentGroup : "_all") + ".xls");
        });
    }

    /**
     * Gets the crudGrid.
     *
     * @return the crudGrid crudGrid
     *
     * @see app.owlcms.ui.shared.AthleteGridContent#createCrudGrid(app.owlcms.ui.crudui.OwlcmsCrudFormFactory)
     */
    @Override
    public AthleteCrudGrid createCrudGrid(OwlcmsCrudFormFactory<Athlete> crudFormFactory) {
        Grid<Athlete> grid = new Grid<Athlete>(Athlete.class, false);
        ThemeList themes = grid.getThemeNames();
        themes.add("compact");
        themes.add("row-stripes");
        grid.setColumns("lastName", "firstName", "group", "team", "category", "bestSnatch", "snatchRank", "bestCleanJerk",
                "cleanJerkRank", "total", "totalRank");
        grid.getColumnByKey("lastName")
                .setHeader(getTranslation("LastName"));
        grid.getColumnByKey("firstName")
                .setHeader(getTranslation("FirstName"));
        grid.getColumnByKey("team")
                .setHeader(getTranslation("Team"));
        grid.getColumnByKey("group")
            .setHeader(getTranslation("Group"));
        grid.getColumnByKey("category")
                .setHeader(getTranslation("Category"));
        grid.getColumnByKey("bestSnatch")
                .setHeader(getTranslation("Snatch"));
        grid.getColumnByKey("snatchRank")
                .setHeader(getTranslation("SnatchRank"));
        grid.getColumnByKey("bestCleanJerk")
                .setHeader(getTranslation("Clean_and_Jerk"));
        grid.getColumnByKey("cleanJerkRank")
                .setHeader(getTranslation("Clean_and_Jerk_Rank"));
        grid.getColumnByKey("total")
                .setHeader(getTranslation("Total"));
        grid.getColumnByKey("totalRank")
                .setHeader(getTranslation("Rank"));

        OwlcmsGridLayout gridLayout = new OwlcmsGridLayout(Athlete.class);
        AthleteCrudGrid crudGrid = new AthleteCrudGrid(Athlete.class, gridLayout, crudFormFactory, grid) {
            @Override
            protected void initToolbar() {
            }

            @Override
            protected void updateButtons() {
            }

            @Override
            protected void updateButtonClicked() {
                // only edit non-lifting groups
                if (!checkFOP()) {
                    super.updateButtonClicked();
                }
            }
        };

        defineFilters(crudGrid);

        crudGrid.setCrudListener(this);
        crudGrid.setClickRowToUpdate(true);
        crudGrid.getCrudLayout().addToolbarComponent(groupFilter);

        return crudGrid;
    }

    /**
     * We do not control the groups on other screens/displays
     *
     * @param crudGrid the crudGrid that will be filtered.
     */
    @Override
    protected void defineFilters(GridCrud<Athlete> crud) {
        groupFilter.setPlaceholder(getTranslation("Group"));
        groupFilter.setItems(GroupRepository.findAll());
        groupFilter.setItemLabelGenerator(Group::getName);
        // hide because the top bar has it
        groupFilter.getStyle().set("display", "none");
        groupFilter.addValueChangeListener(e -> {
            logger.debug("updating filters: group={}", e.getValue());
            currentGroup = e.getValue();
            updateURLLocation(locationUI, location, currentGroup);
            subscribeIfLifting(e.getValue());
        });
        crud.getCrudLayout().addFilterComponent(groupFilter);
    }

    /**
     * Get the content of the crudGrid. Invoked by refreshGrid.
     * 
     * @see org.vaadin.crudui.crud.CrudListener#findAll()
     */
    @Override
    public Collection<Athlete> findAll() {
        List<Athlete> athletes = AthleteRepository.findAllByGroupAndWeighIn(groupFilter.getValue(), true);
        AthleteSorter.resultsOrder(athletes, Ranking.TOTAL);
        AthleteSorter.assignCategoryRanks(athletes, Ranking.TOTAL);
        AthleteSorter.resultsOrder(athletes, Ranking.SNATCH);
        AthleteSorter.assignCategoryRanks(athletes, Ranking.SNATCH);
        AthleteSorter.resultsOrder(athletes, Ranking.CLEANJERK);
        AthleteSorter.assignCategoryRanks(athletes, Ranking.CLEANJERK);
        return athletes;
    }

    /**
     * @return the groupFilter
     */
    @Override
    public ComboBox<Group> getGroupFilter() {
        return groupFilter;
    }

    public void refresh() {
        crudGrid.refreshGrid();
    }

    private void subscribeIfLifting(Group nGroup) {
        logger.debug("subscribeIfLifting {}", nGroup);
        Collection<FieldOfPlay> fops = OwlcmsFactory.getFOPs();
        currentGroup = nGroup;

        // go through all the FOPs
        for (FieldOfPlay fop : fops) {
            // unsubscribe from FOP -- ensures that we clean up if no group is lifting
            try {
                fop.getUiEventBus().unregister(this);
            } catch (Exception ex) {
            }
            try {
                fop.getFopEventBus().unregister(this);
            } catch (Exception ex) {
            }

            // subscribe to fop and start tracking if actually lifting
            if (fop.getGroup() != null && fop.getGroup().equals(nGroup)) {
                logger.debug("subscribing to {} {}", fop, nGroup);
                try {
                    fopEventBusRegister(this, fop);
                } catch (Exception ex) {
                }
                try {
                    uiEventBusRegister(this, fop);
                } catch (Exception ex) {
                }
            }
        }
    }

    /**
     * @return true if the current group is safe for editing -- i.e. not lifting
     *         currently
     */
    private boolean checkFOP() {
        Collection<FieldOfPlay> fops = OwlcmsFactory.getFOPs();
        FieldOfPlay liftingFop = null;
        search: for (FieldOfPlay fop : fops) {
            if (fop.getGroup() != null && fop.getGroup().equals(currentGroup)) {
                liftingFop = fop;
                break search;
            }
        }
        if (liftingFop != null) {
            Notification.show(
                    getTranslation("Warning_GroupLifting") + liftingFop.getName() + getTranslation("CannotEditResults"),
                    3000, Position.MIDDLE);
            logger.debug(getTranslation("CannotEditResults_logging"), currentGroup, liftingFop);
            subscribeIfLifting(currentGroup);
        } else {
            logger.debug(getTranslation("EditingResults_logging"), currentGroup, liftingFop);
        }
        return liftingFop != null;
    }

    public void setGridGroup(Group group) {
        subscribeIfLifting(group);
        groupFilter.setValue(group);
        refresh();
    }

    public Group getGridGroup() {
        return groupFilter.getValue();
    }

    /**
     * Parse the http query parameters
     * 
     * Note: because we have the @Route, the parameters are parsed *before* our
     * parent layout is created.
     * 
     * @param event     Vaadin navigation event
     * @param parameter null in this case -- we don't want a vaadin "/" parameter.
     *                  This allows us to add query parameters instead.
     * 
     * @see app.owlcms.ui.shared.QueryParameterReader#setParameter(com.vaadin.flow.router.BeforeEvent,
     *      java.lang.String)
     */
    @Override
    public void setParameter(BeforeEvent event, @OptionalParameter String parameter) {
        location = event.getLocation();
        locationUI = event.getUI();
        QueryParameters queryParameters = location.getQueryParameters();
        Map<String, List<String>> parametersMap = queryParameters.getParameters(); // immutable
        HashMap<String, List<String>> params = new HashMap<String, List<String>>(parametersMap);

        logger.debug("parsing query parameters");
        List<String> groupNames = params.get("group");
        if (!isIgnoreGroupFromURL() && groupNames != null && !groupNames.isEmpty()) {
            String groupName = groupNames.get(0);
            currentGroup = GroupRepository.findByName(groupName);
        } else {
            currentGroup = null;
        }
        if (currentGroup != null) {
            params.put("group", Arrays.asList(currentGroup.getName()));
        } else {
            params.remove("group");
        }
        params.remove("fop");

        // change the URL to reflect group
        event.getUI().getPage().getHistory().replaceState(null,
                new Location(location.getPath(), new QueryParameters(params)));
    }

    @Override
    public void updateURLLocation(UI ui, Location location, Group newGroup) {
        // change the URL to reflect fop group
        HashMap<String, List<String>> params = new HashMap<String, List<String>>(
                location.getQueryParameters().getParameters());
        if (!isIgnoreGroupFromURL() && newGroup != null) {
            params.put("group", Arrays.asList(newGroup.getName()));
        } else {
            params.remove("group");
        }
        ui.getPage().getHistory().replaceState(null, new Location(location.getPath(), new QueryParameters(params)));
    }

    @Override
    public boolean isIgnoreGroupFromURL() {
        return false;
    }

    /**
     * @see com.vaadin.flow.router.HasDynamicTitle#getPageTitle()
     */
    @Override
    public String getPageTitle() {
        return getTranslation("Results");
    }

}
