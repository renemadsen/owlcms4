import { html, LitElement } from "lit";
/*******************************************************************************
 * Copyright (c) 2009-2023 Jean-François Lamy
 *
 * Licensed under the Non-Profit Open Software License version 3.0  ("NPOSL-3.0")
 * License text at https://opensource.org/licenses/NPOSL-3.0
 *******************************************************************************/

class TopTeamsSinclair extends LitElement {
  static get is() {
    return "topteamsinclair-template";
  }

  render() {
    return html`
     <link rel="stylesheet" type="text/css" .href="${"local/" + (this.stylesDir ?? "") + "/colors" + (this.autoversion ?? "")}.css" />
     <link rel="stylesheet" type="text/css" .href="${"local/" + (this.stylesDir ?? "") + "/top" + (this.autoversion ?? "")}.css" />
     <div class="notused" style="display:none">
        <timer-element id="timer"></timer-element>
        <timer-element id="breakTimer"></timer-element>
        <decision-element id="decisions"></decision-element>
      </div>
     <div id="resultBoardDiv" class="${this.activeClasses()} ${this.darkMode ?? "dark"}">
        ${this.topTeamsWomen
          ? html`
              <div class="team-board">
                <div class="tb-header">
                  <div class="tb-title" .innerHTML="${this.topTeamsWomen}"></div>
                  <div class="tb-cat">${this.t?.ScoringTitle}</div>
                </div>
                <table class="team-table">
                  <thead><tr>
                    <th>${this.t?.Team}</th>
                    <th>${this.t?.ScoringTitle}</th>
                  </tr></thead>
                  <tbody>
                    ${(this.womensTeams ?? []).map((item) => html`
                      <tr>
                        <td>${item.team}</td>
                        <td>${item.score}</td>
                      </tr>
                    `)}
                  </tbody>
                </table>
              </div>
            `
          : html``}
        ${this.topTeamsMen
          ? html`
              <div class="team-board">
                <div class="tb-header">
                  <div class="tb-title" .innerHTML="${this.topTeamsMen}"></div>
                  <div class="tb-cat">${this.t?.ScoringTitle}</div>
                </div>
                <table class="team-table">
                  <thead><tr>
                    <th>${this.t?.Team}</th>
                    <th>${this.t?.ScoringTitle}</th>
                  </tr></thead>
                  <tbody>
                    ${(this.mensTeams ?? []).map((item) => html`
                      <tr>
                        <td>${item.team}</td>
                        <td>${item.score}</td>
                      </tr>
                    `)}
                  </tbody>
                </table>
              </div>
            `
          : html``}
        ${this.topTeamsMixed
          ? html`
              <div class="team-board">
                <div class="tb-header">
                  <div class="tb-title" .innerHTML="${this.topTeamsMixed}"></div>
                  <div class="tb-cat">${this.t?.ScoringTitle}</div>
                </div>
                <table class="team-table">
                  <thead><tr>
                    <th>${this.t?.Team}</th>
                    <th>${this.t?.ScoringTitle}</th>
                  </tr></thead>
                  <tbody>
                    ${(this.mixedTeams ?? []).map((item) => html`
                      <tr>
                        <td>${item.team}</td>
                        <td>${item.score}</td>
                      </tr>
                    `)}
                  </tbody>
                </table>
              </div>
            `
          : html``}
      </div>`;
  }

  static get properties() {
    return {
      title: {},
      topTeamsMen: {},
      topTeamsWomen: {},
      topTeamsMixed: {},
      mensTeams: {type: Object},
      womensTeams: {type: Object},
      mixedTeams: {type: Object},
      // style sheets & misc.
      javaComponentId: {},
      stylesDir: {},
      autoVersion: {},
      video: {},
      t: {type: Object},
    };
  }

  firstUpdated(_changedProperties) {
    super.firstUpdated(_changedProperties);
    document.body.setAttribute("theme", "dark");
  }

  activeClasses() {
    return "wrapper ";
  }

}

customElements.define(TopTeamsSinclair.is, TopTeamsSinclair);
