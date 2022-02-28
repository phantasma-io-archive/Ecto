<template lang="pug">
.seed-words-component.mx-2.mb-4
    v-row.py-4.mx-2
        p
            strong {{ $t("addWallet.writeDown") }}
        p {{ $t("addWallet.seedInfo") }}
    v-row.ma-0.pa-0(v-for="y in [0, 1, 2, 3]" :key="y")
        v-col.ma-0.pa-0(v-for="x in [0, 1, 2]" :key="x")
            .grid-cell
                .words {{ words[x + y*3 ] }}
                .id {{ 1 +x + y * 3 }}

</template>
<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop } from "vue-property-decorator";

@Component
export default class extends Vue {
    @Prop()
    words!: string[];
}
</script>

<style lang="scss">
.seed-words-component {
    .grid-cell {
        height: 44px;
        border: 1px solid #3dacb924;
        background-color: #3dacb924;
        position: relative;

        .words {
            font-size: larger;
            text-align: center;
            margin-top: 12px;
        }

        .id {
            font-size: x-small;
            position: absolute;
            right: 2px;
            top: 0px;
        }
    }
}
</style>