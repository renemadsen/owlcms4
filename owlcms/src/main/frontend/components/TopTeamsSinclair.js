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
     <div id="resultBoardDiv" class="${this.activeClasses()}">
       <div class="video" style="${this.videoHeaderStyles()}">
         <div class="eventlogo"></div>
         <div class="videoheader">
           <div class="groupName">${this.competitionName}</div>
           <div>${this.groupDescription}</div>
         </div>
         <div class="federationlogo"></div>
       </div>
        ${this.topTeamsWomen
          ? html`
              <h2 class="fullName" id="fullNameDivWomen" .innerHTML="${this.topTeamsWomen}" ></h2>
              <table class="results" id="orderDiv" style$="">
                <thead>
                  <tr>
                    <th class="club" .innerHTML="${this.t?.Team}"></th>
                    <th class="medium" .innerHTML="${this.t?.ScoringTitle}" ></th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="spacer" style="grid-column: 1 / -1; justify-content: left;" innerHTML="-" ></td>
                  </tr>
                  ${(this.womensTeams ?? []).map(
                    (item) => html`
                      <tr class="athlete">
                        <td class="club"><div>${item.team}</div></td>
                        <td class="medium"><div>${item.score}</div></td>
                      </tr>
                    `
                  )}
                </tbody>
              </table>
            `
          : html``}
        ${this.topTeamsMen 
          ? html` 
              <h2 class="fullName" id="fullNameDivMen" .innerHTML="${this.topTeamsMen}"></h2>
              <table class="results" id="orderDiv" style$="">
                <thead>
                  <tr>
                    <th class="club" .innerHTML="${this.t?.Team}"></th>
                    <th class="medium" .innerHTML="${this.t?.ScoringTitle}"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="spacer" style="grid-column: 1 / -1; justify-content: left;" innerHTML="-" ></td>
                  </tr>
                  ${(this.mensTeams ?? []).map(
                    (item) => html`
                      <tr class="athlete">
                        <td class="club"><div>${item.team}</div></td>
                        <td class="medium"><div>${item.score}</div></td>
                      </tr>
                    `
                  )}
                </tbody>
              </table>
              <h2>&nbsp;</h2>
            `
          : html``}
      </div>`;
  }

  static get properties() {
    return {
      title: {},
      topTeamsMen: {},
      topTeamsWomen: {},
      mensTeams: {type: Object},
      womensTeams: {type: Object},
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

  videoHeaderStyles() {
      return "display: " + ((this.mode !== "WAIT" && this.video)? "flex" : "none");
    }


}

customElements.define(TopTeamsSinclair.is, TopTeamsSinclair);
