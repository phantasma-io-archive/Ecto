<template>
    <v-menu offset-y min-width=200>
    <template v-slot:activator="{ on }">
        <!-- @click.stop="" to prevent propagation to parent -->
        <v-btn @click.stop="" v-on="on" icon dark>
            <v-icon color="secondary lighten-2" small>{{icon}}</v-icon>
        </v-btn>
    </template>
    <v-list>
        <template v-for="(pact, index) in actions">
            <v-subheader v-if="pact.header" :key="pact.header">
                {{ pact.header }}
            </v-subheader>
            <v-divider v-else-if="pact.divider" :key="index"></v-divider>
            <v-list-item v-else @click="pact.action(item)" :key="index" :disabled="pact.disabled ? pact.disabled(item) : undefined">
                <v-list-item-icon>
                    <v-icon color="secondary lighten-2" :disabled="pact.disabled ? pact.disabled(item) : undefined">
                        {{ pact.icon }}</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                    <v-list-item-title>&nbsp;&nbsp;{{pact.title}}</v-list-item-title>
                    <v-list-item-subtitle v-if=" pact.subtitle">
                        &nbsp;&nbsp;{{pact.subtitle}}
                    </v-list-item-subtitle>
                </v-list-item-content>
            </v-list-item>

        </template>
    </v-list>
</v-menu>
</template>
<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component({})
export default class PopupMenuComponent extends Vue {
    @Prop() private icon!: string;
    @Prop() private actions!: any;
    @Prop() private item!: any;
    @Prop() private disabled!: (item:any) => boolean;
}
</script>

<style scoped>
</style>
