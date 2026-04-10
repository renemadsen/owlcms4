import { html, LitElement, css } from "lit";
/*******************************************************************************
 * Copyright (c) 2009-2023 Jean-François Lamy
 *
 * Licensed under the Non-Profit Open Software License version 3.0  ("NPOSL-3.0")
 * License text at https://opensource.org/licenses/NPOSL-3.0
 *******************************************************************************/

class TopTeams extends LitElement {
  static get is() {
    return "topteams-template";
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
      <div class="${this.activeClasses()}" style="${this.sizeOverride ?? ''} ${this.colorOverride ?? ''}">
        <div class="blockPositioningWrapper">
          <div class="header-bar" style="display: flex">
            <img src="local/logos/dvf-logo-white.png" style="height:42px;opacity:0.9;">
            <div class="event-title">${this.competitionName}</div>
            <div class="group-info">${this.groupDescription}</div>
            <div style="margin-left:auto;display:flex;align-items:center;gap:6px;">
              <span style="color:rgba(255,255,255,0.4);font-size:0.6em;text-transform:uppercase;letter-spacing:1px;">Powered by</span>
              <img src="local/logos/eleiko-logo-white.svg" style="height:30px;opacity:0.9;">
            </div>
          </div>
          <div class="waiting" style="${this.waitingStyles()}">
            <div>
              <div class="competitionName">${this.competitionName}</div>
              <br />
              <div class="nextGroup">${this.t?.WaitingNextGroup}</div>
            </div>
          </div>
          <div id="resultBoardDiv" class="${this.darkMode ?? "dark"}" style="${this.contentStyles()}">
            ${this.topTeamsWomen
              ? html`
                  <h2 class="fullName" id="fullNameDiv" .innerHTML="${this.topTeamsWomen ?? ''}" ></h2>
                  <table class="results" id="orderDiv" style$="">
                    <thead>
                      <tr>
                        <th class="club" .innerHTML="${this.t?.Team ?? ''}"></th>
                        <th class="medium" .innerHTML="${this.t?.Done ?? ''}"></th>
                        <th class="medium" .innerHTML="${this.t?.TeamSize ?? ''}"></th>
                        <th class="medium" .innerHTML="${this.t?.Points ?? ''}"></th>
                      </tr>
                    </thead>
                    ${(this.womensTeams ?? []).map(
                      (item) => html`
                        <tr>
                          <td class="club"><div>${item.team}</div></td>
                          <td class="medium"><div>${item.counted}</div></td>
                          <td class="medium"><div>${item.size}</div></td>
                          <td class="medium"><div>${item.points}</div></td>
                        </tr>
                      `
                    )}
                  </table>
                  <h4>&nbsp;</h4>
                `
              : html``}
            ${this.topTeamsMen
              ? html`
                  <h2 class="fullName" id="fullNameDiv" .innerHTML="${this.topTeamsMen ?? ''}"></h2>
                  <table class="results" id="orderDiv" style$="">
                    <thead>
                      <tr>
                        <th class="club" .innerHTML="${this.t?.Team ?? ''}"></th>
                        <th class="medium" .innerHTML="${this.t?.Done ?? ''}"></th>
                        <th class="medium" .innerHTML="${this.t?.TeamSize ?? ''}"></th>
                        <th class="medium" .innerHTML="${this.t?.Points ?? ''}"></th>
                      </tr>
                    </thead>
                    ${(this.mensTeams ?? []).map(
                      (item, index) => html`
                        <tr>
                          <td class="club"><div>${item.team}</div></td>
                          <td class="medium"><div>${item.counted}</div></td>
                          <td class="medium"><div>${item.size}</div></td>
                          <td class="medium"><div>${item.points}</div></td>
                        </tr>
                      `
                    )}
                  </table>
                  <h4>&nbsp;</h4>
                `
              : html``}
            ${this.topTeamsMixed
              ? html`
                  <h2 class="fullName" id="fullNameDiv" .innerHTML="${this.topTeamsMixed ?? ''}"></h2>
                  <table class="results" id="orderDiv" style$="">
                    <thead>
                      <tr>
                        <th class="club" .innerHTML="${this.t?.Team ?? ''}"></th>
                        <th class="medium" .innerHTML="${this.t?.Done ?? ''}"></th>
                        <th class="medium" .innerHTML="${this.t?.TeamSize ?? ''}"></th>
                        <th class="medium" .innerHTML="${this.t?.Points ?? ''}"></th>
                      </tr>
                    </thead>
                    ${(this.mixedTeams ?? []).map(
                      (item, index) => html`
                        <tr>
                          <td class="club"><div>${item.team}</div></td>
                          <td class="medium"><div>${item.counted}</div></td>
                          <td class="medium"><div>${item.size}</div></td>
                          <td class="medium"><div>${item.points}</div></td>
                        </tr>
                      `
                    )}
                  </table>
                `
              : html``}
          </div>
        </div>
      </div>`;
  }

  static get properties() {
    return {
      title: {},
      competitionName: {},
      groupDescription: {},
      topTeamsMen: {},
      topTeamsWomen: {},
      topTeamsMixed: {},
      mensTeams: {type: Object},
      womensTeams: {type: Object},
      mixedTeams: {type: Object},
      mode: {},
      darkMode: {},
      sizeOverride: {},
      colorOverride: {},
      // style sheets & misc.
      javaComponentId: {},
      stylesDir: {},
      autoVersion: {},
      video: {},
      t: {type: Object},
    };
  }

  constructor() {
    super();
    this.mode = "WAIT";
  }

  firstUpdated(_changedProperties) {
    super.firstUpdated(_changedProperties);
    document.body.setAttribute("theme", "dark");
  }

  activeClasses() {
    return "wrapper ";
  }

  _hasTeams() {
    const w = this.womensTeams;
    const m = this.mensTeams;
    const x = this.mixedTeams;
    return (Array.isArray(w) && w.length > 0)
      || (Array.isArray(m) && m.length > 0)
      || (Array.isArray(x) && x.length > 0);
  }

  waitingStyles() {
    return "display: " + (this._hasTeams() ? "none" : "grid");
  }

  contentStyles() {
    return (this._hasTeams() ? "" : "display: none");
  }

}

customElements.define(TopTeams.is, TopTeams);
