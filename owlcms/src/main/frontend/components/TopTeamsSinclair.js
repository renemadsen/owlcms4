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
        ${(this.womensTeams && this.womensTeams.length > 0) ? html`
        <div class="team-board">
          <div class="tb-header">
            <div class="tb-title">Hold Resultater &ndash; Kvinder</div>
            <div class="tb-cat">Top ${this.t?.ScoringTitle || 'Sinclair'}</div>
          </div>
          <table class="team-table">
            <thead><tr>
              <th style="text-align:left">Hold</th>
              <th>Deltagere</th>
              <th>Bedste ${this.t?.ScoringTitle || 'Sinclair'}</th>
              <th>Total ${this.t?.ScoringTitle || 'Sinclair'}</th>
            </tr></thead>
            <tbody>
              ${(this.womensTeams ?? []).map((item) => html`
                <tr>
                  <td>${item.team}</td>
                  <td>${item.counted}</td>
                  <td>${item.score}</td>
                  <td>${item.points || item.score}</td>
                </tr>
              `)}
            </tbody>
          </table>
        </div>
        ` : html``}
        ${(this.mensTeams && this.mensTeams.length > 0) ? html`
        <div class="team-board">
          <div class="tb-header">
            <div class="tb-title">Hold Resultater &ndash; M&aelig;nd</div>
            <div class="tb-cat">Top ${this.t?.ScoringTitle || 'Sinclair'}</div>
          </div>
          <table class="team-table">
            <thead><tr>
              <th style="text-align:left">Hold</th>
              <th>Deltagere</th>
              <th>Bedste ${this.t?.ScoringTitle || 'Sinclair'}</th>
              <th>Total ${this.t?.ScoringTitle || 'Sinclair'}</th>
            </tr></thead>
            <tbody>
              ${(this.mensTeams ?? []).map((item) => html`
                <tr>
                  <td>${item.team}</td>
                  <td>${item.counted}</td>
                  <td>${item.score}</td>
                  <td>${item.points || item.score}</td>
                </tr>
              `)}
            </tbody>
          </table>
        </div>
        ` : html``}
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
