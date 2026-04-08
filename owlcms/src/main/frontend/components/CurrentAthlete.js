import { html, LitElement, css } from "lit";
/*******************************************************************************
 * Copyright (c) 2009-2023 Jean-François Lamy
 *
 * Licensed under the Non-Profit Open Software License version 3.0  ("NPOSL-3.0")
 * License text at https://opensource.org/licenses/NPOSL-3.0
 *******************************************************************************/

class CurrentAthlete extends LitElement {
  static get is() {
    return "currentathlete-template";
  }

  render() {
    return html`
      <link rel="stylesheet" type="text/css" .href="${"local/" + (this.stylesDir ?? "") + "/colors" + (this.autoversion ?? "")}.css"/>
      <link rel="stylesheet" type="text/css" .href="${"local/" + (this.stylesDir ?? "") + "/currentathlete" + (this.autoversion ?? "")}.css"/>

      <div class="${this.wrapperClasses()}" style="${this.colorOverride}">
        <div class="waiting" style="${this.waitingStyles()}">
          <!-- div class="competitionName">[[competitionName]]</div><br -->
          <div class="nextGroup">${this.t?.WaitingNextGroup}</div>
        </div>

        <div class="lowerThird" style="${this.attemptBarStyles()}">
          <div class="lt-label" style="${this.startNumberStyles()}">Vægtløftning</div>
          <div class="lt-bar">
            <div class="startNumber" style="${this.startNumberStyles()}"><span>${this.startNumber}</span> </div>
            <div class="fullName lt-name ellipsis" style="${this.fullNameStyles()}" .innerHTML="${this.fullName}"></div>
            <div class="clubName lt-details ellipsis" style="${this.teamNameStyles()}"><div class="clubNameEllipsis">${this.teamName}</div></div>
            <div class="lt-weight" style="${this.weightStyles()}">
              <div class="attempt lt-attempt" style="${this.attemptStyles()}"><span .innerHTML="${this.attempt}"></span></div>
              <div class="weight lt-kg">
                <span >${this.weight}<span style="font-size: 75%" >&nbsp;${this.t?.KgSymbol}</span></span>
              </div>
            </div>
            <div class="timer athleteTimer" style="${this.athleteTimerStyles()}">
              <timer-element id="timer"></timer-element>
            </div>
            <div class="timer breakTime" style="${this.breakTimerStyles()}">
              <timer-element id="breakTimer"></timer-element>
            </div>
            <div class="decisionBox" style="${this.decisionStyles()}">
              <decision-element id="decisions" style="padding:1ex"></decision-element>
            </div>
          </div>
          <div class="lt-attempts" style="${this.attemptStyles()}">
            ${(this.athletes ?? []).map(
              (item) => html`
                ${!item.isSpacer
                  ? html`
                    <div class="lt-attempts-row">
                      <span class="lt-att-group">
                        <span class="lt-att-label" .innerHTML="${this.t?.Snatch}"></span><span class="lt-att-colon">:</span>
                        ${(item.sattempts ?? []).map(
                          (attempt) => html`<span class="lt-att-val ${(attempt.liftStatus ?? "") + " " + (attempt.className ?? "")}">${attempt.stringValue}</span>`
                        )}
                      </span>
                      <span class="lt-att-group">
                        <span class="lt-att-label" .innerHTML="${this.t?.Clean_and_Jerk}"></span><span class="lt-att-colon">:</span>
                        ${(item.cattempts ?? []).map(
                          (attempt) => html`<span class="lt-att-val ${(attempt.liftStatus ?? "") + " " + (attempt.className ?? "")}">${attempt.stringValue}</span>`
                        )}
                      </span>
                      <span class="lt-att-total" style="${this.decisionHiddenStyles()}">
                        <span class="lt-att-label" .innerHTML="${this.t?.Total}"></span><span class="lt-att-colon">:</span>
                        <span class="lt-att-val">${item.total}</span>
                      </span>
                    </div>
                  `
                  : html``}
              `)}
          </div>
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
      platformName: {},

      // mode (mutually exclusive, one of:
      // WAIT INTRO_COUNTDOWN LIFT_COUNTDOWN CURRENT_ATHLETE INTERRUPTION SESSION_DONE CEREMONY
      mode: {},
      decisionVisible: { type: Boolean }, // sub-mode of CURRENT_ATHLETE

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

  wrapperClasses() {
    var classes = "wrapper";
    classes = classes + (this.platformName ? " " + this.platformName : "");
    classes = classes + (this.darkMode ? " " + this.darkMode : "");
    classes = classes + (this.teamWidthClass ? " " + this.teamWidthClass : "");
    classes = classes + ((this.mode === "WAIT") ? " bigTitle" : "");
    return classes;
  }

  waitingStyles() { /* originally flex */
    return "display: " + ((this.mode === "WAIT")  ? "grid" : "none");
  }

  attemptBarStyles() {
    return "display: " + ((this.mode === "WAIT") ? "none" : "flex");
  }

  fullNameStyles() {
    return  "display: " + ((this.mode === "WAIT") ? "none" : "block");
  }

  teamNameStyles() {
    return "display: " + ((this.isBreak()) ? "none" : "block");
  }

  attemptStyles() {
    return "display: block; visibility: " + ((this.isBreak()) ? "; visibility: hidden" : "");
  }

  startNumberStyles() {
    return "display: " + (this.isBreak() ? "none" : "block");
  }

  weightStyles() {
    // weights are visible during lift countdowns
    return "display: " + ((this.mode === "LIFT_COUNTDOWN" || this.mode === "LIFT_COUNTDOWN_CEREMONY" || (this.mode === "CURRENT_ATHLETE")) ? "flex" : "none");
  }

  athleteTimerStyles() {
   return "display: " + (this.isBreak() ? "none" : "block");
  }

  breakTimerStyles() {
    return "display:" + ((this.mode === "INTRO_COUNTDOWN" || this.mode === "LIFT_COUNTDOWN" || this.mode === "LIFT_COUNTDOWN_CEREMONY") ? "block" : "none");
  }

  decisionStyles() {
    return "display: " + ((this.mode === "CURRENT_ATHLETE" && this.decisionVisible) ? "block" : "none");
  }

  decisionHiddenStyles() {
    return "visibility: " + ((this.mode === "CURRENT_ATHLETE" && this.decisionVisible) ? "hidden" : "");
  }

  isBreak() {
    return this.mode === "INTERRUPTION" || this.mode === "INTRO_COUNTDOWN" || this.mode === "LIFT_COUNTDOWN" || this.mode === "CEREMONY" || this.mode === "SESSION_DONE"
  }

  isCountdown() {
    return  this.mode === "INTRO_COUNTDOWN" || this.mode === "LIFT_COUNTDOWN"
  }

  constructor() {
    super();
    this.mode = "WAIT";
  }

  firstUpdated(_changedProperties) {
    console.debug("ready");
    super.firstUpdated(_changedProperties);
    document.body.setAttribute("theme", "dark");
  }

}

customElements.define(CurrentAthlete.is, CurrentAthlete);
