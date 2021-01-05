<style scoped></style>
<template>
  <v-dialog
    v-if="show"
    v-model="show"
    persistent
    max-width="820"
    no-click-animation
    @click:outside="close"
  >
    <v-card>
      <v-card-title class="overline">{{ $t('errorDialog.errorDescription') }}</v-card-title>
      <v-card-text>
        {{ message }}
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="blue darken-1" text @click="close">
          {{ $t('errorDialog.cancelButton') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { Prop } from "vue-property-decorator";

@Component
export default class extends Vue {
  @Prop({ default: false }) show: boolean = false;
  @Prop({ default: false }) message: string = "";

  close() {
    this.$emit("close");
  }
}
</script>
