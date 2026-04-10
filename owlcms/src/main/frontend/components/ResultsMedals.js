import { html, LitElement, css } from "lit";
/*******************************************************************************
 * Copyright (c) 2009-2023 Jean-François Lamy
 *
 * Licensed under the Non-Profit Open Software License version 3.0  ("NPOSL-3.0")
 * License text at https://opensource.org/licenses/NPOSL-3.0
 *******************************************************************************/

/**
 * Medals display — shows final medal results by category.
 *
 * Similar to ResultsRankingsByCategory but:
 *  - Medal classes are always applied (no showMedals toggle)
 *  - First column shows subCategory instead of startNumber
 *  - Category headers are always shown
 *  - Header bar shows displayTitle + groupDescription directly
 *
 * Note: .innerHTML bindings are intentional — data comes from Java backend, not user input.
 */
class ResultsMedals extends LitElement {
  static get is() {
    return "resultsmedals-template";
  }

  render() {
    return html`
      <link rel="stylesheet" type="text/css" .href="${"local/" + (this.stylesDir ?? "") + "/colors" + (this.autoversion ?? "") + ".css"}" />
      <link rel="stylesheet" type="text/css" .href="${"local/" + (this.stylesDir ?? "") + "/results" + (this.autoversion ?? "") + ".css"}" />
      <link rel="stylesheet" type="text/css" .href="${"local/" + (this.stylesDir ?? "") + "/resultsMedalsCustomization" + (this.autoversion ?? "") + ".css"}" />
      <div class="${this.wrapperClasses()}" style="${this.sizeOverride} ${this.colorOverride}">
        <div class="blockPositioningWrapper">
          <div class="header-bar" style="display: flex">
            <img src="local/logos/dvf-logo-white.png" style="height:28px;opacity:0.9;">
            <div class="event-title">${this.competitionName}</div>
            <div class="group-info">${this.displayTitle} ${this.groupDescription}</div>
            <div style="margin-left:auto;display:flex;align-items:center;gap:6px;">
              <span style="color:rgba(255,255,255,0.4);font-size:0.5em;text-transform:uppercase;letter-spacing:1px;">Powered by</span>
              <img src="local/logos/eleiko-logo-white.svg" style="height:20px;opacity:0.9;">
            </div>
          </div>
          <div class="waiting" style="${this.waitingStyles()}">
            <div>
              <div class="competitionName">${this.competitionName}</div>
              <br />
              <div class="nextGroup">${this.t?.WaitingNextGroup}</div>
            </div>
          </div>
          <!-- hidden elements required because we subclass the results page -->
          <div style="display:none">
            <timer-element id="timer"></timer-element>
            <timer-element id="breakTimer"></timer-element>
            <decision-element id="decisions"></decision-element>
          </div>

          <table class="results-table" style="${this.tableStyles()}">
            ${(this.medalCategories ?? []).map(
              (mc) => html`
                <tbody>
                  <tr><td colspan="99" class="cat-header" .innerHTML="${mc.categoryName}"></td></tr>
                  <tr class="head">
                    <th style="width:3ch">${this.t?.Start}</th>
                    <th class="name-col">${this.t?.Name}</th>
                    <th>${this.t?.Category}</th>
                    <th>${this.t?.Birth}</th>
                    <th>${this.t?.Custom1}</th>
                    <th>${this.t?.Custom2}</th>
                    <th>${this.t?.Team}</th>
                    <th class="spacer-col"></th>
                    <th>1</th><th>2</th><th>3</th>
                    <th>${this.t?.Best}</th>
                    <th class="rank">${mc.rankingTitle}</th>
                    <th class="spacer-col"></th>
                    <th>1</th><th>2</th><th>3</th>
                    <th>${this.t?.Best}</th>
                    <th class="rank">${mc.rankingTitle}</th>
                    <th class="spacer-col"></th>
                    <th>${this.t?.Total}</th>
                    <th class="rank">${mc.rankingTitle}</th>
                    ${this.showSinclair ? html`
                      <th>${mc.scoreScoringTitle}</th>
                      <th class="rank">${mc.scoreRankingTitle}</th>
                    ` : html``}
                  </tr>
                  ${(mc.leaders ?? []).map(
                    (item) => html`
                      <tr>
                        <td>${item?.subCategory}</td>
                        <td class="name-cell">${item?.fullName}</td>
                        <td>${item?.category}</td>
                        <td>${item?.yearOfBirth}</td>
                        <td>${item?.custom1}</td>
                        <td>${item?.custom2}</td>
                        <td>${item?.teamName}</td>
                        <td class="spacer-col"></td>
                        ${(item?.sattempts ?? []).map(
                          (attempt) => html`
                            <td class="${(attempt?.liftStatus ?? "") + " " + (attempt?.className ?? "")}">${attempt?.stringValue}</td>
                          `)}
                        <td class="best" .innerHTML="${item?.bestSnatch}"></td>
                        <td class="${"rank " + (item?.snatchMedal ?? "")}" .innerHTML="${item?.snatchRank}"></td>
                        <td class="spacer-col"></td>
                        ${(item?.cattempts ?? []).map(
                          (attempt) => html`
                            <td class="${(attempt?.liftStatus ?? "") + " " + (attempt?.className ?? "")}">${attempt?.stringValue}</td>
                          `)}
                        <td class="best" .innerHTML="${item?.bestCleanJerk}"></td>
                        <td class="${"rank " + (item?.cleanJerkMedal ?? "")}" .innerHTML="${item?.cleanJerkRank}"></td>
                        <td class="spacer-col"></td>
                        <td class="total">${item?.total}</td>
                        <td class="${"rank " + (item?.totalMedal ?? "")}" .innerHTML="${item?.totalRank}"></td>
                        ${this.showSinclair ? html`
                          <td>${item?.sinclair}</td>
                          <td class="${"rank " + (item?.sinclairMedal ?? "")}">${item?.sinclairRank}</td>
                        ` : html``}
                      </tr>
                    `
                  )}
                </tbody>
              `)}
          </table>
        </div>
      </div>`;
  }

