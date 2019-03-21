import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';

dayjs.extend(advancedFormat);
//import 'dayjs/locale/et'
//dayjs.locale('et');

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
      '&': '&amp',
      '<': '&lt',
      '>': '&gt',
      '"': '&quot',
      "'": '&#39',
    };
    const reUnescapedHtml = /[&<>"']/g;
    const reHasUnescapedHtml = RegExp(reUnescapedHtml.source);

    return ( text && reHasUnescapedHtml.test(text) ) ? text.replace(reUnescapedHtml, (chr) => htmlEscapes[chr]) : text;
  },

  /**
   * @param text {string} Escaped HTML
   * @returns {string} Unescaped HTML
   */
  unEscapeHTML(text) {
    text = text.toString();
    const htmlUnEscapes = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&nbsp;': ' ',
    };
    const reEscapedHtml = /(&lt;|&gt;|&amp;|&nbsp;)/g;
    return text.replace(reEscapedHtml, (chr) => htmlUnEscapes[chr]);
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
   * @returns {string} Day, month and year
   */
  fullDate(date) {
    return dayjs(date).format('MMM Do YYYY');
  },

  /**
   * @param date {Date|string|number} Date or date string or Unix timestamp
   * @returns {string} Day, month, year and time
   */
  fullDateTime(date) {
    return dayjs(date).format('MMM Do YYYY, HH:mm');
  },

  /**
   * @param date {Date|string|number} Date or date string or Unix timestamp
   * @returns {string}  Day, month and time, add year if not in current year
   */
  dateTimeAddOtherYear(date) {
    const dayjsDate = dayjs(date);
    return dayjs(date).format(( dayjsDate.year() === dayjs().year() ) ? 'MMM Do, HH:mm' : 'MMM Do YYYY, HH:mm');
  },

  /**
   * @param date {Date|string|number} Date or date string or Unix timestamp
   * @returns {string} Only day and month if this year, return full date if not in current year
   */
  fullDateAddOtherYear(date) {
    const dayjsDate = dayjs(date);
    return dayjsDate.format(( dayjsDate.year() === dayjs().year() ) ? 'MMM Do' : 'MMM Do YYYY');
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
    return dayjsDate.format(( dayjsDate.year() === dayjs().year() ) ? 'dddd MMM Do' : 'dddd MMM Do YYYY');
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
    return dayjs(dateA).isSame(dateB, 'day');
  },

  /*
  IMAGES
   */

  createCanvas(width, height) {
    let canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
  },
};


export default utils;
