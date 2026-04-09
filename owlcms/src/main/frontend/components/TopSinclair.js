import { html, LitElement } from "lit";
/*******************************************************************************
 * Copyright (c) 2009-2023 Jean-François Lamy
 *
 * Licensed under the Non-Profit Open Software License version 3.0  ("NPOSL-3.0")
 * License text at https://opensource.org/licenses/NPOSL-3.0
 *******************************************************************************/

class TopSinclair extends LitElement {
  static get is() {
    return "topsinclair-template";
  }

  render() {
    return html`
      <link rel="stylesheet" type="text/css" .href="${"local/" + (this.stylesDir ?? "") + "/colors" + (this.autoversion ?? "")}.css" />
      <link rel="stylesheet" type="text/css" .href="${"local/" + (this.stylesDir ?? "") + "/topSinclair" + (this.autoversion ?? "")}.css" />
      <div class="notused" style="display:none">
        <timer-element id="timer"></timer-element>
        <timer-element id="breakTimer"></timer-element>
        <decision-element id="decisions"></decision-element>
      </div>
      <div id="resultBoardDiv" class="${this.activeClasses()} ${this.darkMode ?? 'dark'}" style="${this.colorOverride ?? ''}">
        ${this.topSinclairWomen
          ? html`
            <div class="team-board">
              <div class="tb-header">
                <img src="local/logos/dvf-logo-white.png" style="height:24px;opacity:0.9;">
                <div class="tb-title" .innerHTML="${this.topSinclairWomen}"></div>
                <div class="tb-cat">Top ${this.t?.ScoringTitle || 'Sinclair'}</div>
              </div>
              <table class="team-table">
                <thead>
                  <tr>
                    <th style="text-align:left" .innerHTML="${this.t?.Name || 'Navn'}"></th>
                    <th .innerHTML="${this.t?.Team || 'Klub'}"></th>
                    <th .innerHTML="${this.t?.Category || 'Kat.'}"></th>
                    <th colspan="3" class="${this.displayLifts ? 'showLifts' : 'hideLifts'}" .innerHTML="${this.t?.Snatch || 'Træk'}"></th>
                    <th class="best" .innerHTML="${this.t?.Snatch || 'Best Træk'}"></th>
                    <th colspan="3" class="${this.displayLifts ? 'showLifts' : 'hideLifts'}" .innerHTML="${this.t?.Clean_and_Jerk || 'Stød'}"></th>
                    <th class="best" .innerHTML="${this.t?.Clean_and_Jerk || 'Best Stød'}"></th>
                    <th .innerHTML="${this.t?.Total || 'Total'}"></th>
                    <th class="sinclair" .innerHTML="${this.t?.ScoringTitle || 'Sinclair'}"></th>
                  </tr>
                </thead>
                <tbody>
                  ${(this.sortedWomen ?? []).map(
                    (item) => html`
                      <tr>
                        <td>${item.fullName}</td>
                        <td>${item.teamName}</td>
                        <td>${item.category}</td>
                        ${[0,1,2].map(i => {
                          const attempt = (item.sattempts && item.sattempts[i]) || {};
                          return html`<td class="${this.displayLifts ? 'showLifts' : 'hideLifts'} ${attempt.liftStatus ?? ''} ${attempt.className ?? ''}">${attempt.stringValue ?? ''}</td>`;
                        })}
                        <td class="best">${item.bestSnatch ?? ''}</td>
                        ${[0,1,2].map(i => {
                          const attempt = (item.cattempts && item.cattempts[i]) || {};
                          return html`<td class="${this.displayLifts ? 'showLifts' : 'hideLifts'} ${attempt.liftStatus ?? ''} ${attempt.className ?? ''}">${attempt.stringValue ?? ''}</td>`;
                        })}
                        <td class="best">${item.bestCleanJerk ?? ''}</td>
                        <td>${item.total}</td>
                        <td class="sinclair">${item.sinclair}</td>
                      </tr>
                    `
                  )}
                </tbody>
              </table>
            </div>
          `
          : html``}
        ${this.topSinclairMen
          ? html`
            <div class="team-board">
              <div class="tb-header">
                <img src="local/logos/dvf-logo-white.png" style="height:24px;opacity:0.9;">
                <div class="tb-title" .innerHTML="${this.topSinclairMen}"></div>
                <div class="tb-cat">Top ${this.t?.ScoringTitle || 'Sinclair'}</div>
              </div>
              <table class="team-table">
                <thead>
                  <tr>
                    <th style="text-align:left" .innerHTML="${this.t?.Name || 'Navn'}"></th>
                    <th .innerHTML="${this.t?.Team || 'Klub'}"></th>
                    <th .innerHTML="${this.t?.Category || 'Kat.'}"></th>
                    <th colspan="3" class="${this.displayLifts ? 'showLifts' : 'hideLifts'}" .innerHTML="${this.t?.Snatch || 'Træk'}"></th>
                    <th class="best" .innerHTML="${this.t?.Snatch || 'Best Træk'}"></th>
                    <th colspan="3" class="${this.displayLifts ? 'showLifts' : 'hideLifts'}" .innerHTML="${this.t?.Clean_and_Jerk || 'Stød'}"></th>
                    <th class="best" .innerHTML="${this.t?.Clean_and_Jerk || 'Best Stød'}"></th>
                    <th .innerHTML="${this.t?.Total || 'Total'}"></th>
                    <th class="sinclair" .innerHTML="${this.t?.ScoringTitle || 'Sinclair'}"></th>
                  </tr>
                </thead>
                <tbody>
                  ${(this.sortedMen ?? []).map(
                    (item) => html`
                      <tr>
                        <td>${item.fullName}</td>
                        <td>${item.teamName}</td>
                        <td>${item.category}</td>
                        ${[0,1,2].map(i => {
                          const attempt = (item.sattempts && item.sattempts[i]) || {};
                          return html`<td class="${this.displayLifts ? 'showLifts' : 'hideLifts'} ${attempt.liftStatus ?? ''} ${attempt.className ?? ''}">${attempt.stringValue ?? ''}</td>`;
                        })}
                        <td class="best">${item.bestSnatch ?? ''}</td>
                        ${[0,1,2].map(i => {
                          const attempt = (item.cattempts && item.cattempts[i]) || {};
                          return html`<td class="${this.displayLifts ? 'showLifts' : 'hideLifts'} ${attempt.liftStatus ?? ''} ${attempt.className ?? ''}">${attempt.stringValue ?? ''}</td>`;
                        })}
                        <td class="best">${item.bestCleanJerk ?? ''}</td>
                        <td>${item.total}</td>
                        <td class="sinclair">${item.sinclair}</td>
                      </tr>
                    `
                  )}
                </tbody>
              </table>
            </div>
          `
          : html``}
      </div>`;
  }

  firstUpdated(_changedProperties) {
    super.firstUpdated(_changedProperties);
    document.body.setAttribute("theme", "dark");
  }

  static get properties() {
    return {
      title: {},
      topSinclairMen: {},
      topSinclairWomen: {},
      sortedMen: {type: Object},
      sortedWomen: {type: Object},
      // style sheets & misc.
      javaComponentId: {},
      stylesDir: {},
      autoVersion: {},
      video: {},
      t: {type: Object},
      wideTeamNames: {},
      // dynamic styling
      darkMode: {},
      displayLifts: {type: Boolean},
      colorOverride: {},
    };
  }

  activeClasses() {
    return "wrapper " + (this.wideTeamNames ? "wideTeams" : "narrowTeams");
  }

  showLiftsClass() {
    return this.displayLifts ? "showLifts" : "hideLifts";
  }
}

customElements.define(TopSinclair.is, TopSinclair);
