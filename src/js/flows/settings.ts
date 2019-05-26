// @ts-ignore
import autoBind from "auto-bind";
import { Vue } from "vue/types/vue";

import STORE from "@/js/store";
import UserProperty from "@/js/model/UserProperty";
import Connection from "@/js/flows/connection";

class Settings {
  store: STORE;
  events: Vue;
  connection: Connection;

  constructor(store: STORE, events: Vue) {
    this.store = store;
    this.events = events;

    autoBind(this);
  }

  getBooleanUserProp(property: ("autoMarkAsRead" | "desktopNotifications" | "showWorkspaceSwitcher" | "compactMode")): boolean {
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

  async getSettings(): Promise<void> {
    this.connection.subscribeUserTopic("UserProperty");
    await Promise.all([
      this.connection.findByUser("UserProperty"),
    ]);
  }

  parseSettings(settings: any[]) {
    const mapped = settings.map(Settings.mapProperty);
    console.log(mapped);

    const ids = mapped.map(property => property.id);
    this.store.flows.userProperties.d = this.store.flows.userProperties.d.filter(property => ids.indexOf(property.id) === -1);
    this.store.flows.userProperties.d = this.store.flows.userProperties.d.concat(mapped);
    this.store.flows.userProperties.v += 1;
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