  static get properties() {
    return {
      competitionName: {},
      // shared
      startNumber: {},
      fullName: {},
      teamName: {},
      attempt: {},
      weight: {},
      displayType: {},
      groupName: {},
      groupDescription: {},
      displayTitle: {},
      nbRanks: {},
      ageGroups: {},
      platformName: {},

      // data
      athletes: { type: Object },
      leaders: { type: Object },
      records: { type: Object },
      medalCategories: { type: Object },

      // mode
      mode: {},
      decisionVisible: { type: Boolean },
      darkMode: {},

      // dynamic styling
      teamWidthClass: {},
      sizeOverride: {},
      twOverride: {},
      colorOverride: {},
      video: {},
      showLiftRanks: { type: Boolean },
      showBest: { type: Boolean },
      showSinclair: { type: Boolean },
      showSinclairRanks: { type: Boolean },
      showLeaders: { type: Boolean },
      showRecords: { type: Boolean },

      // translation map
      t: { type: Object },

      // style sheets & misc.
      javaComponentId: {},
      stylesDir: {},
      autoVersion: {},
    };
  }

  firstUpdated(_changedProperties) {
    console.debug("ready");
    super.firstUpdated(_changedProperties);
    document.body.setAttribute("theme", "dark");
  }

  start() {
    this.renderRoot.querySelector("#timer").start();
  }

  constructor() {
    super();
    this.mode = "WAIT";
  }

  wrapperClasses() {
    var classes = "wrapper";
    classes = classes + (this.platformName ? " " + this.platformName : "");
    classes = classes + (this.darkMode ? " " + this.darkMode : "");
    classes = classes + (this.teamWidthClass ? " " + this.teamWidthClass : "");
    return classes;
  }

  waitingStyles() {
    return this.mode === "WAIT" ? "display: grid" : "display: none";
  }

  tableStyles() {
    return this.mode === "WAIT" ? "display: none" : "";
  }

  isBreak() {
    return this.mode === "INTERRUPTION" || this.mode === "INTRO_COUNTDOWN" || this.mode === "LIFT_COUNTDOWN" || this.mode === "SESSION_DONE" || this.mode === "CEREMONY"
  }
}

customElements.define(ResultsMedals.is, ResultsMedals);
