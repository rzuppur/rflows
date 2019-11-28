<template lang="pug">

  mixin editorButton(command, tooltip, icon)
    r-button(
      small
      :gray="isActive."+command
      :action="() => { commands."+command+"; }"
      v-rtip="'"+tooltip+"'"
      icon=icon
    )
      block

  mixin editorButtonWithoutActive(command, tooltip, icon)
    r-button(
      small
      :action="() => { commands."+command+"; }"
      v-rtip="'"+tooltip+"'"
      icon=icon
    )
      block


  .editor(v-if="editor")

    slide-in-out(:inDuration="60" :outDuration="60")
      editor-menu-bar(v-if="showMenuBar" :editor="editor")
        .menubar(slot-scope="{ commands, isActive }")
          .buttons-grouped
            .button-group
              +editorButton("bold()", "Bold", "text bold")
              +editorButton("italic()", "Italic", "text italic")
              +editorButton("underline()", "Underline", "text underline")
            .button-group
              +editorButton("heading({ level: 1 })", "Heading 1", "text h1")
              +editorButton("heading({ level: 2 })", "Heading 2", "text h2")
              +editorButton("heading({ level: 3 })", "Heading 3", "text h3")
            .button-group
              +editorButton("blockquote()", "Quote", "text quote")
              +editorButton("code()", "Inline code", "text code")
              +editorButton("code_block()", "Code block", "text code block")
            .button-group
              +editorButtonWithoutActive("undo()", "Undo", "undo")
              +editorButtonWithoutActive("redo()", "Redo", "redo")

    editor-content(
      ref="editor"
      :editor="editor"
      :style="{ '--message-placeholder': '\"' + placeholder + '\"' }"
      @keydown.enter.shift.capture.native.exact.prevent.stop="$emit('submit')")

</template>

<script>
  import { Editor, EditorContent, EditorMenuBar, TextSelection } from "tiptap";
  import {
    Blockquote,
    CodeBlock,
    Heading,
    Image,
    OrderedList,
    BulletList,
    ListItem,
    Code,
    Underline,
    History,
    Table,
    TableHeader,
    TableCell,
    TableRow,
    Placeholder,
    HorizontalRule,
  } from "tiptap-extensions";
  import HardBreakModifierOnly from "@/js/tiptap/HardBreakModifierOnly";
  import Italic from "@/js/tiptap/Italic";
  import Bold from "@/js/tiptap/Bold";
  import SlideInOut from "@/components/UI/SlideInOut.vue";

  const extensions = [
    new Blockquote(),
    new BulletList(),
    new CodeBlock(),
    new HardBreakModifierOnly(),
    new Heading({ levels: [1, 2, 3] }),
    new Image(),
    new ListItem(),
    new OrderedList(),
    new Bold(),
    new Code(),
    new Italic(),
    new Underline(),
    new History(),
    new Table(),
    new TableHeader(),
    new TableCell(),
    new TableRow(),
    new Placeholder({ emptyClass: "is-empty" }),
    new HorizontalRule(),
  ];
  const extensionsTextOnly = [
    new HardBreakModifierOnly(),
    new History(),
    new Placeholder({ emptyClass: "is-empty" }),
  ];

  export default {
    name: "Editor",
    components: { EditorContent, EditorMenuBar, SlideInOut },
    props: ["showButtons", "onlyText", "placeholder", "initEmpty"],
    data() {
      return {
        editor: null,
        multiline: false,
      };
    },
    mounted() {
      if (this.initEmpty) this.empty();
    },
    beforeDestroy() {
      if (this.editor) this.editor.destroy();
    },
    computed: {
      showMenuBar() {
        return !this.onlyText && (
          this.showButtons === "ALWAYS"
          || (this.showButtons === "MULTILINE" && this.multiline)
        );
      },
    },
    methods: {
      _initOrSetContent(content, focus) {
        if (!this.editor) {
          this.editor = new Editor({
            content,
            extensions: this.onlyText ? extensionsTextOnly : extensions,
            onInit: () => {
              if (focus) setTimeout(this.focus, 10);
              setTimeout(this.onUpdate, 10);
              setTimeout(this.cursorToEnd, 5);
            },
            onUpdate: () => {
              this.multiline = this.$refs.editor ? this.$refs.editor.$el.clientHeight > 40 : false;
              this.$emit("update", this.editor ? this.editor.getHTML() : "");
            },
            onFocus: () => {
              this.$emit("focus");
            },
            onBlur: () => {
              this.$emit("blur");
            },
          });
        } else {
          this.editor.setContent(content);
          if (focus) setTimeout(this.focus, 10);
          setTimeout(() => {
            this.multiline = this.$refs.editor ? this.$refs.editor.$el.clientHeight > 40 : false;
            this.cursorToEnd();
          }, 5);
        }
      },
      empty() {
        this._initOrSetContent("", false);
        setTimeout(() => { this.$emit("update", ""); }, 0);
      },
      setContent(text) {
        this._initOrSetContent(text, false);
      },
      setMessage(message) {
        const editorText = ["NOTE", "EMAIL"].indexOf(message.type) > -1
          ? this.$flows.messages.noteTextParse(message.text)
          : this.utils.textToHTML(message.text);
        this._initOrSetContent(editorText, true);
      },
      getHTML() {
        if (this.editor) return this.editor.getHTML();
        return false;
      },
      focus() {
        if (this.editor) {
          this.editor.focus();
        }
      },
      cursorToEnd() {
        if (this.editor) {
          const selection = new TextSelection(this.editor.state.doc.resolve(this.editor.state.tr.doc.content.size - 1));
          const transaction = this.editor.state.tr;
          transaction.setSelection(selection);
          this.editor.view.dispatch(transaction);
        }
      },
    },
  };
</script>

<style lang="stylus" scoped>
  @import "~@/shared.styl"
  @import "../../../node_modules/@rzuppur/rvc/src/styles/shared.styl"

  .menubar
    //margin-left -46px

    .buttons-grouped
      margin-bottom 0

  .editor /deep/
    .ProseMirror
      control()
      control-fullwidth()
      align-items flex-start
      justify-content flex-start
      height auto
      min-height 40px
      max-height 60vh
      overflow-x hidden
      overflow-y auto
      padding-top 8px
      padding-bottom 8px

    p.is-empty:first-child
      white-space nowrap
      text-overflow ellipsis

      &::before
        content var(--message-placeholder)
        float left
        color $color-gray-text-light
        pointer-events none
        height 0

      code
        background #fff

      code::after
        content var(--message-placeholder)
        color $color-gray-text-light

</style>
