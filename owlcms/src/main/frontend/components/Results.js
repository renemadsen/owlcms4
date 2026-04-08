import { html, LitElement, css } from "lit";
/*******************************************************************************
 * Copyright (c) 2009-2023 Jean-François Lamy
 *
 * Licensed under the Non-Profit Open Software License version 3.0  ("NPOSL-3.0")
 * License text at https://opensource.org/licenses/NPOSL-3.0
 *******************************************************************************/

class Results extends LitElement {
  static get is() {
    return "results-template";
  }

  render() {
    return html`
      <link rel="stylesheet" type="text/css" .href="${"local/" + (this.stylesDir ?? "") + "/colors" + (this.autoversion ?? "") + ".css"}" />
      <link rel="stylesheet" type="text/css" .href="${"local/" + (this.stylesDir ?? "") + "/results" + (this.autoversion ?? "") + ".css"}" />
      <link rel="stylesheet" type="text/css" .href="${"local/" + (this.stylesDir ?? "") + "/resultsCustomization" + (this.autoversion ?? "") + ".css"}" />

      <div class="${this.wrapperClasses()}" style="${this.sizeOverride} ${this.colorOverride}">
        <div class="blockPositioningWrapper">
          <div class="waiting" style="${this.waitingStyles()}">
            <div>
              <div class="competitionName">${this.competitionName}</div>
              <br />
              <div class="nextGroup">${this.t?.WaitingNextGroup}</div>
            </div>
          </div>
          <div class="header-bar" style="${this.videoHeaderStyles()}">
            <div class="event-title">${this.competitionName}</div>
            <div class="group-info">${this.groupDescription}</div>
          </div>
          <div class="attempt-bar" style="${this.attemptBarStyles()}">
            <div class="start-num" style="${this.startNumberStyles()}">${this.startNumber}</div>
            <div class="athlete-name" style="${this.fullNameStyles()}" .innerHTML="${this.fullName}"></div>
            <div class="club" style="${this.teamNameStyles()}">${this.teamName}</div>
            <div class="attempt-info" style="${this.attemptStyles()}"><span .innerHTML="${this.attempt}"></span></div>
            <div class="weight-val" style="${this.weightStyles()}">${this.weight}<span>&hairsp;${this.t?.KgSymbol}</span></div>
            <div class="timer athleteTimer" style="${this.athleteTimerStyles()}"><timer-element id="timer"></timer-element></div>
            <div class="timer breakTime" style="${this.breakTimerStyles()}"><timer-element id="breakTimer"></timer-element></div>
            <div class="decisionBox" style="${this.decisionStyles()}"><decision-element style="width:100%" id="decisions"></decision-element></div>
          </div>

          <table class="results-table" style="${this.athleteTableStyles()}">
            ${this.athletes
              ? html`
                <thead><tr>
                  <th style="width:3ch"></th>
                  <th class="name-col">${this.t?.Name}</th>
                  <th>${this.t?.Category}</th>
                  <th>${this.t?.Team}</th>
                  <th class="spacer-col"></th>
                  <th>1</th><th>2</th><th>3</th><th>${this.t?.Best}</th><th>${this.t?.Rank}</th>
                  <th class="spacer-col"></th>
                  <th>1</th><th>2</th><th>3</th><th>${this.t?.Best}</th><th>${this.t?.Rank}</th>
                  <th class="spacer-col"></th>
                  <th>${this.t?.Total}</th><th>${this.t?.Rank}</th>
                </tr></thead>
                <tbody>
                ${(this.athletes ?? []).map(
                    (item) =>
                      html`
                        ${item?.isSpacer
                          ? html`<tr class="spacer-row"><td colspan="19"></td></tr>`
                          : html`
                            <tr class="${(item?.classname ?? "").includes("current") ? "current-athlete" : (item?.classname ?? "").includes("next") ? "next-athlete" : ""}">
                              <td>${item?.startNumber}</td>
                              <td class="name-cell">${item?.fullName}</td>
                              <td>${item?.category}</td>
                              <td>${item?.teamName}</td>
                              <td class="spacer-col"></td>
                              ${(item?.sattempts ?? []).map(
                                (attempt) =>
                                  html`<td class="${(attempt?.liftStatus ?? "") + " " + (attempt?.className ?? "")}">${attempt?.stringValue}</td>`
                              )}
                              <td class="best" .innerHTML="${item?.bestSnatch}"></td>
                              <td class="rank" .innerHTML="${item?.snatchRank}"></td>
                              <td class="spacer-col"></td>
                              ${(item?.cattempts ?? []).map(
                                (attempt) =>
                                  html`<td class="${(attempt?.liftStatus ?? "") + " " + (attempt?.className ?? "")}">${attempt?.stringValue}</td>`
                              )}
                              <td class="best" .innerHTML="${item?.bestCleanJerk}"></td>
                              <td class="rank" .innerHTML="${item?.cleanJerkRank}"></td>
                              <td class="spacer-col"></td>
                              <td class="total">${item?.total}</td>
                              <td class="rank" .innerHTML="${item?.totalRank}"></td>
                            </tr>
                          `}
                  `)}
                </tbody>
              `
              : html``}
            ${this.leaders
              ? html`
                <tbody class="leaders" style="${this.leadersStyles()}">
                  <tr class="spacer-row"><td colspan="19"></td></tr>
                  <tr class="leader-title-row">
                    <td colspan="19" class="leader-title" .innerHTML="${(this.t?.Leaders ?? "") + " " + (this.categoryName ?? "")}"></td>
                  </tr>
                  ${(this.leaders ?? []).map(
                    (item) =>
                      html`
                        ${!item?.isSpacer
                          ? html`
                              <tr>
                                <td>${item?.subCategory}</td>
                                <td class="name-cell">${item?.fullName}</td>
                                <td>${item?.category}</td>
                                <td>${item?.teamName}</td>
                                <td class="spacer-col"></td>
                                ${(item?.sattempts ?? []).map(
                                  (attempt) =>
                                    html`<td class="${(attempt?.liftStatus ?? "") + " " + (attempt?.className ?? "")}">${attempt?.stringValue}</td>`
                                )}
                                <td class="best" .innerHTML="${item?.bestSnatch}"></td>
                                <td class="rank" .innerHTML="${item?.snatchRank}"></td>
                                <td class="spacer-col"></td>
                                ${(item?.cattempts ?? []).map(
                                  (attempt) =>
                                    html`<td class="${(attempt?.liftStatus ?? "") + " " + (attempt?.className ?? "")}">${attempt?.stringValue}</td>`
                                )}
                                <td class="best" .innerHTML="${item?.bestCleanJerk}"></td>
                                <td class="rank" .innerHTML="${item?.cleanJerkRank}"></td>
                                <td class="spacer-col"></td>
                                <td class="total">${item?.total}</td>
                                <td class="rank" .innerHTML="${item?.totalRank}"></td>
                              </tr>
                          `
                          : html``}
                      `)}
                </tbody>
              `
              : html``}
          </table>
          ${this.records && this.showRecords
            ? html`
              <div style="${this.recordsStyles()}">
                <div class="recordsFiller">&nbsp;</div>
                <div class="recordRow" style="${(this.hiddenGridStyle ?? "") + "; --nbRecords: " + (this.records?.nbRecords ?? "")}">
                  <div class="recordTitleBlock">
                    <div class="recordName recordTitle">${this.t?.records}</div>
                    <div class="recordLiftTypeSpacer"><span class="recordLiftTypeSpacer">&nbsp;</span></div>
                    ${(this.records?.recordNames ?? []).map(
                      (n, index) =>
                        html`
                          <div class="recordName">${n}</div>
                        `)}
                  </div>

                  ${(this.records?.recordTable ?? []).map(
                    (c, index) =>
                      html`
                        <div class="${c?.recordClass}">
                          <div class="recordCat" .innerHTML="${c?.cat}"></div>
                          <div class="recordLiftType"><span class="recordLiftType">${this.t?.recordS}</span></div>
                          <div class="recordLiftType"><span class="recordLiftType">${this.t?.recordCJ}</span></div>
                          <div class="recordLiftType"><span class="recordLiftType">${this.t?.recordT}</span></div>
                          ${(c?.records ?? []).map(
                            (r, index) =>
                              html`
                                <div class="${"recordCell " + (r?.snatchHighlight ?? "")} ">${r?.SNATCH}</div>
                                <div class="${"recordCell " + (r?.cjHighlight ?? "")} ">${r?.CLEANJERK}</div>
                                <div class="${"recordCell " + (r?.totalHighlight ?? "")} ">${r?.TOTAL}</div>
                              `)}
                        </div>
                      `)}
                  <div class="${"recordNotification " + (this.recordKind ?? "")}"> ${this.recordMessage} </div>
                  <!--DVF: hide branding--><div class="branding" style="display:none;"><img src="local/logos/owlcms-logo.svg" style="height:1.25em; margin-bottom:-0.2em">&nbsp;owlcms</div>
                </div>
              </div>
            `
            : html`<div style="${this.bottomSpacerStyles()}">&nbsp;
              <!--DVF: hide branding--><div class="branding" style="display:none;"><img src="local/logos/owlcms-logo.svg" style="height:1.25em; margin-bottom:-0.2em">&nbsp;owlcms</div>
            </div>
            `}
        </div>
      </div>
    `;
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
      platformName: {},
      scoreboardType: {},

      // during lifting
      athletes: { type: Object },
      leaders: { type: Object },
      records: { type: Object },

      // mode (mutually exclusive, one of:
      // WAIT INTRO_COUNTDOWN LIFT_COUNTDOWN CURRENT_ATHLETE INTERRUPTION SESSION_DONE CEREMONY
      mode: {},
      decisionVisible: { type: Boolean }, // sub-mode of CURRENT_ATHLETE

      // dynamic styling
      darkMode: {},
      teamWidthClass: {},
      sizeOverride: {},
      twOverride: {},
      colorOverride: {},
      video: {},
      currentAttempt: {},
      showLiftRanks: {type: Boolean},
      showBest: {type: Boolean},
      showSinclair: {type: Boolean},
      showSinclairRanks: {type: Boolean},
      showLeaders: {type: Boolean},
      showRecords: {type: Boolean},
      logoSrc: {},

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

  _isEqualTo(title, string) {
    return title == string;
  }

  wrapperClasses() {
    var classes = "wrapper";
    classes = classes + (this.platformName ? " " + this.platformName : "");
    classes = classes + (this.darkMode ? " " + this.darkMode : "");
    classes = classes + (this.teamWidthClass ? " " + this.teamWidthClass : "");
    classes = classes + (this.mode === "WAIT" ? " bigTitle" : "");
    classes = classes + (this.scoreboardType ? " " + this.scoreboardType : "");
    return classes;
  }

  waitingStyles() { /* originally flex */
    return "display: " + (this.mode === "WAIT" ? "grid" : "none");
  }

  attemptBarStyles() {
    return "display: " + (this.mode === "WAIT" ? "none" : "grid");
  }

  athleteInfoStyles() {
    return "display: " + (this.mode === "WAIT" ? "none" : "flex");
  }

  fullNameStyles() {
    return  "display: " + (this.mode === "WAIT" ? "none" : "block");
  }

  teamNameStyles() {
    return "display: " + (this.isBreak() ? "none" : "block");
  }

  attemptStyles() {
    return "display: " + (this.isBreak() ? "none" : "flex");
  }

  startNumberStyles() {
    return "display: " + (this.isBreak() ? "none" : "flex");
  }

  weightStyles() {
    // weights are visible during lift countdowns
    return "display: " + ((this.mode === "LIFT_COUNTDOWN" || (this.mode === "CURRENT_ATHLETE")) ? "flex" : "none");
  }

  athleteTimerStyles() {
  //  let visible = ((this.mode === "CURRENT_ATHLETE" && !this.decisionVisible) ? "display" : "hidden");
  //  return "visibility: " + (this.isBreak() ? "hidden" : visible);
   let visible = ((this.mode === "CURRENT_ATHLETE" && !this.decisionVisible) ? "flex" : "none");
   return "display: " + (this.isBreak() ? "none" : visible);
  }

  breakTimerStyles() {
    return "display:" + ((this.mode === "INTRO_COUNTDOWN" || this.mode === "LIFT_COUNTDOWN" || this.mode === "LIFT_COUNTDOWN_CEREMONY") ? "flex" : "none");
  }

  decisionStyles() {
    return "display: " + ((this.mode === "CURRENT_ATHLETE" && this.decisionVisible) ? "flex" : "none");
  }

  videoHeaderStyles() {
    return "display: " + (this.mode !== "WAIT" ? "flex" : "none");
  }

  bottomSpacerStyles() {
    return "line-height: var(--bottomSpacerHeight)";
  }

  athleteClasses() {
    var classes = "results "
    + (this.showTotal ? " total" : " nototal")
    + (this.showLiftRanks ? " ranks" : " noranks")
    + (this.showBest ? " best" : " nobest")
    + (this.showTotalRank ? " totalRank" : " nototalRank")
    + (this.showSinclair ? " sinclair" : " nosinclair")
    + (this.showSinclairRank ? " sinclairRank" : " nosinclairRank")
    ;
    //console.log("athleteClasses = "+classes);
    return classes;
}

  athleteTableStyles() {
    return this.mode === "WAIT" ? "display:none" : "";
  }

  leadersStyles() {
    return this.showLeaders ? "" : "display:none";
  }

  leadingAthleteStyles() {
    return this.showLeaders ? "" : " display:none";
  }

  fillerStyles() { // was display:flex
    return (this.showLeaders && this.mode !== "WAIT") ? " display:grid" : " display:none";
  }

  recordsStyles() {
    return (!this.showRecords || this.mode !== "CURRENT_ATHLETE")
      ? "display:none"
      : "font-size: var(--recordsFontRatio); display: block" ;
  }

  isBreak() {
    return this.mode === "INTERRUPTION" || this.mode === "INTRO_COUNTDOWN" || this.mode === "LIFT_COUNTDOWN" || this.mode === "LIFT_COUNTDOWN_CEREMONY" || this.mode === "SESSION_DONE" || this.mode === "CEREMONY"
  }

  isCountdown() {
    return  this.mode === "INTRO_COUNTDOWN" || this.mode === "LIFT_COUNTDOWN" || this.mode === "LIFT_COUNTDOWN_CEREMONY"
  }

  constructor() {
    super();
    this.mode = "WAIT";
  }
 }

customElements.define(Results.is, Results);
