import { oc } from "ts-optchain";
import User from "@/js/model/User";
import Workspace from "@/js/model/Workspace";

const reUnescapedHtml = /[&<>"']/g;
const reHasUnescapedHtml = RegExp(reUnescapedHtml.source);

const utils = {
  relativeToFullPath(url: string): string {
    return `https://flows.contriber.com${encodeURI(url)}`;
  },

  getAvatarFromUser(user?: User): string {
    if (user && user.avatarUrl) {
      return this.relativeToFullPath(user.avatarUrl);
    }
    const char = oc(user).firstName("?").charAt(0);
    return this.placeholderImageChar(char, 42, 56);
  },

  getLogoFromWorkspace(workspace: Workspace): string {
    if (oc(workspace).logoUrl()) {
      return this.relativeToFullPath(workspace.logoUrl);
    }
    const char = oc(workspace).name("?").charAt(0);
    return this.placeholderImageChar(char, 42, 42);
  },

  placeholderImageChar(
    char: string = "?",
    width: number = 42,
    height: number = 42,
    fontSize: number = 25,
    background: string = "b0b8c0",
    color: string = "ffffff",
  ): string {
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' height='${height}' width='${width}' style='background: %23${background}'%3E%3Ctext text-anchor='middle' x='50%25' y='50%25' dy='0.35em' fill='%23${color}' font-size='${fontSize}' font-weight='500' font-family='Inter,"Inter UI",sans-serif'%3E${char}%3C/text%3E%3C/svg%3E`;
  },

  createCanvas(width: number, height: number): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
  },

  getFullNameFromUser(user?: User) {
    if (user) {
      if (user.firstName || user.lastName) return `${user.firstName || "?"} ${user.lastName || "?"}`;
      if (user.email) return user.email;
    }
    return "?";
  },

  getShortNameFromUser(user?: User) {
    if (user) {
      if (user.firstName || user.lastName) return `${user.firstName || "?"} ${user.lastName.charAt(0) + "." || "?"}`;
      if (user.email) return user.email;
    }
    return "?";
  },

  uniqueNonZeroNumberArray(array: any[]): number[] {
    return Array.from(new Set(array.map(x => +x).filter(Boolean)));
  },

  escapeHTML(text: string): string {
    // From lodash .escape()
    const htmlEscapes: { [index: string]: string } = {
      '&': '&amp',
      '<': '&lt',
      '>': '&gt',
      '"': '&quot',
      "'": '&#39',
    };

    return (text && reHasUnescapedHtml.test(text)) ? text.replace(reUnescapedHtml, (chr) => htmlEscapes[chr]) : text;
  },

  textToHTML(text: string): string {
    if (text) return this.escapeHTML(text).replace(/&#10;/g, "<br>").replace(/\n/g, "<br>");
    return "";
  },
};

export default utils;


export function performanceLog() {
  return (target: any, key: string, descriptor: PropertyDescriptor) => {
    //return descriptor;

    if (descriptor === undefined) {
      // @ts-ignore
      descriptor = Object.getOwnPropertyDescriptor(target, key);
    }

    const originalMethod = descriptor.value;
    descriptor.value = function (...args: any[]) {
      const startTime = window.performance.now();
      const result = originalMethod.apply(this, args); // Call the original method
      const endTime = window.performance.now();
      const timespan = endTime - startTime;
      const message = `%c${Math.round(timespan * 10) / 10}ms %c${key}(${args.length && key.startsWith("parse") && ("[" + args[0].length + "]") || ("" + args[0]).slice(0, 18)})`;
      const colors = ["color: #888", "color: #bbb"];
      if (timespan < 4) {
        console.log(message, ...colors);
      } else if (timespan < 10) {
        console.warn(message, ...colors);
      } else {
        console.error(message, ...colors);
      }
      return result;
    };

    return descriptor;
  };
}
