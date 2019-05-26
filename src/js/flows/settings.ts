// @ts-ignore
import autoBind from "auto-bind";
import { Vue } from "vue/types/vue";

import STORE from "@/js/store";
import UserProperty from "@/js/model/UserProperty";
import Connection from "@/js/flows/connection";
import Chats from "@/js/flows/chats";

class Settings {
  store: STORE;
  events: Vue;
  connection: Connection;
  chats: Chats;

  constructor(store: STORE, events: Vue) {
    this.store = store;
    this.events = events;

    autoBind(this);
  }

  getBooleanUserProp(property: BooleanUserProperty): boolean {
    const prop = this.store.flows.userProperties.d.find(userProperty => userProperty.name === property);
    if (prop) return prop.value;
    switch (property) {
      case "autoMarkAsRead":
      case "showWorkspaceSwitcher":
        return true;
      default:
        return false;
    }
  }

  setBooleanUserProperty(property: BooleanUserProperty, value: boolean): void {
    let prop = this.store.flows.userProperties.d.find(userProperty => userProperty.name === property)
      || {
        name: property,
        value: null,
        id: null,
      };
    prop.value = value;
    try {
      this.connection.message("/app/UserProperty.save", prop);
    } catch (error) {
      console.log(error);
      this.events.$emit("notify", `Error saving ${property}`);
    }
  }

  async getSettings(): Promise<void> {
    this.connection.subscribeUserTopic("UserProperty");
    await Promise.all([
      this.connection.findByUser("UserProperty"),
    ]);
  }

  parseSettings(settings: any[]) {
    const mapped = settings.map(Settings.mapProperty);

    const ids = mapped.map(property => property.id);
    this.store.flows.userProperties.d = this.store.flows.userProperties.d.filter(property => ids.indexOf(property.id) === -1);
    this.store.flows.userProperties.d = this.store.flows.userProperties.d.concat(mapped);
    this.store.flows.userProperties.v += 1;

    if (this.getBooleanUserProp("desktopNotifications") && Notification.permission === "default") {
      Notification.requestPermission();
    }

    if (this.store.currentChatId === null) {
      if (this.chats.recentChatIds.length) {
        this.store.currentChatId = this.chats.recentChatIds[0];
      }
    }
  }

  private static mapProperty(property: any): UserProperty {
    return {
      id: property.id,
      name: property.name,
      value: property.value,
    };
  }
}

export default Settings;

type BooleanUserProperty = ("autoMarkAsRead" | "desktopNotifications" | "showWorkspaceSwitcher" | "compactMode");
