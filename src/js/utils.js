import dayjs from 'dayjs'
import advancedFormat from 'dayjs/plugin/advancedFormat'

dayjs.extend(advancedFormat);
//import 'dayjs/locale/et'
//dayjs.locale('et');

const utils = {
  /*
  TEXT
   */

  escapeHTML(text) {
    /** From lodash .escape() */
    const htmlEscapes = {
      '&': '&amp',
      '<': '&lt',
      '>': '&gt',
      '"': '&quot',
      "'": '&#39'
    };
    const reUnescapedHtml = /[&<>"']/g;
    const reHasUnescapedHtml = RegExp(reUnescapedHtml.source);

    return (text && reHasUnescapedHtml.test(text)) ? text.replace(reUnescapedHtml, (chr) => htmlEscapes[chr]) : text
  },

  textToHTML(text) {
    if (text) return this.escapeHTML(text).replace(/&#10;/g, "<br>").replace(/\n/g, "<br>");
  },

  /*
  DATETIME FORMATTING
   */

  time(date) {
    return dayjs(date).format("HH:mm");
  },

  dateTime(date) {
    return dayjs(date).format("MMM Do HH:mm");
  },

  year(date) {
    return dayjs(date).format('YYYY');
  },

  fullDate(date) {
    return dayjs(date).format('MMM Do YYYY');
  },

  fullDateTime(date) {
    return dayjs(date).format('MMM Do YYYY, HH:mm');
  },

  /**
   * Return only day and month if this year, return full date if not in current year
   *
   * @param date {Date|string|number} Date or date string or Unix timestamp
   * @returns {string}
   */
  fullDateAddOtherYear(date) {
    const dayjsDate = dayjs(date);
    return dayjsDate.format((dayjsDate.year() === dayjs().year()) ? 'MMM Do' : 'MMM Do YYYY');
  },

  weekdayDateTime(date) {
    return dayjs(date).format("dddd MMM Do");
  },

  /**
   * Return weekday, day and month if date is in current year, add year if not
   *
   * @param date {Date|string|number} Date or date string or Unix timestamp
   * @returns {string}
   */
  weekdayDateTimeAddOtherYear(date) {
    const dayjsDate = dayjs(date);
    return dayjsDate.format((dayjsDate.year() === dayjs().year()) ? 'dddd MMM Do' : 'dddd MMM Do YYYY');
  },

  debugDateTime() {
    const date = new Date();
    return `${date.getHours().toString().padStart(2, "0")}:${
                    date.getMinutes().toString().padStart(2, "0")}:${
                    date.getSeconds().toString().padStart(2, "0")}.${
                    date.getMilliseconds().toString().padStart(3, "0")}`;
  },

  /*
  DATETIME COMPARISONS
   */

  datesAreSameDay(dateA, dateB) {
    return dayjs(dateA).isSame(dateB, 'day')
  },
};


export default utils
