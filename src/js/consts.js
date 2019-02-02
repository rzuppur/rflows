export const SOCKET_URL = "https://app1.contriber.com/client";
export const FILE_UPLOAD_URL = "https://app1.contriber.com/storage/upload_file";
export const FILE_UPLOAD_BASE_64_URL = "https://app1.contriber.com/storage/upload_file_base64_v2";
/* TODO:
token: [...]
image: data:image/png;base64,iVBORw0SU [...]
 */
export const AVATAR_UPLOAD_BASE_64_URL = "https://app1.contriber.com/storage/upload_avatar_base64";
/*
token: [...]
image: data:image/jpeg;base64,/9j/4AAQ [...]
 */
export const FILE_DELETE_URL = "https://app1.contriber.com/storage/delete_file_v2";

export const GLOBAL_TOPICS = [
  "TopicUser",
  "UserProperty",
  "Topic",
  //"Project",
  //"Organization",
  //"TopicLocation",
  "User",
  //"OrganizationContact",
  //"UserAccess",
  //"TopicProperty"
  //"TopicItemDuration",
  //"UserMailbox",
  //"Calendar",
];

export const CHAT_TOPICS = [
  "TopicItem",
  "TopicItemUserProperty",
  //"Order",
  "TopicUser",
];

export const ALL_TOPICS = GLOBAL_TOPICS.concat(CHAT_TOPICS.concat(["TopicItemRead"]));

export const SCROLL_DEBOUNCE_TIME = 30;
export const RESIZE_DEBOUNCE_TIME = 150;

export const DEBUG = true;
export const SOCKET_TRAFFIC_DEBUG = false;
