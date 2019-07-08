import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";

dayjs.extend(advancedFormat);
// import 'dayjs/locale/et'
// dayjs.locale('et');

const utils = {
  /*
  TEXT
   */

  /**
   * @param text {string} Unescaped HTML
   * @returns {string} Escaped HTML
   */
  escapeHTML(text) {
    // From lodash .escape()
    const htmlEscapes = {
      "&": "&amp",
      "<": "&lt",
      ">": "&gt",
      "\"": "&quot",
      "'": "&#39",
    };
    const reUnescapedHtml = /[&<>"']/g;
    const reHasUnescapedHtml = RegExp(reUnescapedHtml.source);

    return ( text && reHasUnescapedHtml.test(text) ) ? text.replace(reUnescapedHtml, chr => htmlEscapes[chr]) : text;
  },

  /**
   * @param text {string} Escaped HTML
   * @returns {string} Unescaped HTML
   */
  unEscapeHTML(text) {
    text = text.toString();
    const htmlUnEscapes = {
      "&amp;": "&",
      "&lt;": "<",
      "&gt;": ">",
      "&nbsp;": " ",
    };
    const reEscapedHtml = /(&lt;|&gt;|&amp;|&nbsp;)/g;
    return text.replace(reEscapedHtml, chr => htmlUnEscapes[chr]);
  },

  /**
   * @param text {string} Unescaped text
   * @returns {string} Escape HTML characters, replace newlines with <br>
   */
  textToHTML(text) {
    if (text) return this.escapeHTML(text).replace(/&#10;/g, "<br>").replace(/\n/g, "<br>");
  },

  /**
   * @param text {string}
   * @returns {boolean}
   */
  editorTextNotEmpty(text) {
    return text.replace(/<p>|<\/p>|<br>|<br\/>/g, "").trim() !== "";
  },

  /*
  DATE & TIME
   */

  /**
   * @param date {Date|string|number} Date or date string or Unix timestamp
   * @returns {dayjs}
   */
  dayjsDate(date) {
    return dayjs(date);
  },

  /**
   * @param date {Date|string|number} Date or date string or Unix timestamp
   * @returns {string} Time
   */
  time(date) {
    return dayjs(date).format("HH:mm");
  },

  /**
   * @param date {Date|string|number} Date or date string or Unix timestamp
   * @returns {string} Day, month and time
   */
  dateTime(date) {
    return dayjs(date).format("MMM Do, HH:mm");
  },

  /**
   * @param date {Date|string|number} Date or date string or Unix timestamp
   * @returns {string} Day and month
   */
  shortDate(date) {
    return dayjs(date).format("MMM Do");
  },

  /**
   * @param date {Date|string|number} Date or date string or Unix timestamp
   * @returns {string} Day, month and year
   */
  fullDate(date) {
    return dayjs(date).format("MMM Do YYYY");
  },

  /**
   * @param date {Date|string|number} Date or date string or Unix timestamp
   * @returns {string} Day, month, year and time
   */
  fullDateTime(date) {
    return dayjs(date).format("MMM Do YYYY, HH:mm");
  },

  /**
   * @param date {Date|string|number} Date or date string or Unix timestamp
   * @returns {string}  Day, month and time, add year if not in current year
   */
  dateTimeAddOtherYear(date) {
    const dayjsDate = dayjs(date);
    return dayjs(date).format(( dayjsDate.year() === dayjs().year() ) ? "MMM Do, HH:mm" : "MMM Do YYYY, HH:mm");
  },

  /**
   * @param date {Date|string|number} Date or date string or Unix timestamp
   * @returns {string} Only day and month if this year, return full date if not in current year
   */
  fullDateAddOtherYear(date) {
    const dayjsDate = dayjs(date);
    return dayjsDate.format(( dayjsDate.year() === dayjs().year() ) ? "MMM Do" : "MMM Do YYYY");
  },

  /**
   * @param date {Date|string|number} Date or date string or Unix timestamp
   * @returns {string} Weekday, day and month
   */
  weekdayDate(date) {
    return dayjs(date).format("dddd MMM Do");
  },

  /**
   * @param date {Date|string|number} Date or date string or Unix timestamp
   * @returns {string} Weekday, day and month, add year if not in current year
   */
  weekdayDateAddOtherYear(date) {
    const dayjsDate = dayjs(date);
    return dayjsDate.format(( dayjsDate.year() === dayjs().year() ) ? "dddd, MMM Do" : "dddd, MMM Do YYYY");
  },

  /**
   * @returns {string}
   */
  debugDateTime() {
    const date = new Date();
    return `${date.getHours().toString().padStart(2, "0")}:${
      date.getMinutes().toString().padStart(2, "0")}:${
      date.getSeconds().toString().padStart(2, "0")}.${
      date.getMilliseconds().toString().padStart(3, "0")}`;
  },

  /**
   * @param dateA {Date|string|number} Date or date string or Unix timestamp
   * @param dateB {Date|string|number} Date or date string or Unix timestamp
   * @returns {boolean} Dates are on the same day
   */
  datesAreSameDay(dateA, dateB) {
    return dayjs(dateA).isSame(dateB, "day");
  },

  /*
  IMAGES
   */

  createCanvas(width, height) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
  },

  /**
   * @param letter {string}
   * @returns {string} data:image/svg
   */
  logoPlaceholder(letter) {
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' height='42' width='42' style='background: %23b0b8c0'%3E%3Ctext text-anchor='middle' x='50%25' y='50%25' dy='0.35em' fill='white' font-size='25' font-family='sans-serif'%3E${letter}%3C/text%3E%3C/svg%3E`;
  },

  /*
  MESSAGE
   */

  commitEmailParse(text) {
    const parts = text.split("Commit: ");
    parts.splice(0, 1);

    const commits = [];
    parts.forEach((commitPart) => {
      commits.push({
        url: commitPart.split(" ").filter(part => part)[1],
        name: commitPart.split("-----------").filter(part => part)[1].split("Compare: ")[0].trim(),
        changes: commitPart.split("Changed paths:").filter(part => part)[1].split("Log Message:")[0].trim().split("\n").map(change => change.trim()),
        author: commitPart.split("Author: ").filter(part => part)[1].split("Date:")[0].trim(),
      });
    });

    return commits;
  },

  commitEmailBranch(text) {
    return text.split("Branch: ").filter(part => part.trim())[0].split(" ")[0].trim();
  },


  fileMessagePreviewable(message) {
    if (!message.url) return false;
    if (message.originalFileName === "mime") return true;
    let ext = message.url.split(".");
    ext = ext[ext.length - 1];
    return ["png", "jpg", "gif", "jpeg", "svg"].indexOf(ext.toLowerCase()) >= 0;
  },

  getEmailText(text) {
    text = text.replace(/(<img.*?(?:src=)["']?)((?:.(?!["']?\\s+(?:\S+)=|[>"']))+.)(["']?[^>]*>)/g, `<img src='${window.location.origin}/img_placeholder.svg' width=40 title='Image removed - RFlows'>`);
    if (text.includes("<head>")) {
      return text.replace("<head>", "<head><base href=\"https://flows.contriber.com\"><style>body { font-family: sans-serif; }</style>");
    }
    return `<html><head><base href="https://flows.contriber.com"><style>body { font-family: sans-serif; }</style></head><body>${text}</body></html>`;
  },
};


export default utils;
