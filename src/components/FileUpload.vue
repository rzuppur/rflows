<template lang="pug">
  .file-upload

    img.image-preview(v-if="previewUrl" :src="previewUrl")

    form.field.is-grouped(
      enctype="multipart/form-data"
      novalidate
      @submit.prevent)

      .control.is-expanded(v-show="expanded")
        input.input(
          type="text"
          ref="fileName"
          v-model="fileName"
          placeholder="File name"
          @keydown.enter.prevent="upload")

      .control
        label.button.is-outlined(tabindex="0" for="fileInput" @keyup.enter="e => e.target.click()" v-tooltip="expanded ? 'Change file' :  'Upload file'")
          span.icon.is-small
            i.fas.fa-paperclip
        input#fileInput(
          type="file"
          name="file"
          ref="fileInput"
          :disabled="currentStatus === 'UPLOADING'"
          @change="_filesChange($event.target.files)"
          style="display: none")

      .control(v-if="expanded && formData")
        button.button(
          type="button"
          @click="_reset()") Cancel

      .control(v-show="expanded")
        button.button.is-primary(
          @click="upload()"
          :class="{ 'is-loading': currentStatus === 'UPLOADING' }") Upload

</template>

<script>
  export default {
    name: "FileUpload",
    props: ["chatId", "replyToId"],
    data() {
      return {
        fileName: "",
        formData: null,
        loginToken: null,
        uploadError: null,
        previewUrl: null,
        currentStatus: "INITIAL",
        expanded: false,
        dropping: false,
      };
    },
    watch: {
      expanded(val) {
        this.$emit("expandChange", val);
        this.eventBus.$emit("messagesScrollUpdate");
      },
      previewUrl() {
        this.eventBus.$emit("messagesScrollUpdate");
      },
      dropping(val, oldVal) {
        if (val !== oldVal) this.eventBus.$emit("dropOverlay", val);
      },
    },
    created() {
      window.addEventListener("paste", this._pasteFromClipboard);
      window.addEventListener("dragenter", this._startDrop, true);
      window.addEventListener("dragover", this._dragOver, true);
      window.addEventListener("dragleave", this._endDrop, true);
      window.addEventListener("drop", this._drop, true);
      this.dragCounter = 0;
    },
    mounted() {
      this.loginToken = this.flows.getLoginToken();
    },
    destroyed() {
      window.removeEventListener("paste", this._pasteFromClipboard);
      window.removeEventListener("dragenter", this._startDrop, true);
      window.removeEventListener("dragover", this._dragOver, true);
      window.removeEventListener("dragleave", this._endDrop, true);
      window.removeEventListener("drop", this._drop, true);

      this.$emit("expandChange", false);
    },
    methods: {
      _startDrop(event) {
        this.dragCounter += 1;
        if (event.dataTransfer.types.indexOf("Files") > -1) {
          event.preventDefault();
          event.stopPropagation();
          this.dropping = true;
        }
      },
      _dragOver(event) {
        if (event.dataTransfer.types.indexOf("Files") > -1) {
          event.preventDefault();
          event.stopPropagation();
          this.dropping = true;
        }
      },
      _endDrop(event) {
        this.dragCounter -= 1;
        if (event.dataTransfer.types.indexOf("Files") > -1) {
          event.preventDefault();
          event.stopPropagation();
          if (this.dragCounter === 0) this.dropping = false;
        }
      },
      _drop(event) {
        this.dragCounter = 0;
        if (event.dataTransfer.types.indexOf("Files") > -1) {
          event.stopPropagation();
          event.preventDefault();
          this.dropping = false;

          const file = event.dataTransfer?.files?.[0];
          if (file) this._setFile(file);
        }
      },
      upload() {
        if (!this.formData) return;
        this.currentStatus = "UPLOADING";
        this._debug("Starting file upload");
        this.flows.uploadFileToChat(this.formData, this.fileName, this.replyToId)
          .then((response) => {
            if (response.status !== 200) {
              console.log(response);
              this.currentStatus = "ERROR";
              this.eventBus.$emit("notify", "Error uploading file");
              return;
            }
            this.currentStatus = "SUCCESS";
            this._reset();
            this.eventBus.$emit("notify", "File uploaded");
            this.$emit("fileUploaded");
          })
          .catch((error) => {
            if (error.message === "File too large") {
              this.uploadError = error.message;
              this.currentStatus = "ERROR";
              this.eventBus.$emit("notify", "File too large, maximum 5MB");
              return;
            }
            this.uploadError = error.response;
            this.currentStatus = "ERROR";
            this.eventBus.$emit("notify", "Error uploading file");
          });
      },
      _reset() {
        this.formData = null;
        this.fileName = "";
        this.previewUrl = null;
        this.expanded = false;
      },
      _pasteFromClipboard(event) {
        if (event.clipboardData.files?.length === 1) {
          this._setFile(event.clipboardData.files[0]);
          return;
        }
        if (event.clipboardData.items?.length) {
          const { items } = event.clipboardData;
          for (let i = 0; i < items.length; i++) {
            if (items[i].kind === "file") {
              this._setFile(items[0].getAsFile());
              return;
            }
          }
        }
        /*
            var blob = item.getAsFile();
            var reader = new FileReader();
            reader.onload = function(event){
              this._debug(event.target.result)}; // data url!
            reader.readAsDataURL(blob);
        } */
      },
      _filesChange(fileList) {
        if (fileList.length !== 1) return this._reset();
        this._setFile(fileList[0]);
      },
      _setFile(file) {
        const { type } = file;
        const formData = new FormData();
        formData.append("file", file, file.name);
        this.formData = formData;
        this.expanded = true;
        this.fileName = file.name;

        if (type.indexOf("image") === 0) {
          this.previewUrl = URL.createObjectURL(file);
        } else {
          this.previewUrl = null;
          this._debug(`uploadFileType ${type}`);
        }

        this.$nextTick(() => {
          if (this.$refs.fileName) this.$refs.fileName.focus();
        });
      },
    },
  };
</script>

<style lang="stylus" scoped>
  @import "~@/shared.styl"

  .image-preview
    max-width 300px
    max-height 180px
    border-radius $border-radius
    display block
    margin 0 auto 15px
    box-shadow 0 0 0 2px rgba(0, 0, 0, .1)


</style>
