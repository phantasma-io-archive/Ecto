<style scoped></style>
<template>
  <v-img
    v-if="isImage"
    contain
    :class="{ placeholder: isPlaceholder }"
    :src="mediaUrl"
    :width="width"
    :height="height"
    @error="hasError = true"
  ></v-img>
  <video
    ref="videoRef"
    v-else
    :class="{ 'mx-auto': center }"
    loop
    muted
    :autoplay="autoplay"
    @mouseenter="$refs.videoRef.play()"
    @mouseleave="$refs.videoRef.pause()"
    :width="width"
    :height="height"
    :src="mediaUrl"
    @error="hasError = true"
  ></video>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { Prop } from "vue-property-decorator";

@Component
export default class extends Vue {
  @Prop() media!: string;
  @Prop() height!: string;
  @Prop() width!: string;
  @Prop() autoplay!: boolean;
  @Prop() center!: boolean;

  isPlaceholder = false;
  hasError = false;

  get isImage() {
    if (this.media.startsWith("ipfs-video://") || this.media.endsWith(".mp4"))
      return false;
    return true;
  }

  get mediaUrl() {
    let image = this.media;
    if (!this.hasError) {
      image = image?.replace(
        "ipfs://",
        "https://ipfsgm.blob.core.windows.net/thumbs/"
      );
      image = image?.replace(
        "ipfs-video://",
        "https://ipfsgm.blob.core.windows.net/thumbs/"
      );
    } else {
      image = image?.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
      image = image?.replace(
        "ipfs-video://",
        "https://gateway.pinata.cloud/ipfs/"
      );
    }
    return image;
  }
}
</script>
