// @ts-ignore
import autoBind from "auto-bind";
import Vue from "vue";

import Flows2 from "@/js/flows/main";
import STORE from "@/js/store";
import utils from "@/js/flows/utils";

class Messages {
  flows: Flows2;
  store: STORE;
  events: Vue;

  constructor(flows: Flows2) {
    this.flows = flows;
    this.store = flows.store;
    this.events = flows.events;

    autoBind(this);
  }

  public chatTextParse(text: string) {
    if (!text) return "";
    const { currentUser } = this.store;
    const firstName = currentUser ? currentUser.firstName : "";
    const lastName = currentUser ? currentUser.lastName : "";
    const emojis: { [index: string]: string } = {
      ":)": "🙂",
      ";)": "😉",
      ":d": "😁",
      ":\\": "😕",
      ":/": "😕",
      ":(": "😟",
      "(y)": "👍",
      "(n)": "👎",
    };
    const splitText = text.match(/\S+|\s/g) || [];

    /* copied with modifications from compiled Contriber Flows source */
    const parsedText = [];
    const addText = (text_: string) => parsedText.push(utils.textToHTML(text_));
    for (let i = 0; i < splitText.length; i++) {
      const part = splitText[i];
      if (part === firstName || part === lastName || part[0] === "@" && ( part.substr(1) === firstName || part.substr(1) === lastName )) {
        parsedText.push("<span class=\"message-at\">");
        addText(part);
        parsedText.push("</span>");
      } else if (part.match(/^(ftp:\/\/|http:\/\/|https:\/\/|mailto:)(.*)/)) {
        parsedText.push("<a target=\"_blank\" rel=\"noopener noreferrer nofollow\" href=\"");
        addText(part.replace(/"/g, "&quot;"));
        parsedText.push("\">");
        addText(part);
        parsedText.push("</a>");
      } else if (part.match(/^(www.)(.*)/)) {
        parsedText.push("<a target=\"_blank\" rel=\"noopener noreferrer nofollow\" href=\"https://");
        addText(part.replace(/"/g, "&quot;"));
        parsedText.push("\">");
        addText(part);
        parsedText.push("</a>");
      } else if (emojis[part.toLowerCase()]) {
        parsedText.push(emojis[part.toLowerCase()]);
      } else {
        addText(part);
      }
    }
    return parsedText.join("");
  }

  public getMessageTextRepresentation = (messageText: string): string => messageText
  .replace(/<img .*?alt=[\"']?([^\"']*)[\"']?.*?\/?>/g, "$1")
  .replace(/<a .*?href=["']?([^"']*)["']?.*?>(.*)<\/a>/g, "$2")
  .replace(/<(\/p|\/div|\/h\d|br)\w?\/?>/g, "\n")
  .replace(/<[A-Za-z/][^<>]*>/g, "")
  .replace(/&quot/g, "\"");

  public noteTextParse = (text: string): string => text
  .replace(/src=['"]\/files\/*([^'"]+)['"]/g, "src=\"https://flows.contriber.com/files/$1\"")
  .replace(/<a[^<]+href=['"]*([^'"]+)['"][^>]*>/g, "<a target=\"_blank\" rel=\"noopener noreferrer nofollow\" href=\"$1\">")
  .replace(/<p><\/p>/g, "<br>");
}

export default Messages;
