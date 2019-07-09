import { computed } from "vue-function-api";

function starred(props, context) {
  const chatId = computed(() => context.root.$store.currentChatId);

  const isStarred = computed(() => {
    context.root.$store.flows.userProperties.v;

    return context.root.$flows.chats.favChatIds.includes(chatId.value);
  });

  const toggleFavourite = () => {
    if (isStarred.value) {
      context.root.$flows.chats.favChatIds = context.root.$flows.chats.favChatIds.filter(favId => favId !== chatId.value);
      return;
    }
    context.root.$flows.chats.favChatIds = context.root.$flows.chats.favChatIds.concat([chatId.value]);
  };

  return {
    isStarred,
    toggleFavourite,
  };
}

export default starred;
