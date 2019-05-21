import { oc } from "ts-optchain";
import User from "@/js/model/User";

const utils = {
  relativeToFullPath(url: string): string {
    return `https://flows.contriber.com${encodeURI(url)}`;
  },

  getAvatarFromUser(user: User): string {
    if (oc(user).avatarUrl()) {
      return this.relativeToFullPath(user.avatarUrl);
    }
    const char = oc(user).firstName("?").charAt(0);
    return this.placeholderImageChar(char, 42, 56);
  },

  placeholderImageChar(
    char: string = "?",
    width: number = 42,
    height: number = 42,
    fontSize: number = 25,
    background: string = "b0b8c0",
  ): string {
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' height='${height}' width='${width}' style='background: %23${background}'%3E%3Ctext text-anchor='middle' x='50%25' y='50%25' dy='0.35em' fill='white' font-size='${fontSize}' font-family='sans-serif'%3E${char}%3C/text%3E%3C/svg%3E`;
  },
};

export default utils;
