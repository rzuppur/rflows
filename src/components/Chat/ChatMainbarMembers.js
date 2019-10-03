import { computed } from "@vue/composition-api";

function members(props, context) {
  const chatId = computed(() => context.root.$store.currentChatId);

  const chatMembers = computed(() => {
    context.root.$store.flows.chatUsers.v;
    context.root.$store.flows.users.v;

    return context.root.$store.flows.chatUsers.d.filter(chatUser => chatUser.chatId === chatId.value).map((chatUser) => {
      const user = context.root.$store.flows.users.d.find(user_ => user_.id === chatUser.userId);
      if (!user) {
        return {
          ...chatUser,
          name: "",
          avatar: context.root.$flows.utils.getAvatarFromUser(),
          userStatus: "?",
        };
      }
      return {
        ...chatUser,
        name: context.root.$flows.utils.getFullNameFromUser(user),
        avatar: context.root.$flows.utils.getAvatarFromUser(user),
        userStatus: user.status,
      };
    }).sort((a, b) => a.id - b.id);
  });

  const chatMembersWriting = computed(() => {
    return chatMembers.value.filter(chatMember => chatMember.status === "TYPING").map((user) => {
      return {
        avatar: user.avatar,
        name: user.name,
        userId: user.userId,
      };
    });
  });

  return {
    chatMembers,
    chatMembersWriting,
  };
}

export default members;
