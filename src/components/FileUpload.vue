<template lang="pug">
  .file-upload

    .text-color-quiet(v-if="fileQueue.length" style="margin: -5px 0 3px;") +{{ fileQueue.length }} more file#[span(v-if="fileQueue.length > 1") s] in queue

    img.image-preview(v-if="previewUrl" :src="previewUrl")

    form.flex-container(
      enctype="multipart/form-data"
      novalidate
      @submit.prevent)

      .flex1.margin-right-tiny(v-show="expanded" style="min-width: 0;")
        input.r-input-text.fullwidth(
          type="text"
          ref="fileName"
          :class="{ 'text-error': currentStatus === 'ERROR' }"
          v-model="fileName"
          placeholder="File name"
          @keydown.enter.prevent="upload")

      .flex0.margin-right-tiny(v-show="!expanded || !mqMobile")

        r-button(
          borderless
          :action="() => { $refs.fileInput && $refs.fileInput.click(); }"
          :label="expanded ? 'Change file' :  'Upload file'"
          icon="file"
        )

        input#fileInput(
          type="file"
          name="file"
          ref="fileInput"
          :disabled="currentStatus === 'UPLOADING'"
          @change="_filesChange($event.target.files)"
          style="display: none")

      .flex0.margin-right-tiny(v-if="expanded && formData")
        r-button(:action="_reset" icon="close")
          template(v-if="!mqMobile") Cancel

      .flex0(v-show="expanded")
        r-button(primary :action="upload" :loading="currentStatus === 'UPLOADING'" icon="upload")
          template(v-if="!mqMobile") Upload

</template>

<script>
  export default {
    name: "FileUpload",
    props: {
      chatId: Number,
      replyToId: Number,
    },
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
        fileQueue: [],
      };
    },
    watch: {
      expanded(val) {
        this.$emit("expandChange", val);
        this.$events.$emit("messagesScrollUpdate");
      },
      previewUrl() {
        this.$events.$emit("messagesScrollUpdate");
      },
      dropping(val, oldVal) {
        if (val !== oldVal) this.$events.$emit("dropOverlay", val);
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
      this.loginToken = this.$flows.localstorage.getSessionToken();
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

          if (event.dataTransfer?.files?.length > 0) {
            this.fileQueue = Array.from(event.dataTransfer.files);
            this._processQueue();
          }
        }
      },
      async upload() {
        if (!this.formData) return;
        this.currentStatus = "UPLOADING";
        this._debug("Starting file upload");
        try {
          const response = await this.$flows.files.uploadFile(this.formData, this.fileName, this.chatId, this.replyToId);
          if (response.status !== 200) {
            this.currentStatus = "ERROR";
            this.$events.$emit("notify", "Error uploading file");
            // eslint-disable-next-line no-console
            console.error(response);
            return;
          }
          this.currentStatus = "SUCCESS";
          this._reset(true);
          this.$events.$emit("notify", "File uploaded");
          this.$emit("fileUploaded");
          this._processQueue();
        } catch (error) {
          if (error.message) {
            this.uploadError = error.message;
            this.currentStatus = "ERROR";
            this.$events.$emit("notify", error.message);
            return;
          }
          this.uploadError = error.response;
          this.currentStatus = "ERROR";
          this.$events.$emit("notify", "Error uploading file");
        }
      },
      _reset(keepQueue) {
        this.currentStatus = "INITIAL";
        this.formData = null;
        this.fileName = "";
        this.previewUrl = null;
        this.expanded = false;
        if (!keepQueue) this.fileQueue = [];
        if (this.$refs.fileInput) this.$refs.fileInput.value = "";
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
        if (fileList.length !== 1) {
          this._reset();
          return;
        }
        this._setFile(fileList[0]);
      },
      _setFile(file) {
        this.currentStatus = "INITIAL";

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
      _processQueue() {
        if (this.fileQueue.length) {
          this._setFile(this.fileQueue.pop());
        }
      },
    },
  };

</script>

<style lang="stylus" scoped>
  @import "~@/shared.styl"

  .image-preview
    max-width 300px
    max-height 180px
    width 100%
    border-radius $border-radius
    display block
    margin 0 auto 15px
    box-shadow 0 0 0 2px rgba(0, 0, 0, .1)

</style>
