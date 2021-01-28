// @ts-ignore
import autoBind from "auto-bind";
import { Vue } from "vue/types/vue";

import Flows2 from "@/js/flows/main";
import STORE from "@/js/store";
// @ts-ignore
import { SUBDOMAIN } from "@/js/consts";

class Files {
  flows: Flows2;
  store: STORE;
  events: Vue;

  constructor(flows: Flows2) {
    this.flows = flows;
    this.store = flows.store;
    this.events = flows.events;

    autoBind(this);
  }

  uploadFile(formData: FormData, fileName: string, chatId: number, replyToId?: number): Promise<Response> {
    const token = this.flows.localstorage.getSessionToken();
    if (!token) {
      throw new Error("No token for uploading");
    }
    const file: any = formData.get("file");
    if (!file) {
      throw new Error("No file");
    }
    if (file.size > 5242880) {
      throw new Error("File too large, maximum 5MB");
    }

    formData.append("topicId", chatId.toString());
    formData.append("token", token);
    formData.append("text", fileName);
    if (replyToId) formData.append("referenceFromTopicItemId", replyToId.toString());

    return fetch(`https://${SUBDOMAIN}.contriber.com/storage/upload_file`, {
      method: "POST",
      body: formData,
    });
  }

  /**
   * url "/files/2019-02-02/..."
   */
  deleteFile(url: string): Promise<Response> {
    const token = this.flows.localstorage.getSessionToken();
    if (!token) {
      throw new Error("No token for deleting file");
    }
    const formData = new FormData();
    formData.append("token", token);
    formData.append("src", url);
    return fetch(`https://${SUBDOMAIN}.contriber.com/storage/delete_file_v2`, {
      method: "POST",
      body: formData,
    });
  }
}

export default Files;
