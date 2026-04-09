import { html, LitElement, css } from "lit";
/*******************************************************************************
 * Copyright (c) 2009-2023 Jean-François Lamy
 *
 * Licensed under the Non-Profit Open Software License version 3.0  ("NPOSL-3.0")
 * License text at https://opensource.org/licenses/NPOSL-3.0
 *******************************************************************************/

class ResultsFull extends LitElement {
  static get is() {
    return "resultsfull-template";
  }

  render() {
    return html`
      <link rel="stylesheet" type="text/css" .href="${"local/" + (this.stylesDir ?? "") + "/colors" + (this.autoversion ?? "") + ".css"}" />
      <link rel="stylesheet" type="text/css" .href="${"local/" + (this.stylesDir ?? "") + "/results" + (this.autoversion ?? "") + ".css"}" />
      <link rel="stylesheet" type="text/css" .href="${"local/" + (this.stylesDir ?? "") + "/resultsCustomization" + (this.autoversion ?? "") + ".css"}" />

      <div class="${this.wrapperClasses()}" style="${this.sizeOverride} ${this.colorOverride}">
        <div class="blockPositioningWrapper">
          <div class="header-bar" style="${this.videoHeaderStyles()}">
            <img src="local/logos/dvf-logo-white.png" style="height:28px;opacity:0.9;">
            <div class="event-title">${this.competitionName}</div>
            <div class="group-info">${this.groupDescription}</div>
            <div style="margin-left:auto;display:flex;align-items:center;gap:6px;">
              <span style="color:rgba(255,255,255,0.4);font-size:0.5em;text-transform:uppercase;letter-spacing:1px;">Powered by</span>
              <img src="local/logos/eleiko-logo-white.svg" style="height:20px;opacity:0.9;">
            </div>
          </div>

          <!-- hidden elements required because we subclass the results page -->
          <div style="display:none">
            <timer-element id="timer"></timer-element>
            <timer-element id="breakTimer"></timer-element>
            <decision-element id="decisions"></decision-element>
          </div>

          <table class="results-table" style="${this.athleteTableStyles()}">
            ${this.athletes
              ? html`
                <thead><tr>
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
                  ${(this.ageGroups ?? []).map((item) => html`<th class="rank">${item}</th>`)}
                  <th class="spacer-col"></th>
                  <th>1</th><th>2</th><th>3</th>
                  <th>${this.t?.Best}</th>
                  ${(this.ageGroups ?? []).map((item) => html`<th class="rank">${item}</th>`)}
                  <th class="spacer-col"></th>
                  <th>${this.t?.Total}</th>
                  ${(this.ageGroups ?? []).map((item) => html`<th class="rank">${item}</th>`)}
                  ${this.showSinclair ? html`
                    <th>${this.t?.ScoringTitle}</th>
                    <th class="rank">${this.t?.Rank}</th>
                  ` : html``}
                </tr></thead>
                <tbody>
                ${(this.athletes ?? []).map(
                    (item) => html`
                      ${item?.isSpacer
                        ? html`<tr class="spacer-row"><td colspan="99"></td></tr>`
                        : html`
                          <tr class="${(item?.classname ?? "").includes("current") ? "current-athlete" : (item?.classname ?? "").includes("next") ? "next-athlete" : ""}">
                            <td>${item?.startNumber}</td>
                            <td class="name-cell">${item?.fullName}</td>
                            <td>${item?.category}</td>
                            <td>${item?.yearOfBirth}</td>
                            <td>${item?.custom1}</td>
                            <td>${item?.custom2}</td>
                            <td>${item?.teamName}</td>
                            <td class="spacer-col"></td>
                            ${(item?.sattempts ?? []).map(
                              (attempt) => html`<td class="${(attempt?.liftStatus ?? "") + " " + (attempt?.className ?? "")}">${attempt?.stringValue}</td>`
                            )}
                            <td class="best" .innerHTML="${item?.bestSnatch}"></td>
                            ${(item?.snatchRanks ?? []).map(
                              (rk) => html`<td class="rank" .innerHTML="${rk}"></td>`
                            )}
                            <td class="spacer-col"></td>
                            ${(item?.cattempts ?? []).map(
                              (attempt) => html`<td class="${(attempt?.liftStatus ?? "") + " " + (attempt?.className ?? "")}">${attempt?.stringValue}</td>`
                            )}
                            <td class="best" .innerHTML="${item?.bestCleanJerk}"></td>
                            ${(item?.cleanJerkRanks ?? []).map(
                              (rk) => html`<td class="rank" .innerHTML="${rk}"></td>`
                            )}
                            <td class="spacer-col"></td>
                            <td class="total">${item?.total}</td>
                            ${(item?.totalRanks ?? []).map(
                              (rk) => html`<td class="rank" .innerHTML="${rk}"></td>`
                            )}
                            ${this.showSinclair ? html`
                              <td>${item?.sinclair}</td>
                              <td class="rank">${item?.sinclairRank}</td>
                            ` : html``}
                          </tr>
                        `}
                    `)}
                </tbody>
              `
              : html``}
            ${this.leaders
              ? html`
                <tbody class="leaders" style="${this.leadersStyles()}">
                  <tr class="spacer-row"><td colspan="99"></td></tr>
                  <tr class="leader-title-row">
                    <td colspan="99" class="leader-title" .innerHTML="${(this.t?.Leaders ?? "") + " " + (this.categoryName ?? "")}"></td>
                  </tr>
                  ${(this.leaders ?? []).map(
                    (item) => html`
                      ${!item?.isSpacer
                        ? html`
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
                              (attempt) => html`<td class="${(attempt?.liftStatus ?? "") + " " + (attempt?.className ?? "")}">${attempt?.stringValue}</td>`
                            )}
                            <td class="best" .innerHTML="${item?.bestSnatch}"></td>
                            ${(item?.snatchRanks ?? []).map(
                              (rk) => html`<td class="rank" .innerHTML="${rk}"></td>`
                            )}
                            <td class="spacer-col"></td>
                            ${(item?.cattempts ?? []).map(
                              (attempt) => html`<td class="${(attempt?.liftStatus ?? "") + " " + (attempt?.className ?? "")}">${attempt?.stringValue}</td>`
                            )}
                            <td class="best" .innerHTML="${item?.bestCleanJerk}"></td>
                            ${(item?.cleanJerkRanks ?? []).map(
                              (rk) => html`<td class="rank" .innerHTML="${rk}"></td>`
                            )}
                            <td class="spacer-col"></td>
                            <td class="total">${item?.total}</td>
                            ${(item?.totalRanks ?? []).map(
                              (rk) => html`<td class="rank" .innerHTML="${rk}"></td>`
                            )}
                            ${this.showSinclair ? html`
                              <td>${item?.sinclair}</td>
                              <td class="rank">${item?.sinclairRank}</td>
                            ` : html``}
                          </tr>
                        `
                        : html``}
                    `)}
                </tbody>
              `
              : html``}
          </table>
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
      nbRanks: {},
      ageGroups: {},
      platformName: {},
      scoreboardType: {},
      categoryName: {},

      // during lifting
      athletes: { type: Object },
      leaders: { type: Object },
      records: { type: Object },

      // mode. Mutually exclusive, one of:
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
      showTotal: { type: Boolean },
      showLiftRanks: { type: Boolean },
      showTotalRanks: { type: Boolean },
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

  videoHeaderStyles() {
    return this.mode !== "WAIT" ? "display: flex" : "display: none";
  }

  athleteTableStyles() {
    return this.mode === "WAIT" ? "display: none" : "";
  }

  leadersStyles() {
    return this.showLeaders ? "" : "display:none";
  }

  isBreak() {
    return this.mode === "INTERRUPTION" || this.mode === "INTRO_COUNTDOWN" || this.mode === "LIFT_COUNTDOWN" || this.mode === "LIFT_COUNTDOWN_CEREMONY" || this.mode === "SESSION_DONE" || this.mode === "CEREMONY";
  }
}

customElements.define(ResultsFull.is, ResultsFull);
