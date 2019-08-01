// @ts-ignore
import autoBind from "auto-bind";
import { Vue } from "vue/types/vue";

import Flows2 from "@/js/flows/main";
import STORE from "@/js/store";
import Message from "@/js/model/Message";

class Notifications {
  flows: Flows2;
  store: STORE;
  events: Vue;

  constructor(flows: Flows2) {
    this.flows = flows;
    this.store = flows.store;
    this.events = flows.events;

    autoBind(this);
  }

  public messageNotification(message: Message) {
    if (!this.flows.settings.getBooleanUserProp("desktopNotifications")) return;
    const lastNotifiedMessageId = this.flows.settings.getNumberUserProp("lastNotifiedMessageId");
    if (message.id <= lastNotifiedMessageId) return;

    if (lastNotifiedMessageId === 0) {
      // For first time users to avoid getting old notifs
      this.flows.settings.setNumberUserProp("lastNotifiedMessageId", message.id);
      return;
    }

    const hidden = !document.hasFocus();

    if (hidden || message.chatId !== this.store.currentChatId) {
      this.flows.settings.setNumberUserProp("lastNotifiedMessageId", message.id);
      const chatName = this.flows.chats.getChatName(message.chatId);
      const creatorName = this.flows.users.getUserName(message.userId);
      const title = creatorName + (chatName !== creatorName ? ` - ${chatName}` : "");
      const options: NotificationOptions = {
        body: message.type === "CHAT"
          ? this.flows.messages.getMessageTextRepresentation(this.flows.messages.chatTextParse(message.text))
          : this.flows.messages.getMessageTextRepresentation(message.text),
        timestamp: message.createDate,
        renotify: true,
        tag: `${message.chatId}-${this.store.currentUser && this.store.currentUser.id}`,
        // requireInteraction: true,
        // actions: [{action: "mark_as_read", title: "Mark as read" }],
      };

      let notification: Notification;
      const onclick = (event: Event) => {
        event.preventDefault();
        window.focus();
        if (this.store.currentChatId !== message.chatId) {
          this.store.currentChatId = message.chatId;
        } else {
          this.events.$emit("scrollToMessage", message.id);
        }
      };

      if (message.type === "FILE" && message.url) {
        let ext: any = message.url.split(".");
        ext = `${ext[ext.length - 1]}`;
        if (["png", "jpg", "jpeg"].indexOf(ext.toLowerCase()) > -1) {
          options.image = this.flows.utils.relativeToFullPath(message.url);
        }
      }

      const avatar = this.flows.users.getUserAvatar(message.userId);

      if (avatar.indexOf("data:") === 0) {
        // For svg placeholder avatars, draw them to canvas to get a bitmap
        const canvas = this.flows.utils.createCanvas(42 * 3, 42 * 3);
        const ctx = canvas.getContext("2d");
        const img = new Image();
        img.onload = () => {
          if (ctx) {
            ctx.drawImage(img, 0, (56 - 42) * -1.5, 42 * 3, 56 * 3);
            options.icon = canvas.toDataURL();
          }
          notification = new Notification(title, options);
          notification.onclick = onclick;
        };
        img.src = avatar;
      } else {
        // Otherwise just use the image
        options.icon = avatar;
        notification = new Notification(title, options);
        notification.onclick = onclick;
      }

      setTimeout(() => {
        notification.close();
      }, 30 * 1000);
    }
  }
}

export default Notifications;
