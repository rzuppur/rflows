<template lang="pug">
  mixin editorButton(command, tooltip, hasActive=true)

    button.button.is-small(
    :class=(hasActive ? "{ 'is-active': isActive."+command+" }" : "")
    @pointerdown.prevent
    @pointerup="commands."+command
    @keyup.enter="commands."+command
    v-tooltip.top="{ content: '"+tooltip+"', popperOptions: { modifiers: { preventOverflow: { escapeWithReference: true } } } }"
    )
      block

  .editor(v-if="editor")

    slide-in-out(:duration=".075")
      editor-menu-bar(v-if="showMenuBar" :editor="editor")
        .menubar(slot-scope="{ commands, isActive }")
          .buttons.has-addons

            +editorButton("bold()", "Bold")
              i.fas.fa-bold
            +editorButton("italic()", "Italic")
              i.fas.fa-italic
            +editorButton("underline()", "Underline")
              i.fas.fa-underline

            .button-spacer

            +editorButton("heading({ level: 1 })", "Heading 1")
              b H1
            +editorButton("heading({ level: 2 })", "Heading 2")
              b H2
            +editorButton("heading({ level: 3 })", "Heading 3")
              b H3

            .button-spacer

            //-+editorButton("blockquote()", "Quote")
              i.fas.fa-quote-right
            +editorButton("code()", "Inline code")
              i.fas.fa-code
            +editorButton("code_block()", "Code block")
              i.fas.fa-file-code

            //-.button-spacer

            //- TODO: table icons
              +editorButton("createTable({rowsCount: 2, colsCount: 2, withHeaderRow: false })", "Table", false)
                i.fas.fa-table
              template(v-if="isActive.table()")
                +editorButton("deleteTable()", "Delete table", false)
                  i.fas.fa-trash
                +editorButton("addColumnBefore()", "Add column before", false)
                  b +||
                +editorButton("addColumnAfter()", "Add column after", false)
                  b ||+
                +editorButton("deleteColumn()", "Delete column", false)
                  b |x|
                +editorButton("addRowBefore()", "Add row before", false)
                  b +==
                +editorButton("addRowAfter()", "Add row after", false)
                  b='==+'
                +editorButton("deleteRow()", "Delete row", false)
                  b='=x='

            .button-spacer

            +editorButton("undo()", "Undo", false)
              i.fas.fa-undo
            +editorButton("redo()", "Redo", false)
              i.fas.fa-redo

    editor-content(ref="editor"
    :editor="editor"
    :style="{ '--message-placeholder': '\"' + placeholder + '\"' }"
    @keydown.enter.shift.capture.native.exact.prevent.stop="$emit('submit')")

</template>

<script>
  import {Editor, EditorContent, EditorMenuBar, TextSelection} from 'tiptap'
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
  } from 'tiptap-extensions'
  import HardBreakModifierOnly from "@/js/tiptap/HardBreakModifierOnly";
  import Italic from "@/js/tiptap/Italic";
  import Bold from "@/js/tiptap/Bold";
  import SlideInOut from "@/components/UI/SlideInOut.vue";

  const extensions = [
    new Blockquote(),
    new BulletList(),
    new CodeBlock(),
    new HardBreakModifierOnly(),
    new Heading({levels: [1, 2, 3]}),
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
    new Placeholder({emptyClass: 'is-empty'}),
    new HorizontalRule(),
  ];
  const extensionsTextOnly = [
    new HardBreakModifierOnly(),
    new History(),
    new Placeholder({emptyClass: 'is-empty'}),
  ];

  export default {
    name: "Editor",
    components: { EditorContent, EditorMenuBar, SlideInOut },
    props: ["showButtons", "onlyText", "placeholder", "initEmpty"],
    data() {
      return {
        editor: null,
        multiline: false,
      }
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
              this.showButtons === 'ALWAYS'
          || (this.showButtons === 'MULTILINE' && this.multiline)
        );
      },
    },
    methods: {
      _initOrSetContent(content, focus) {
        if (!this.editor) {
          this.editor = new Editor({
            content: content,
            extensions: this.onlyText ? extensionsTextOnly : extensions,
            onInit: () => {
              if (focus) setTimeout(this.focus, 10);
              setTimeout(this.onUpdate, 10);
              setTimeout(this.cursorToEnd, 5);
            },
            onUpdate: () => {
              this.eventBus.$emit("messagesScrollUpdate");
              this.multiline = this.$refs.editor ? this.$refs.editor.$el.clientHeight > 40 : false;
              this.$emit("update");
            },
            onFocus: () => {
              this.$emit("focus");
            },
            onBlur: () => {
              this.$emit("blur");
            }
          });
        } else {
          this.editor.setContent(content);
          if (focus) setTimeout(this.focus, 10);
          setTimeout(() => {
            this.multiline = this.$refs.editor ? this.$refs.editor.$el.clientHeight > 40 : false;
            this.eventBus.$emit("messagesScrollUpdate");
            this.cursorToEnd();
          }, 5);
        }
      },
      empty() {
        this._initOrSetContent("", false);
      },
      setContent(text) {
        this._initOrSetContent(text, false);
      },
      setMessage(message) {
        const editorText = ["NOTE", "EMAIL"].indexOf(message.type) > -1
          ? this.flows.noteTextParse(message.text)
          : this.utils.textToHTML(message.text);
        this._initOrSetContent(editorText, true);
      },
      getHTML() {
        if (this.editor) return this.editor.getHTML();
      },
      focus() {
        if (this.editor) {
          this.editor.focus();
          this.eventBus.$emit("messagesScrollUpdate");
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
  }
</script>

<style lang="stylus" scoped>
  @import "~@/shared.styl"

  .menubar

    .buttons
      margin 0

    .button.is-active
      background lighten($color-light-blue-background, 2)
      color darken($color-light-blue, 10)
      border-color $color-light-blue

    .button-spacer
      width 10px

  .editor /deep/
    .ProseMirror
      min-height 36px
      max-height 60vh
      overflow-x hidden
      overflow-y auto
      padding 6px 6px 5px
      background #fff
      border-radius $border-radius
      border 1px solid $color-gray-border

    .ProseMirror-focused
      outline none
      border 1px solid $color-focus-blue
      box-shadow 0 0 0 2px alpha($color-focus-blue, 0.15)

    .ProseMirror-selectednode
      outline 1px solid $color-focus-blue
      box-shadow 0 0 0 3px alpha($color-focus-blue, 0.15)

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
