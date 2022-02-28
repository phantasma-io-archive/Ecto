<template lang="pug">
.seed-words-check-component.mx-2.px-4
    v-row.py-3
        p {{ $t('addWallet.writeSeedWords') }}
    v-row.my-0(v-for="(i, idx) in wordsToCheck" :key="idx")
        v-text-field( filled compact
            v-model="inputWords[idx]"
            :label="`Seed word #${i+1}`"
            :rules="[ value => words[i] == value || 'Wrong word']"
            @input="checkAll"
        )

</template>
<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop } from "vue-property-decorator";

const wordCheckOptions = [
    [ 0, 4, 6, 10],
    [ 1, 6, 7, 11],
    [ 2, 7, 9, 11],
    [ 3, 5, 8, 11],
    [ 1, 3, 7, 11]
]

@Component
export default class extends Vue {
    @Prop()
    words!: string[]

    wordsToCheck!: number[]
    inputWords = [ '', '', '', '' ]

    created() {
        this.wordsToCheck = wordCheckOptions[Math.floor(Math.random() * (wordCheckOptions.length - 1))]
    }

    checkAll() {
        for (let i = 0; i < this.inputWords.length; ++i) {
            if (this.inputWords[i] != this.words[this.wordsToCheck[i]])
                return
        }
        this.$emit('accept')
    }
}
</script>

<style lang="scss">
.seed-words-check-component {
    .v-text-field {
        margin-bottom: -4px;
    }
}
</style>