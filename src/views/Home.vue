<template>
  <div>
    <v-app-bar key="appbar" app color="primary" dark style="font-size:16px">
      <v-icon>mdi-wallet</v-icon><v-spacer />
      <v-list-item link @click="goto('/wallets')">
        <v-list-item-content v-if="!state.balanceShown">
          <v-list-item-title>***</v-list-item-title>
          <v-list-item-subtitle>***</v-list-item-subtitle>
        </v-list-item-content>
        <v-list-item-content v-else>
          <v-list-item-title>{{ shorterAddress }}</v-list-item-title>
          <v-list-item-subtitle>{{ shortAddress }}</v-list-item-subtitle>
        </v-list-item-content>
        <v-icon>mdi-menu-down</v-icon>
      </v-list-item>
      <v-spacer />
      <v-btn icon @click="goto('/qr')">
        <v-icon>mdi-qrcode</v-icon>
      </v-btn>
      <!-- <v-btn icon @click="goto('/qr')">
        <v-icon>mdi-apps</v-icon>
      </v-btn> -->
    </v-app-bar>

    <v-main style="width:320px; max-height:500px">
      <v-progress-linear
        v-if="isLoading"
        color="#17b1e8"
        indeterminate
        style="z-index:7777;position:absolute;"
      ></v-progress-linear>
      <v-tabs
        v-model="activeTab"
        background-color="white"
        color="#17b1e8"
        right
      >
        <v-tab @change="onAssetsTab">{{ $t("home.assets") }}</v-tab>
        <v-tab @change="onActivityTab">{{ $t("home.activity") }}</v-tab>
        <v-tab @change="onSwapsTab"
          ><v-badge
            v-if="state.allSwaps && state.allSwaps.length > 0"
            dot
            color="#17b1e8"
            ><span v-html="$t('home.multiChain')"></span></v-badge
          ><span v-else v-html="$t('home.multiChain')"></span
        ></v-tab>

        <v-tab-item key="1">
          <v-container
            class="overflow-y-auto overflow-x-hidden pa-0"
            style="max-height:450px"
          >
            <div
              v-if="
                noKcal() &&
                  account &&
                  account.data &&
                  account.data.stake >= 2 * 10 ** 8 &&
                  account.data.name == 'anonymous'
              "
              class="pa-5"
            >
              {{ $t("home.kcalExplanation") }}
              <a href="" @click.prevent="claimDialog = true"
                >{{ $t("home.claim") }} KCAL</a
              >
            </div>
            <div
              v-else-if="
                account &&
                  account.data &&
                  account.data.stake >= 2 * 10 ** 8 &&
                  account.data.name == 'anonymous'
              "
              class="pa-5"
            >
              {{ $t("home.registerMain") }}
              <a href="" @click.prevent="registerNameDialog = true">{{
                $t("home.registerTitle")
              }}</a>
            </div>
            <div
              v-else-if="
                account &&
                  account.data &&
                  account.data.stake == 0 &&
                  getUnstackedSoul() == '0'
              "
              class="pa-5"
            >
              {{ $t("home.registerDescription3") }}
            </div>
            <div
              v-else-if="account && account.data && account.data.stake == 0"
              class="pa-5"
            >
              {{ $t("home.registerDescription2") }}
              <a href="" @click.prevent="stakeDialog = true">{{
                $t("home.stake")
              }}</a>
            </div>
            <v-expansion-panels
              v-if="account"
              v-model="panel"
              multiple
              accordion
              hover
            >
              <v-expansion-panel
                v-for="item in account.data.balances"
                :key="item.symbol"
              >
                <v-expansion-panel-header>
                  <div
                    v-if="
                      item.symbol == 'SOUL' &&
                        account.data.stake >= 50000 * 10 ** 8
                    "
                    style="font-size: 10px; color:#42b3f4; position: absolute; bottom: 9px; left: 13px;"
                  >
                    <span v-if="!state.balanceShown"></span>
                    <span v-else>SOULMASTER</span>
                  </div>
                  <v-img :src="getAssetIcon(item)" max-width="40px"></v-img>
                  <div
                    style="margin:10px 1px 10px 15px;width:160px;font-size:16px"
                  >
                    <span v-if="!state.balanceShown">*** </span>
                    <span v-else>{{ getAmount(item) }} </span>
                    <span>{{ item.symbol }}</span
                    ><br /><span
                      style="font-size:12px; color:gray;"
                      v-if="isSecondLineVisible(item)"
                      >{{ getSecondLine(item) }}</span
                    >
                  </div>
                  <div
                    v-if="!state.balanceShown"
                    style="margin:10px 1px;width:80px;font-size:16px"
                  >
                    {{ getCurrencyValue(item) }}<br /><span
                      style="font-size:12px; color:gray;"
                      v-if="isSecondLineVisible(item)"
                      >{{ getSecondLineValue(item) }}</span
                    >
                  </div>
                  <div v-else style="margin:10px 1px;width:80px;font-size:16px">
                    {{ getCurrencyValue(item) }}<br /><span
                      style="font-size:12px; color:gray;"
                      v-if="isSecondLineVisible(item)"
                      >{{ getSecondLineValue(item) }}</span
                    >
                  </div>
                </v-expansion-panel-header>
                <v-expansion-panel-content>
                  <div class="d-flex justify-end mt-1 mr-3 mb-3">
                    <v-btn
                      small
                      text
                      v-if="item.symbol == 'SOUL'"
                      @click.stop="unstakeDialog = true"
                      :disabled="account.data.stake == 0"
                      ><v-icon>mdi-bank-transfer-out</v-icon>
                      {{ $t("home.unstake") }}</v-btn
                    >
                    <v-btn
                      small
                      text
                      style="padding: 0 6px;"
                      v-if="item.symbol == 'SOUL'"
                      @click.stop="stakeDialog = true"
                      :disabled="getUnstackedSoul() == '0'"
                      ><v-icon>mdi-bank-transfer-in</v-icon>
                      {{ $t("home.stake") }}</v-btn
                    >
                    <v-btn
                      small
                      text
                      style="padding: 0 6px;"
                      v-if="item.symbol == 'KCAL'"
                      @click.stop="claimDialog = true"
                      :disabled="account.data.unclaimed == 0"
                      ><v-icon>mdi-piggy-bank</v-icon>
                      {{ $t("home.claim") }}</v-btn
                    >
                    <v-btn
                      small
                      text
                      style="padding: 0 6px;"
                      v-if="state.isNFT(item.symbol)"
                      @click="goto('/nfts/' + item.symbol + '/view')"
                      :disabled="item.amount == 0"
                      ><v-icon>mdi-eye</v-icon> {{ $t("home.view") }}</v-btn
                    >
                    <v-btn
                      small
                      text
                      style="padding: 0 6px;"
                      v-if="state.isBurnable(item.symbol)"
                      @click="burnAsset($event, item)"
                      :disabled="item.amount == 0"
                      ><v-icon>mdi-fire</v-icon> {{ $t("home.burn") }}</v-btn
                    >
                    <v-btn
                      small
                      text
                      style="padding: 0 6px;"
                      @click="transferAsset($event, item)"
                      :disabled="item.amount == 0"
                      ><v-icon>mdi-export</v-icon> {{ $t("home.send") }}</v-btn
                    >
                  </div>
                </v-expansion-panel-content>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-container>
        </v-tab-item>

        <v-tab-item key="2">
          <div style="overflow: auto; height: 450px">
            <v-simple-table>
              <template v-slot:default>
                <tbody>
                  <tr v-for="item in txs" :key="item.hash">
                    <td style="font-size:11px; padding:6px" class="pl-3">
                      {{ getTime(item.timestamp) }}<br /><strong>{{
                        getDate(item.timestamp)
                      }}</strong>
                    </td>
                    <td
                      v-if="!state.balanceShown"
                      style="font-size:11px; padding: 6px"
                    >
                      *****
                    </td>
                    <td v-else style="font-size:11px; padding: 6px">
                      <TransactionComponent
                        :tx="item"
                        :address="account.address"
                      />
                    </td>
                    <!-- <td style="font-size:11px">{{ formatHash(item.hash) }}</td> -->
                    <td style="font-size:11px; padding: 5px">
                      <a
                        :href="getExplorerLink(item.hash)"
                        target="_blank"
                        rel="noopener noreferrer"
                        >{{ $t("home.view") }}</a
                      >
                    </td>
                  </tr>
                  <tr v-for="item in loadingTxs" :key="item">
                    <td class="pa-0" style="width:50px">
                      <v-skeleton-loader type="list-item"></v-skeleton-loader>
                    </td>
                    <td class="pa-0" style="width:110px">
                      <v-skeleton-loader type="list-item"></v-skeleton-loader>
                    </td>
                    <td class="pa-0" style="width:30px">
                      <v-skeleton-loader type="list-item"></v-skeleton-loader>
                    </td>
                  </tr>
                </tbody>
              </template>
            </v-simple-table>
            <div style="text-align:center">
              <v-btn
                v-if="loadingTxs.length === 0 && showLoadMore"
                dense
                text
                class="ma-1"
                color="blue darken-1"
                @click="loadMoreTxs"
                >{{ $t("home.load") }}</v-btn
              >
            </div>
          </div>
          <div class="pa-3"></div>
        </v-tab-item>

        <v-tab-item key="3">
          <div
            v-if="account && account.neoAddress && account.ethAddress"
            style="overflow: auto; height: 459px"
          >
            <div style="text-align:center">
              <v-expansion-panels focusable hover multiple>
                <div
                  style="width: 100%; height: 16px; margin-top: 8px; background: linear-gradient(45deg, #28ceaf, #17b1e8); color: white"
                >
                  {{ $t("home.crossChain") }}
                </div>
                <div v-if="state.allSwaps.length > 0" class="pa-4">
                  <div
                    style="text-transform:uppercase;margin-bottom:0.5rem;color:#17b1e8"
                  >
                    <v-badge
                      v-if="state.allSwaps.length > 0"
                      :content="state.allSwaps.length"
                      color="#17b1e8"
                      style="margin-left:0.5rem;"
                      >{{ $t("home.pendingSwaps") }}</v-badge
                    >
                  </div>
                  <div
                    v-for="(swap, idx) in state.allSwaps"
                    :key="swap.sourceHash + 'a' + idx"
                    class="pa-1"
                  >
                    <span v-if="!state.balanceShown">***</span>
                    <span v-else>{{
                      formatSymbol(swap.value, swap.symbol)
                    }}</span>
                    {{ $t("home.from") }} {{ formatChain(swap.sourcePlatform) }}
                    {{ $t("home.to") }}
                    {{ formatChain(swap.destinationPlatform) }}
                    <a href="#" @click.prevent="claimSwap(swap)">{{
                      $t("home.claim")
                    }}</a>
                  </div>
                  <!--<div
                v-for="(cs, idx) in state.claimablePendingSwaps"
                :key="cs.hash + 'c' + idx"
                class="pa-1"
              >
                <span v-if="!state.balanceShown">***</span>
                <span v-else
                  >{{ formatSymbol(cs.swap.value, cs.swap.symbol) }}
                </span>
                {{ $t("home.from") }} {{ formatChain(cs.swap.sourcePlatform) }}
                {{ $t("home.to") }}
                {{ formatChain(cs.swap.destinationPlatform) }}
                <strong style="font-size: 10px">{{ cs.addressTo }} </strong
                >&nbsp;
                <a href="#" @click.prevent="claimSwap(cs.swap)">{{
                  $t("home.claim")
                }}</a>
              </div>-->
                </div>
                <v-expansion-panel>
                  <v-expansion-panel-header>
                    <v-row>
                      <v-col class="mt-2">
                        {{ $t("home.swapFrom") }} NEO
                      </v-col>
                      <v-col cols="4" class="pl-0 pr-0">
                        <img
                          class="ma-1"
                          src="assets/neo.png"
                          style="vertical-align: middle; max-width:24px"
                        />
                        <v-icon>mdi-arrow-right-bold</v-icon
                        ><img
                          class="ma-1"
                          src="assets/soul.png"
                          style="vertical-align: middle; max-width:24px"
                        />
                      </v-col>
                    </v-row>
                  </v-expansion-panel-header>
                  <v-expansion-panel-content class="pa-2">
                    <div
                      v-if="
                        !state.neoBalances || state.neoBalances.length === 0
                      "
                    >
                      {{ $t("home.noSwapsNEO") }}<br />
                      <br />{{ $t("home.sendAssetsSwap") }}
                      <strong v-if="!state.balanceShown"
                        >************************************</strong
                      ><strong v-else>{{ account.neoAddress }}</strong
                      ><v-btn
                        icon
                        small
                        @click="copyToClipboard(account.neoAddress)"
                        ><v-icon size="16">mdi-content-copy</v-icon></v-btn
                      >
                      <br />
                      <a
                        href="#"
                        @click="
                          openWindow(
                            state.isMainnet
                              ? 'https://dora.coz.io/address/neo2/mainnet/' +
                                  account.neoAddress
                              : 'http://http://mankinighost.phantasma.io:4000/address/' +
                                  account.neoAddress
                          )
                        "
                        >{{ $t("home.viewOnExplorer") }}</a
                      >
                    </div>
                    <div v-else>
                      {{ $t("home.swappableAssets") }}
                      <strong v-if="!state.balanceShown"
                        >************************************</strong
                      >
                      <strong v-else>{{ account.neoAddress }}</strong
                      ><v-btn
                        icon
                        x-small
                        @click="copyToClipboard(account.neoAddress)"
                        ><v-icon size="16">mdi-content-copy</v-icon></v-btn
                      >
                      <br />
                      <a
                        href="#"
                        @click="
                          openWindow(
                            state.isMainnet
                              ? 'https://dora.coz.io/address/neo2/mainnet/' +
                                  account.neoAddress
                              : 'http://http://mankinighost.phantasma.io:4000/address/' +
                                  account.neoAddress
                          )
                        "
                        >{{ $t("home.viewOnExplorer") }}</a
                      >
                      <v-list>
                        <v-list-item-group>
                          <v-list-item
                            v-for="bal in state.neoBalances"
                            :key="bal.symbol"
                          >
                            <v-list-item-content>
                              <v-img
                                class="mr-3"
                                :src="getAssetIcon(bal)"
                                max-width="24px"
                              ></v-img
                              ><span
                                v-if="!state.balanceShown"
                                style="display:contents;"
                                >*** {{ bal.symbol }}</span
                              ><span v-else style="display:contents;">{{
                                formatSymbol(bal.amount, bal.symbol)
                              }}</span>
                            </v-list-item-content>
                            <v-list-item-action>
                              <a
                                href="#"
                                @click.prevent="askSwapFromNeo(bal)"
                                >{{ $t("home.send").toLowerCase() }}</a
                              >
                            </v-list-item-action>
                          </v-list-item>
                        </v-list-item-group>
                      </v-list>
                    </div>
                  </v-expansion-panel-content>
                </v-expansion-panel>
                <v-expansion-panel>
                  <v-expansion-panel-header>
                    <v-row>
                      <v-col class="mt-2">
                        {{ $t("home.swapFrom") }} Ethereum
                      </v-col>
                      <v-col cols="4" class="pl-0 pr-0">
                        <img
                          class="ma-1"
                          src="assets/eth.png"
                          style="vertical-align: middle; max-width:24px"
                        />
                        <v-icon>mdi-arrow-right-bold</v-icon
                        ><img
                          class="ma-1"
                          src="assets/soul.png"
                          style="vertical-align: middle; max-width:24px"
                        />
                      </v-col>
                    </v-row>
                  </v-expansion-panel-header>
                  <v-expansion-panel-content class="pa-3">
                    <div
                      v-if="
                        !state.ethBalances || state.ethBalances.length === 0
                      "
                    >
                      {{ $t("home.noSwapsETH") }}<br /><br />
                      {{ $t("home.sendAssetsSwap") }}
                      <strong v-if="!state.balanceShown"
                        >************************************</strong
                      >
                      <strong v-else style="font-size: 11px">{{
                        account.ethAddress
                      }}</strong
                      ><v-btn
                        icon
                        x-small
                        @click="copyToClipboard(account.ethAddress)"
                        ><v-icon size="16">mdi-content-copy</v-icon></v-btn
                      >
                      <br />
                      <a
                        href="#"
                        @click="
                          openWindow(
                            state.isMainnet
                              ? 'https://etherscan.io/address/' +
                                  account.ethAddress
                              : 'https://ropsten.etherscan.io/address/' +
                                  account.ethAddress
                          )
                        "
                        >{{ $t("home.viewOnExplorer") }}</a
                      >
                    </div>
                    <div v-else>
                      {{ $t("home.swappableAssets") }}
                      <strong v-if="!state.balanceShown"
                        >************************************</strong
                      >
                      <strong v-else style="font-size: 11px">{{
                        account.ethAddress
                      }}</strong
                      ><v-btn
                        icon
                        x-small
                        @click="copyToClipboard(account.ethAddress)"
                        ><v-icon size="16">mdi-content-copy</v-icon></v-btn
                      >
                      <br />
                      <a
                        href="#"
                        @click="
                          openWindow(
                            state.isMainnet
                              ? 'https://etherscan.io/address/' +
                                  account.ethAddress
                              : 'https://ropsten.etherscan.io/address/' +
                                  account.ethAddress
                          )
                        "
                        >{{ $t("home.viewOnExplorer") }}</a
                      >
                      <v-list>
                        <v-list-item-group>
                          <v-list-item
                            v-for="bal in state.ethBalances"
                            :key="bal.symbol"
                            style="cursor: default"
                          >
                            <v-list-item-content>
                              <v-img
                                class="mr-3"
                                :src="getAssetIcon(bal)"
                                max-width="24px"
                              ></v-img
                              >{{ formatSymbol(bal.amount, bal.symbol) }}
                            </v-list-item-content>
                            <v-list-item-action style="display: inline">
                              <a
                                href="#"
                                @click.prevent="askSwapFromEth(bal)"
                                >{{ $t("home.send").toLowerCase() }}</a
                              >
                            </v-list-item-action>
                          </v-list-item>
                        </v-list-item-group>
                      </v-list>
                    </div>
                    <br />
                    {{ $t("home.or") }}
                    <a href="#" @click.prevent="goto('/addwallet')">{{
                      $t("home.importETHWallet")
                    }}</a>
                    {{ $t("home.withYourKey")
                    }}<v-btn
                      icon
                      x-small
                      @click="
                        openWindow(
                          'https://metamask.zendesk.com/hc/en-us/articles/360015289632-How-to-Export-an-Account-Private-Key'
                        )
                      "
                      ><v-icon size="16">mdi-information-outline</v-icon></v-btn
                    ><br />
                  </v-expansion-panel-content>
                </v-expansion-panel>
                <v-expansion-panel>
                  <v-expansion-panel-header>
                    <v-row>
                      <v-col class="mt-2">
                        {{ $t("home.swapFrom") }} BSC
                      </v-col>
                      <v-col cols="4" class="pl-0 pr-0">
                        <img
                          class="ma-1"
                          src="assets/bnb.png"
                          style="vertical-align: middle; max-width:24px"
                        />
                        <v-icon>mdi-arrow-right-bold</v-icon
                        ><img
                          class="ma-1"
                          src="assets/soul.png"
                          style="vertical-align: middle; max-width:24px"
                        />
                      </v-col>
                    </v-row>
                  </v-expansion-panel-header>
                  <v-expansion-panel-content class="pa-3">
                    <div
                      v-if="
                        !state.bscBalances || state.bscBalances.length === 0
                      "
                    >
                      {{ $t("home.noSwapsBSC") }}<br /><br />
                      {{ $t("home.sendAssetsSwap") }}
                      <strong v-if="!state.balanceShown"
                        >************************************</strong
                      >
                      <strong v-else style="font-size: 11px">{{
                        account.bscAddress
                      }}</strong
                      ><v-btn
                        icon
                        x-small
                        @click="copyToClipboard(account.bscAddress)"
                        ><v-icon size="16">mdi-content-copy</v-icon></v-btn
                      >
                      <br />
                      <a
                        href="#"
                        @click="
                          openWindow(
                            state.isMainnet
                              ? 'https://bscscan.com/address/' +
                                  account.bscAddress
                              : 'https://testnet.bscscan.com/address/' +
                                  account.bscAddress
                          )
                        "
                        >{{ $t("home.viewOnExplorer") }}</a
                      >
                    </div>
                    <div v-else>
                      {{ $t("home.swappableAssets") }}
                      <strong v-if="!state.balanceShown"
                        >************************************</strong
                      >
                      <strong v-else style="font-size: 11px">{{
                        account.bscAddress
                      }}</strong
                      ><v-btn
                        icon
                        x-small
                        @click="copyToClipboard(account.bscAddress)"
                        ><v-icon size="16">mdi-content-copy</v-icon></v-btn
                      >
                      <br />
                      <a
                        href="#"
                        @click="
                          openWindow(
                            state.isMainnet
                              ? 'https://bscscan.com/address/' +
                                  account.bscAddress
                              : 'https://testnet.bscscan.com/address/' +
                                  account.bscAddress
                          )
                        "
                        >{{ $t("home.viewOnExplorer") }}</a
                      >
                      <v-list>
                        <v-list-item-group>
                          <v-list-item
                            v-for="bal in state.bscBalances"
                            :key="bal.symbol"
                            style="cursor: default"
                          >
                            <v-list-item-content>
                              <v-img
                                class="mr-3"
                                :src="getAssetIcon(bal)"
                                max-width="24px"
                              ></v-img
                              >{{ formatSymbol(bal.amount, bal.symbol) }}
                            </v-list-item-content>
                            <v-list-item-action style="display: inline">
                              <a
                                href="#"
                                @click.prevent="askSwapFromBsc(bal)"
                                >{{ $t("home.send").toLowerCase() }}</a
                              >
                            </v-list-item-action>
                          </v-list-item>
                        </v-list-item-group>
                      </v-list>
                    </div>
                    <br />
                    {{ $t("home.or") }}
                    <a href="#" @click.prevent="goto('/addwallet')">{{
                      $t("home.importBSCWallet")
                    }}</a>
                    {{ $t("home.withYourKey")
                    }}<v-btn
                      icon
                      x-small
                      @click="
                        openWindow(
                          'https://metamask.zendesk.com/hc/en-us/articles/360015289632-How-to-Export-an-Account-Private-Key'
                        )
                      "
                      ><v-icon size="16">mdi-information-outline</v-icon></v-btn
                    ><br />
                  </v-expansion-panel-content>
                </v-expansion-panel>
                <v-expansion-panel>
                  <v-expansion-panel-header>
                    <v-row style="vertical-align:middle">
                      <v-col class="mt-2"> {{ $t("home.swapTo") }} NEO </v-col>
                      <v-col cols="4" class="pl-0 pr-0">
                        <img
                          class="ma-1"
                          src="assets/soul.png"
                          style="vertical-align: middle; max-width:24px"
                        />
                        <v-icon>mdi-arrow-right-bold</v-icon
                        ><img
                          class="ma-1"
                          src="assets/neo.png"
                          style="vertical-align: middle; max-width:24px"
                        />
                      </v-col>
                    </v-row>
                  </v-expansion-panel-header>
                  <v-expansion-panel-content class="pa-3">
                    {{ $t("home.swapToNeo") }}<br />
                    <a
                      href="#"
                      @click.prevent="selectAssetToSwap('neo', false)"
                      >{{ $t("home.selectAsset") }}</a
                    ><!--<br /><br />
                    {{ $t("home.swapToAnotherNEO") }}<br />
                    <a
                      href="#"
                      @click.prevent="selectAssetToSwap('neo', true)"
                      >{{ $t("home.selectAssetAndDest") }}</a
                    >-->
                    <br />
                    <br />
                    {{ $t("home.needGasToSwap", [0.1]) }}
                  </v-expansion-panel-content>
                </v-expansion-panel>
                <v-expansion-panel>
                  <v-expansion-panel-header>
                    <v-row>
                      <v-col class="mt-2">
                        {{ $t("home.swapTo") }} Ethereum
                      </v-col>
                      <v-col cols="4" class="pl-0 pr-0">
                        <img
                          class="ma-1"
                          src="assets/soul.png"
                          style="vertical-align: middle; max-width:24px"
                        />
                        <v-icon>mdi-arrow-right-bold</v-icon
                        ><img
                          class="ma-1"
                          src="assets/eth.png"
                          style="vertical-align: middle; max-width:24px"
                        />
                      </v-col>
                    </v-row>
                  </v-expansion-panel-header>
                  <v-expansion-panel-content class="pa-3">
                    {{ $t("home.swapToETH") }}<br />
                    <a
                      href="#"
                      @click.prevent="selectAssetToSwap('eth', false)"
                      >{{ $t("home.selectAsset") }}</a
                    ><!--<br /><br />
                    {{ $t("home.swapToAnotherETH") }}<br />
                    <a
                      href="#"
                      @click.prevent="selectAssetToSwap('eth', true)"
                      >{{ $t("home.selectAssetAndDest") }}</a
                    >-->
                    <br />
                    <br />
                    <span
                      v-html="
                        $t('home.needEthToSwap', [
                          (
                            Math.round(21000 * ethGasPrices[1] * 1.2) / 1e9
                          ).toFixed(4),
                          (
                            Math.round(100000 * ethGasPrices[1] * 1.2) / 1e9
                          ).toFixed(4),
                        ])
                      "
                    ></span>
                    <!-- Each swap costs 0.001 ETH -->
                  </v-expansion-panel-content>
                </v-expansion-panel>
                <v-expansion-panel>
                  <v-expansion-panel-header>
                    <v-row>
                      <v-col class="mt-2"> {{ $t("home.swapTo") }} BSC </v-col>
                      <v-col cols="4" class="pl-0 pr-0">
                        <img
                          class="ma-1"
                          src="assets/soul.png"
                          style="vertical-align: middle; max-width:24px"
                        />
                        <v-icon>mdi-arrow-right-bold</v-icon
                        ><img
                          class="ma-1"
                          src="assets/bnb.png"
                          style="vertical-align: middle; max-width:24px"
                        />
                      </v-col>
                    </v-row>
                  </v-expansion-panel-header>
                  <v-expansion-panel-content class="pa-3">
                    {{ $t("home.swapToBSC") }}<br />
                    <a
                      href="#"
                      @click.prevent="selectAssetToSwap('bsc', false)"
                      >{{ $t("home.selectAsset") }}</a
                    ><!--<br /><br />
                    {{ $t("home.swapToAnotherBSC") }}<br />
                    <a
                      href="#"
                      @click.prevent="selectAssetToSwap('bsc', true)"
                      >{{ $t("home.selectAssetAndDest") }}</a
                    >-->
                    <br />
                    <br />
                    <span
                      v-html="
                        $t('home.needBnbToSwap', [
                          (
                            Math.round(21000 * bscGasPrices[1] * 1.2) / 1e9
                          ).toFixed(4),
                          (
                            Math.round(100000 * bscGasPrices[1] * 1.2) / 1e9
                          ).toFixed(4),
                        ])
                      "
                    ></span>
                    <!-- Each swap costs 0.001 ETH -->
                  </v-expansion-panel-content>
                </v-expansion-panel>
                <div
                  v-if="
                    (state.neoBalances && state.neoBalances.length > 0) ||
                      (state.ethBalances && state.ethBalances.length > 0) |
                        (state.bscBalances && state.bscBalances.length > 0)
                  "
                  style="width: 100%; height: 16px; background: linear-gradient(45deg, #28ceaf, #17b1e8); color: white"
                >
                  {{ $t("home.sameChain") }}
                </div>
                <v-expansion-panel
                  v-if="state.neoBalances && state.neoBalances.length > 0"
                >
                  <v-expansion-panel-header>
                    <v-row>
                      <v-col class="mt-2"> {{ $t("home.sendOn") }} NEO </v-col>
                      <v-col cols="4" class="pl-0 pr-0">
                        <img
                          class="ma-1"
                          src="assets/neo.png"
                          style="vertical-align: middle; max-width:24px"
                        />
                        <v-icon>mdi-arrow-right-bold</v-icon
                        ><img
                          class="ma-1"
                          src="assets/neo.png"
                          style="vertical-align: middle; max-width:24px"
                        />
                      </v-col>
                    </v-row>
                  </v-expansion-panel-header>
                  <v-expansion-panel-content class="pa-2">
                    <div>
                      {{ $t("home.assetsIn") }}
                      <strong v-if="!state.balanceShown"
                        >************************************</strong
                      >
                      <strong v-else>{{ account.neoAddress }}</strong
                      ><v-btn
                        icon
                        x-small
                        @click="copyToClipboard(account.neoAddress)"
                        ><v-icon size="16">mdi-content-copy</v-icon></v-btn
                      >
                      <br />
                      <a
                        href="#"
                        @click="
                          openWindow(
                            state.isMainnet
                              ? 'https://dora.coz.io/address/neo2/mainnet/' +
                                  account.neoAddress
                              : 'http://http://mankinighost.phantasma.io:4000/address/' +
                                  account.neoAddress
                          )
                        "
                        >{{ $t("home.viewOnExplorer") }}</a
                      >
                      <v-list>
                        <v-list-item-group>
                          <v-list-item
                            v-for="bal in state.neoBalances"
                            :key="bal.symbol"
                          >
                            <v-list-item-content>
                              <v-img
                                class="mr-3"
                                :src="getAssetIcon(bal)"
                                max-width="24px"
                              ></v-img
                              ><span
                                v-if="!state.balanceShown"
                                style="display:contents;"
                                >*** {{ bal.symbol }}</span
                              ><span v-else style="display:contents;">{{
                                formatSymbol(bal.amount, bal.symbol)
                              }}</span>
                            </v-list-item-content>
                            <v-list-item-action>
                              <a href="#" @click.prevent="askSendNeo(bal)">{{
                                $t("home.send").toLowerCase()
                              }}</a>
                            </v-list-item-action>
                          </v-list-item>
                        </v-list-item-group>
                      </v-list>
                    </div>
                  </v-expansion-panel-content>
                </v-expansion-panel>
                <v-expansion-panel
                  v-if="state.ethBalances && state.ethBalances.length > 0"
                >
                  <v-expansion-panel-header>
                    <v-row>
                      <v-col class="mt-2">
                        {{ $t("home.sendOn") }} Ethereum
                      </v-col>
                      <v-col cols="4" class="pl-0 pr-0">
                        <img
                          class="ma-1"
                          src="assets/eth.png"
                          style="vertical-align: middle; max-width:24px"
                        />
                        <v-icon>mdi-arrow-right-bold</v-icon
                        ><img
                          class="ma-1"
                          src="assets/eth.png"
                          style="vertical-align: middle; max-width:24px"
                        />
                      </v-col>
                    </v-row>
                  </v-expansion-panel-header>
                  <v-expansion-panel-content class="pa-3">
                    <div>
                      {{ $t("home.assetsIn") }}
                      <strong v-if="!state.balanceShown"
                        >************************************</strong
                      >
                      <strong v-else style="font-size: 11px">{{
                        account.ethAddress
                      }}</strong
                      ><v-btn
                        icon
                        x-small
                        @click="copyToClipboard(account.ethAddress)"
                        ><v-icon size="16">mdi-content-copy</v-icon></v-btn
                      >
                      <br />
                      <a
                        href="#"
                        @click="
                          openWindow(
                            state.isMainnet
                              ? 'https://etherscan.io/address/' +
                                  account.ethAddress
                              : 'https://ropsten.etherscan.io/address/' +
                                  account.ethAddress
                          )
                        "
                        >{{ $t("home.viewOnExplorer") }}</a
                      >
                      <v-list>
                        <v-list-item-group>
                          <v-list-item
                            v-for="bal in state.ethBalances"
                            :key="bal.symbol"
                            style="cursor: default"
                          >
                            <v-list-item-content>
                              <v-img
                                class="mr-3"
                                :src="getAssetIcon(bal)"
                                max-width="24px"
                              ></v-img
                              >{{ formatSymbol(bal.amount, bal.symbol) }}
                            </v-list-item-content>
                            <v-list-item-action style="display: inline">
                              <a href="#" @click.prevent="askSendEth(bal)">{{
                                $t("home.send").toLowerCase()
                              }}</a>
                            </v-list-item-action>
                          </v-list-item>
                        </v-list-item-group>
                      </v-list>
                    </div>
                    {{ $t("home.or") }}
                    <a href="#" @click.prevent="askExportPrivateKeyHex">{{
                      $t("home.exportPrivateKey")
                    }}</a>
                    {{ $t("home.andImportInMetamask")
                    }}<v-btn
                      icon
                      x-small
                      @click="
                        openWindow(
                          'https://metamask.zendesk.com/hc/en-us/articles/360015489331-How-to-import-an-Account'
                        )
                      "
                      ><v-icon size="16">mdi-information-outline</v-icon></v-btn
                    >
                    <br />
                  </v-expansion-panel-content>
                </v-expansion-panel>
                <v-expansion-panel
                  v-if="state.bscBalances && state.bscBalances.length > 0"
                >
                  <v-expansion-panel-header>
                    <v-row>
                      <v-col class="mt-2"> {{ $t("home.sendOn") }} BSC </v-col>
                      <v-col cols="4" class="pl-0 pr-0">
                        <img
                          class="ma-1"
                          src="assets/bnb.png"
                          style="vertical-align: middle; max-width:24px"
                        />
                        <v-icon>mdi-arrow-right-bold</v-icon
                        ><img
                          class="ma-1"
                          src="assets/bnb.png"
                          style="vertical-align: middle; max-width:24px"
                        />
                      </v-col>
                    </v-row>
                  </v-expansion-panel-header>
                  <v-expansion-panel-content class="pa-3">
                    <div>
                      {{ $t("home.assetsIn") }}
                      <strong v-if="!state.balanceShown"
                        >************************************</strong
                      >
                      <strong v-else style="font-size: 11px">{{
                        account.bscAddress
                      }}</strong
                      ><v-btn
                        icon
                        x-small
                        @click="copyToClipboard(account.bscAddress)"
                        ><v-icon size="16">mdi-content-copy</v-icon></v-btn
                      >
                      <br />
                      <a
                        href="#"
                        @click="
                          openWindow(
                            state.isMainnet
                              ? 'https://bscscan.com/address/' +
                                  account.bscAddress
                              : 'https://testnet.bscscan.com/address/' +
                                  account.bscAddress
                          )
                        "
                        >{{ $t("home.viewOnExplorer") }}</a
                      >
                      <v-list>
                        <v-list-item-group>
                          <v-list-item
                            v-for="bal in state.bscBalances"
                            :key="bal.symbol"
                            style="cursor: default"
                          >
                            <v-list-item-content>
                              <v-img
                                class="mr-3"
                                :src="getAssetIcon(bal)"
                                max-width="24px"
                              ></v-img
                              >{{ formatSymbol(bal.amount, bal.symbol) }}
                            </v-list-item-content>
                            <v-list-item-action style="display: inline">
                              <a href="#" @click.prevent="askSendBsc(bal)">{{
                                $t("home.send").toLowerCase()
                              }}</a>
                            </v-list-item-action>
                          </v-list-item>
                        </v-list-item-group>
                      </v-list>
                    </div>
                    {{ $t("home.or") }}
                    <a href="#" @click.prevent="askExportPrivateKeyHex">{{
                      $t("home.exportPrivateKey")
                    }}</a>
                    {{ $t("home.andImportInMetamask")
                    }}<v-btn
                      icon
                      x-small
                      @click="
                        openWindow(
                          'https://metamask.zendesk.com/hc/en-us/articles/360015489331-How-to-import-an-Account'
                        )
                      "
                      ><v-icon size="16">mdi-information-outline</v-icon></v-btn
                    >
                    <br />
                  </v-expansion-panel-content>
                </v-expansion-panel>
              </v-expansion-panels>
            </div>
          </div>
          <div v-else class="pa-6">
            <v-spacer class="ma-9" />
            {{ $t("home.swapExplanation") }}
            <v-btn
              block
              class="mt-6"
              @click="generateSwapAddressDialog = true"
              >{{ $t("home.continue") }}</v-btn
            >
          </div>
          <div class="pa-3"></div>
        </v-tab-item>
      </v-tabs>
    </v-main>

    <v-dialog v-if="claimDialog" v-model="claimDialog" max-width="290">
      <v-card>
        <v-card-title class="headline"
          >{{ $t("home.claim") }} KCAL?</v-card-title
        >

        <v-card-text>
          {{ $t("home.claimDesc1") }}
          {{ getKcalUnclaimed() }} {{ $t("home.claimDesc2") }}

          <v-spacer />
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn color="gray darken-1" text @click="claimDialog = false">
            {{ $t("home.disagree") }}
          </v-btn>

          <v-btn color="blue darken-1" text @click="askClaimKcal">
            {{ $t("home.agree") }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="stakeDialog" max-width="290">
      <v-card>
        <v-card-title class="headline"
          >{{ $t("home.stakeTitle") }} SOUL</v-card-title
        >

        <v-card-text class="pb-0">
          {{ $t("home.have") }} {{ getUnstackedSoul() }} SOUL.
          {{ $t("home.haveStake") }}

          <v-slider
            v-model="stakeSoulAmount"
            :min="1"
            :max="getUnstackedSoul()"
            :value="1"
            step="0.01"
            thumb-label="always"
            style="margin-top:40px"
          >
            <template v-slot:thumb-label="{ value }">
              {{ Math.round((100 * value) / parseFloat(getUnstackedSoul())) }}%
            </template></v-slider
          >
          <v-row style="margin-top:-25px">
            <v-col class="mt-3">
              {{ $t("home.addStakes") }}
            </v-col>
            <v-col>
              <v-text-field
                class="mt-0 mr-2"
                v-model="stakeSoulAmount"
                :min="1"
                :max="getUnstackedSoul()"
                single-line
                type="number"
                suffix="SOUL"
                style="width:120px"
              ></v-text-field>
            </v-col>
          </v-row>
          <v-row style="margin-top:-18px">
            <v-col class="mt-3">
              {{ $t("home.resultStakes") }}
            </v-col>
            <v-col>
              <v-text-field
                class="mt-0 mr-2"
                :value="
                  parseFloat(getStackedSoul()) + parseFloat(stakeSoulAmount)
                "
                single-line
                type="number"
                suffix="SOUL"
                style="width:120px"
                disabled
              ></v-text-field>
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn color="gray darken-1" text @click="stakeDialog = false">
            {{ $t("home.cancel") }}
          </v-btn>

          <v-btn color="blue darken-1" text @click="askStakeSoul">
            {{ $t("home.stake") }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="unstakeDialog" max-width="290">
      <v-card>
        <v-card-title class="headline"
          >{{ $t("home.unstakeTitle") }} SOUL</v-card-title
        >

        <v-card-text class="pb-0">
          {{ $t("home.have") }} {{ getStackedSoul() }}
          {{ $t("home.haveUnstake") }}

          <v-slider
            v-model="unstakeSoulAmount"
            :min="1"
            :max="getStackedSoul()"
            :value="1"
            step="0.01"
            thumb-label="always"
            style="margin-top:40px"
          >
            <template v-slot:thumb-label="{ value }">
              {{ Math.round((100 * value) / parseFloat(getStackedSoul())) }}%
            </template></v-slider
          >
          <v-row class="mb-0" style="margin-top:-25px">
            <v-col class="mt-3">
              {{ $t("home.removeStakes") }}
            </v-col>
            <v-col>
              <v-text-field
                :min="1"
                :max="getStackedSoul()"
                class="mt-0 mr-2"
                v-model="unstakeSoulAmount"
                single-line
                type="number"
                suffix="SOUL"
                style="width:120px"
              ></v-text-field>
            </v-col>
          </v-row>
          <v-row style="margin-top:-20px">
            <v-col class="mt-3">
              {{ $t("home.resultStakes") }}
            </v-col>
            <v-col>
              <v-text-field
                class="mt-0 mr-2"
                :value="
                  parseFloat(getStackedSoul()) - parseFloat(unstakeSoulAmount)
                "
                single-line
                type="number"
                suffix="SOUL"
                style="width:120px"
                disabled
              ></v-text-field>
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn color="gray darken-1" text @click="unstakeDialog = false">
            {{ $t("home.cancel") }}
          </v-btn>

          <v-btn color="blue darken-1" text @click="askUnstakeSoul">
            {{ $t("home.unstake") }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="sendDialog" max-width="290">
      <v-card>
        <v-card-title class="headline"
          >{{ $t("home.send") }} {{ sendSymbol }}</v-card-title
        >

        <v-card-text class="pb-0">
          {{ $t("home.have") }} {{ sendMaxAmount }} {{ sendSymbol }}.
          {{ $t("home.sendAmount2") }}

          <v-slider
            v-model="sendAmount"
            :min="sendSymbol === 'ETH' || sendSymbol === 'BNB' ? 0.0001 : 0.01"
            :max="sendMaxAmount"
            :value="1"
            :step="
              sendSymbol === 'ETH' || sendSymbol === 'BNB'
                ? 0.0001
                : state.decimals(sendSymbol) === 0
                ? 1
                : 0.01
            "
            thumb-label="always"
            style="margin-top:40px"
          >
            <template v-slot:thumb-label="{ value }">
              {{ Math.round((100 * value) / sendMaxAmount) }}%
            </template></v-slider
          >
          <v-row style="margin-top:-25px">
            <v-col class="mt-3">
              {{ $t("home.sendAmount") }}
            </v-col>
            <v-col>
              <v-text-field
                class="mt-0 mr-2"
                v-model="sendAmount"
                :min="1"
                :max="sendMaxAmount"
                single-line
                type="number"
                :suffix="sendSymbol"
                style="width:120px"
              ></v-text-field>
            </v-col>
          </v-row>
          <v-row style="margin-top:-20px">
            <v-col class="mt-4">
              {{ $t("home.remaining") }}
            </v-col>
            <v-col>
              <v-text-field
                class="mt-0 mr-2"
                :value="sendMaxAmount - sendAmount"
                single-line
                type="number"
                :suffix="sendSymbol"
                style="width:120px"
                disabled
              ></v-text-field>
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn color="gray darken-1" text @click="sendDialog = false">
            {{ $t("home.cancel") }}
          </v-btn>

          <v-btn color="blue darken-1" text @click="askSendWhere">
            {{ $t("home.next") }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="sendWhereDialog" max-width="290">
      <v-card>
        <v-card-title class="headline">{{
          $t("home.destination")
        }}</v-card-title>

        <v-card-text>
          <span>
            {{ $t("home.destinationDesc") }} {{ sendAmount }} {{ sendSymbol }}
          </span>
          <br />
          <v-spacer />

          <v-form class="mt-5" @submit.prevent>
            <v-combobox
              :items="accountSendList"
              :label="$t('home.labelDest')"
              v-model="sendDestination"
              required
              autocorrect="off"
              autocapitalize="off"
              spellcheck="false"
              prepend-inner-icon="mdi-account"
            >
              <!-- <template v-slot:selection="data">
                <div>
                  <strong>{{ data.item.name }}</strong>
                  <br />
                  {{ data.item.address }}
                </div>
              </template> -->
              <template v-slot:item="data">
                <div>
                  <strong style="font-size:14px">{{ data.item.name }}</strong>
                  <br />
                  {{ data.item.address }}
                </div>
              </template>
            </v-combobox>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn color="gray darken-1" text @click="sendWhereDialog = false">
            {{ $t("home.cancel") }}
          </v-btn>

          <v-btn color="blue darken-1" text @click="askSend">
            {{ $t("home.next") }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="burnDialog" max-width="290">
      <v-card>
        <v-card-title class="headline"
          >{{ $t("home.burn") }} {{ burnSymbol }}</v-card-title
        >

        <v-card-text class="pb-0">
          {{ $t("home.have") }} {{ burnMaxAmount }} {{ burnSymbol }}.
          {{ $t("home.burnAmount2") }}
          <v-slider
            v-model="burnAmount"
            :min="0.01"
            :max="burnMaxAmount"
            :value="1"
            :step="state.decimals(sendSymbol) === 0 ? 1 : 0.01"
            thumb-label="always"
            style="margin-top:40px"
          >
            <template v-slot:thumb-label="{ value }">
              {{ Math.round((100 * value) / burnMaxAmount) }}%
            </template></v-slider
          >
          <v-row style="margin-top:-25px">
            <v-col class="mt-3">
              {{ $t("home.burnAmount") }}
            </v-col>
            <v-col>
              <v-text-field
                class="mt-0 mr-2"
                v-model="burnAmount"
                :min="1"
                :max="burnMaxAmount"
                single-line
                type="number"
                :suffix="burnSymbol"
                style="width:120px"
              ></v-text-field>
            </v-col>
          </v-row>
          <v-row style="margin-top:-20px">
            <v-col class="mt-4">
              {{ $t("home.remaining") }}
            </v-col>
            <v-col>
              <v-text-field
                class="mt-0 mr-2"
                :value="burnMaxAmount - burnAmount"
                single-line
                type="number"
                :suffix="burnSymbol"
                style="width:120px"
                disabled
              ></v-text-field>
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn color="gray darken-1" text @click="burnDialog = false">
            {{ $t("home.cancel") }}
          </v-btn>

          <v-btn color="blue darken-1" text @click="askBurnConfirmation">
            {{ $t("home.next") }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="burnConfirmationDialog" max-width="290">
      <v-card>
        <v-card-title class="headline">{{
          $t("home.burnConfirmation")
        }}</v-card-title>

        <v-card-text>
          <span>
            {{ $t("home.burnConfirmation1") }} {{ burnAmount }}
            {{ burnSymbol }}.
            <span v-html="$t('home.burnConfirmation2')"></span>
          </span>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn
            color="gray darken-1"
            text
            @click="burnConfirmationDialog = false"
          >
            {{ $t("home.cancel") }}
          </v-btn>

          <v-btn color="blue darken-1" text @click="askBurn">
            {{ $t("home.next") }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="signTxDialog" max-width="290">
      <v-card>
        <v-card-title class="headline">{{ $t("home.authorize") }}</v-card-title>

        <v-card-text>
          <span v-if="needsWif">
            {{ $t("home.insertWIF") }}
          </span>
          <span v-if="needsPass">
            {{ $t("home.insertPassword") }}
          </span>
          <v-spacer class="ma-4" />

          <v-form
            class="mt-3"
            v-if="needsWif"
            @keyup.native.enter="doSignTx"
            @submit.prevent
          >
            <v-text-field
              tabindex="1"
              type="password"
              label="WIF"
              v-model="wif"
              required
              autocorrect="off"
              autocapitalize="off"
              spellcheck="false"
              prepend-inner-icon="mdi-key"
              counter="52"
            />
          </v-form>

          <v-form
            v-if="needsPass"
            @keyup.native.enter="doSignTx"
            @submit.prevent
          >
            <v-text-field
              tabindex="1"
              type="password"
              :label="$t('home.labelPassword')"
              v-model="password"
              required
              autocorrect="off"
              autocapitalize="off"
              spellcheck="false"
              prepend-inner-icon="mdi-lock"
            />
          </v-form>
        </v-card-text>

        <v-card-text v-if="isMissingKCAL">
          {{ $t("home.cosmicSwap") }}
        </v-card-text>

        <v-card-actions v-if="isMissingKCAL">
          <v-spacer></v-spacer>

          <v-btn color="gray darken-1" text @click="closeSignTx">
            {{ $t("home.cancel") }}
          </v-btn>

          <v-btn color="blue darken-1" text @click="doCosmicSwap">
            {{ $t("home.agree") }}
          </v-btn>
        </v-card-actions>

        <v-card-actions v-else>
          <v-spacer></v-spacer>

          <v-btn color="gray darken-1" text @click="closeSignTx">
            {{ $t("home.cancel") }}
          </v-btn>

          <v-btn color="blue darken-1" text @click="doSignTx">
            {{ $t("home.sign") }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="registerNameDialog" max-width="290">
      <v-card>
        <v-card-title class="headline">{{ $t("home.register") }}</v-card-title>

        <v-card-text>
          <span>
            {{ $t("home.registerDescription") }}
          </span>
          <br />
          <v-spacer class="ma-4" />

          <v-text-field
            v-model="nameToRegister"
            :label="$t('home.labelPick')"
          ></v-text-field>

          <span>
            {{ $t("home.registerHints") }}
          </span>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn color="gray darken-1" text @click="registerNameDialog = false">
            {{ $t("home.cancel") }}
          </v-btn>

          <v-btn
            color="blue darken-1"
            text
            :disabled="
              nameToRegister.length < 3 ||
                nameToRegister.length > 15 ||
                nameToRegister == 'anonymous' ||
                nameToRegister == 'genesis' ||
                nameToRegister.toLowerCase() != nameToRegister ||
                isCharNumber(nameToRegister.charAt(0))
            "
            @click="askRegisterName"
          >
            {{ $t("home.next") }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-if="account" v-model="selectAssetToSwapDialog" max-width="290">
      <v-card>
        <v-card-title class="headline">{{
          $t("home.selectAssetUppercase")
        }}</v-card-title>

        <v-card-text class="pb-0">
          <span>
            {{ $t("home.availableToSwap") }}
            {{
              swapToChain.toUpperCase() === "ETH"
                ? "Ethereum"
                : swapToChain.toUpperCase() === "BSC"
                ? "BSC"
                : "NEO"
            }}.
          </span>
          <br />
          <v-list style="margin-left:-8px; margin-right:-8px;">
            <v-list-item-group>
              <template v-for="bal in account.data.balances">
                <v-list-item
                  v-if="isSwappable(bal.symbol, swapToChain)"
                  :key="bal.symbol"
                >
                  <v-list-item-content>
                    <v-img
                      class="mr-3"
                      :src="getAssetIcon(bal)"
                      max-width="24px"
                    ></v-img
                    >{{ getAmount(bal) }} {{ bal.symbol }}
                  </v-list-item-content>
                  <v-list-item-action>
                    <a href="#" @click="askAmountToSwap(bal)">{{
                      $t("home.send").toLowerCase()
                    }}</a>
                  </v-list-item-action>
                </v-list-item>
              </template>
            </v-list-item-group>
          </v-list>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="gray darken-1"
            text
            @click="selectAssetToSwapDialog = false"
          >
            {{ $t("home.cancel") }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="swapAmountDialog" max-width="290">
      <v-card>
        <v-card-title class="headline">{{
          swapFromChain == swapToChain
            ? $t("home.send") + " " + sendSymbol
            : $t("home.send") + " " + sendSymbol
        }}</v-card-title>

        <v-card-text class="pb-0">
          {{ $t("home.have") }} {{ sendMaxAmount }} {{ sendSymbol }}.
          {{
            swapFromChain == swapToChain
              ? $t("home.sendAmount2")
              : $t("home.sendAmount2")
          }}

          <v-slider
            v-model="sendAmount"
            :min="sendSymbol === 'ETH' || sendSymbol === 'BNB' ? 0.0001 : 0.01"
            :max="sendMaxAmount"
            :value="1"
            :step="
              sendSymbol === 'ETH' || sendSymbol === 'BNB'
                ? 0.0001
                : state.decimals(sendSymbol) === 0
                ? 1
                : 0.01
            "
            thumb-label="always"
            style="margin-top:40px"
          >
            <template v-slot:thumb-label="{ value }">
              <span v-if="sendMaxAmount > 0"
                >{{ Math.round((100 * value) / sendMaxAmount) }}%</span
              >
              <span v-else>0</span>
            </template></v-slider
          >
          <v-row style="margin-top:-25px">
            <v-col class="mt-3">
              {{ $t("home.sendAmount") }}
            </v-col>
            <v-col>
              <v-text-field
                class="mt-0 mr-2"
                v-model="sendAmount"
                :min="1"
                :max="sendMaxAmount"
                single-line
                type="number"
                :suffix="sendSymbol"
                style="width:120px"
              ></v-text-field>
            </v-col>
          </v-row>
          <v-row class="mt-8 mb-4">
            <!-- <v-col class="mt-4">
              {{ $t("home.remaining") }}
            </v-col>
            <v-col>
              <v-text-field
                class="mt-0 mr-2"
                :value="sendMaxAmount - sendAmount"
                single-line
                type="number"
                :suffix="sendSymbol"
                style="width:120px"
                disabled
              ></v-text-field>
            </v-col> -->
            <template v-if="swapFromChain === 'bsc'">
              <div class="mx-auto" style="display:inherit">
                <v-icon class="mr-2">mdi-tortoise</v-icon>
                <div
                  class="pa-1"
                  style="border:16px; background-color:#eee; border-radius:32px"
                >
                  <v-icon
                    @click="swapGasIndex = 0"
                    class="mr-3"
                    :color="swapGasIndex == 0 ? 'blue darken-3' : ''"
                    >mdi-circle{{ swapGasIndex !== 0 ? "-medium" : "" }}</v-icon
                  ><v-icon
                    @click="swapGasIndex = 1"
                    class="mr-3"
                    :color="swapGasIndex == 1 ? 'blue darken-3' : ''"
                    >mdi-circle{{ swapGasIndex !== 1 ? "-medium" : "" }}</v-icon
                  ><v-icon
                    @click="swapGasIndex = 2"
                    :color="swapGasIndex == 2 ? 'blue darken-3' : ''"
                    >mdi-circle{{ swapGasIndex !== 2 ? "-medium" : "" }}</v-icon
                  >
                </div>
                <v-icon class="ml-2">mdi-rabbit</v-icon>
              </div>
              <br />
              <div class="mx-auto" style="font-size:13px">
                {{
                  swapGasIndex == 0
                    ? $t("home.feeSlow")
                    : swapGasIndex == 1
                    ? $t("home.feeStandard")
                    : $t("home.feeFast")
                }}
                {{ bscGasPrices[swapGasIndex] }} Gwei (~{{ state.currencySymbol
                }}{{ getFeeBsc(bscGasPrices[swapGasIndex], sendSymbol) }})
              </div>
            </template>
            <template v-if="swapFromChain === 'eth'">
              <div class="mx-auto" style="display:inherit">
                <v-icon class="mr-2">mdi-tortoise</v-icon>
                <div
                  class="pa-1"
                  style="border:16px; background-color:#eee; border-radius:32px"
                >
                  <v-icon
                    @click="swapGasIndex = 0"
                    class="mr-3"
                    :color="swapGasIndex == 0 ? 'blue darken-3' : ''"
                    >mdi-circle{{ swapGasIndex !== 0 ? "-medium" : "" }}</v-icon
                  ><v-icon
                    @click="swapGasIndex = 1"
                    class="mr-3"
                    :color="swapGasIndex == 1 ? 'blue darken-3' : ''"
                    >mdi-circle{{ swapGasIndex !== 1 ? "-medium" : "" }}</v-icon
                  ><v-icon
                    @click="swapGasIndex = 2"
                    :color="swapGasIndex == 2 ? 'blue darken-3' : ''"
                    >mdi-circle{{ swapGasIndex !== 2 ? "-medium" : "" }}</v-icon
                  >
                </div>
                <v-icon class="ml-2">mdi-rabbit</v-icon>
              </div>
              <br />
              <div class="mx-auto" style="font-size:13px">
                {{
                  swapGasIndex == 0
                    ? $t("home.feeSlow")
                    : swapGasIndex == 1
                    ? $t("home.feeStandard")
                    : $t("home.feeFast")
                }}
                {{ ethGasPrices[swapGasIndex] }} Gwei (~{{ state.currencySymbol
                }}{{ getFeeEth(ethGasPrices[swapGasIndex], sendSymbol) }})
              </div>
            </template>
            <template v-if="swapFromChain === 'neo'">
              <div class="mx-auto" style="display:inherit">
                <v-icon class="mr-2">mdi-tortoise</v-icon>
                <div
                  class="pa-1"
                  style="border:16px; background-color:#eee; border-radius:32px"
                >
                  <v-icon
                    @click="swapGasIndex = 0"
                    class="mr-3"
                    :color="swapGasIndex == 0 ? 'blue darken-3' : ''"
                    >mdi-circle{{ swapGasIndex !== 0 ? "-medium" : "" }}</v-icon
                  ><v-icon
                    @click="swapGasIndex = 1"
                    class="mr-3"
                    :color="swapGasIndex == 1 ? 'blue darken-3' : ''"
                    >mdi-circle{{ swapGasIndex !== 1 ? "-medium" : "" }}</v-icon
                  ><v-icon
                    @click="swapGasIndex = 2"
                    :color="swapGasIndex == 2 ? 'blue darken-3' : ''"
                    >mdi-circle{{ swapGasIndex !== 2 ? "-medium" : "" }}</v-icon
                  >
                </div>
                <v-icon class="ml-2">mdi-rabbit</v-icon>
              </div>
              <br />
              <div class="mx-auto" style="font-size:13px">
                {{
                  swapGasIndex == 0
                    ? $t("home.feeSlow")
                    : swapGasIndex == 1
                    ? $t("home.feeStandard")
                    : $t("home.feeFast")
                }}
                {{ neoGasPrices[swapGasIndex] }} GAS {{ $t("home.fee") }} (~{{
                  state.currencySymbol
                }}{{ getFeeNeo(neoGasPrices[swapGasIndex]) }})
              </div>
            </template>
            <div
              v-if="swapToChain === 'neo' && swapFromChain !== 'neo'"
              class="mx-auto"
            >
              {{ $t("home.swapNeed") }} {{ gasFeeAmount }} GAS (~{{
                state.currencySymbol
              }}{{ getFeeNeo(gasFeeAmount) }})
            </div>
            <div
              v-if="swapToChain === 'eth' && swapFromChain !== 'eth'"
              class="mx-auto"
            >
              {{ $t("home.swapNeed") }}
              {{
                (
                  Math.round(
                    (sendSymbol == "ETH" ? 21000 : 100000) *
                      ethGasPrices[1] *
                      1.2
                  ) / 1e9
                ).toFixed(4)
              }}
              ETH (~{{ state.currencySymbol
              }}{{ getFeeEth(ethGasPrices[1], sendSymbol) }})
            </div>
            <div
              v-if="swapToChain === 'bsc' && swapFromChain !== 'bsc'"
              class="mx-auto"
            >
              {{ $t("home.swapNeed") }}
              {{
                (
                  Math.round(
                    (sendSymbol == "BNB" ? 21000 : 100000) *
                      bscGasPrices[1] *
                      1.2
                  ) / 1e9
                ).toFixed(4)
              }}
              BNB (~{{ state.currencySymbol
              }}{{ getFeeBsc(bscGasPrices[1], sendSymbol) }})
            </div>
          </v-row>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn color="gray darken-1" text @click="swapAmountDialog = false">
            {{ $t("home.cancel") }}
          </v-btn>

          <v-btn color="blue darken-1" text @click="onSwapAmountClick">
            {{ $t("home.next") }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="destinationSwapDialog" max-width="290">
      <v-card>
        <v-card-title class="headline">{{
          swapFromChain == swapToChain
            ? $t("home.destination")
            : $t("home.swapDestination")
        }}</v-card-title>

        <v-card-text class="pb-0">
          <span>
            {{ $t("home.write") }} {{ swapToChain.toUpperCase() }}
            {{ $t("home.destinationAddress") }}
          </span>
          <br />
          <v-spacer class="ma-4" />

          <v-text-field
            v-model="sendDestination"
            :label="
              formatChain(swapToChain) + ' ' + $t('home.destinationAddress')
            "
          ></v-text-field>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn
            color="gray darken-1"
            text
            @click="destinationSwapDialog = false"
          >
            {{ $t("home.cancel") }}
          </v-btn>

          <v-btn
            color="blue darken-1"
            text
            :disabled="
              (swapToChain == 'neo' && !sendDestination.startsWith('A')) ||
                (swapToChain == 'eth' &&
                  (!sendDestination.startsWith('0x') ||
                    sendDestination.length != 42)) ||
                (swapToChain == 'bsc' &&
                  (!sendDestination.startsWith('0x') ||
                    sendDestination.length != 42))
            "
            @click="
              destinationSwapDialog = false;
              signTxDialog = true;
            "
          >
            {{ $t("home.next") }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog
      v-if="swapInProgressDialog"
      v-model="swapInProgressDialog"
      max-width="290"
    >
      <v-card>
        <v-card-title class="headline">{{
          swapFromChain === swapToChain
            ? $t("home.sendInProgress")
            : $t("home.swapInProgressTitle")
        }}</v-card-title>

        <v-card-text>
          {{
            swapFromChain === swapToChain
              ? $t("home.sendBeingProcessed")
              : $t("home.swapBeingProcessed")
          }}
          {{
            swapFromChain == "eth" || swapFromChain == "bsc"
              ? $t("home.needsConfirmations")
              : ""
          }}
          {{ $t("home.checkTransaction") }}
          <a :href="lastSwapTxUrl" target="_blank" rel="noopener noreferrer">{{
            $t("home.here")
          }}</a>

          <v-spacer />
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn
            color="blue darken-1"
            text
            @click="swapInProgressDialog = false"
          >
            {{ $t("home.continue") }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="generateSwapAddressDialog" max-width="290">
      <v-card>
        <v-card-title class="headline">{{
          $t("home.enableSwaps")
        }}</v-card-title>

        <v-card-text>
          <span v-if="needsWif">
            {{ $t("home.insertSwapsWIF") }}
          </span>
          <span v-if="needsPass">
            {{ $t("home.insertSwapsPassword") }}
          </span>
          <v-spacer />

          <v-form
            class="mt-3"
            v-if="needsWif"
            @keyup.native.enter="doGenerateSwapAddress"
            @submit.prevent
          >
            <v-text-field
              tabindex="1"
              type="password"
              label="WIF"
              v-model="wif"
              required
              autocorrect="off"
              autocapitalize="off"
              spellcheck="false"
              prepend-inner-icon="mdi-key"
              counter="52"
            />
          </v-form>

          <v-form
            v-if="needsPass"
            @keyup.native.enter="doGenerateSwapAddress"
            @submit.prevent
          >
            <v-text-field
              tabindex="1"
              type="password"
              :label="$t('home.labelPassword')"
              v-model="password"
              required
              autocorrect="off"
              autocapitalize="off"
              spellcheck="false"
              prepend-inner-icon="mdi-lock"
            />
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn color="gray darken-1" text @click="closeSignTx">
            {{ $t("home.cancel") }}
          </v-btn>

          <v-btn color="blue darken-1" text @click="doGenerateSwapAddress">
            {{ $t("home.continue") }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showPrivateKeyDialog" max-width="290">
      <v-card>
        <v-card-title class="headline">{{
          $t("wallets.titlePrivateKey")
        }}</v-card-title>

        <v-card-text>
          <span>
            {{ $t("wallets.keyExplanation") }}
          </span>
          <v-spacer class="ma-4" />

          <v-textarea
            v-model="hexPk"
            readonly
            :label="$t('wallets.labelHEX')"
            rows="3"
          ></v-textarea>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn
            color="blue darken-1"
            text
            @click="
              hexPk = '';
              showPrivateKeyDialog = false;
            "
          >
            {{ $t("home.continue") }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <ErrorDialog
      :show="errorDialog"
      :message="errorMessage"
      @close="errorDialog = false"
    />
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import {
  PhantasmaAPI,
  Account,
  Transaction,
  getPrivateKeyFromWif,
  Balance,
  TransactionData,
  ScriptBuilder,
  Swap,
} from "@/phan-js";

import { hexToByteArray, byteArrayToHex, reverseHex } from "@/phan-js/utils";

import {
  state,
  TxArgsData,
  PopupState,
  ISymbolAmount,
} from "@/popup/PopupState";
import { Script } from "vm";
import ErrorDialogVue from "@/components/ErrorDialog.vue";
import TransactionComponent from "@/components/TransactionComponent.vue";
import { Watch } from "vue-property-decorator";
import { getScriptHashFromAddress, sendNeo } from "@/neo";
import { getEthBalances, JSONRPC } from "@/ethereum";
import { getBscBalances, JSONRPCBSC } from "@/bsc";
import { Transaction as EthereumTx } from "ethereumjs-tx";
import Common from "ethereumjs-common";

@Component({
  components: { ErrorDialog: ErrorDialogVue, TransactionComponent },
})
export default class extends Vue {
  requestInProcess = false;
  isLoading = true;
  panel = [];
  offsetTxPage = 0;
  txs: TransactionData[] = [];
  loadingTxs = [0, 1, 2, 3, 4, 5, 6, 7];
  showLoadMore = false;

  activeTab = 0;

  claimDialog = false;
  stakeDialog = false;
  unstakeDialog = false;
  sendDialog = false;
  sendWhereDialog = false;
  burnDialog = false;
  burnConfirmationDialog = false;
  registerNameDialog = false;
  selectAssetToSwapDialog = false;
  swapAmountDialog = false;
  destinationSwapDialog = false;
  generateSwapAddressDialog = false;
  swapFromBscDialog = false;
  swapFromEthDialog = false;
  swapFromNeoDialog = false;
  swapInProgressDialog = false;
  showPrivateKeyDialog = false;

  stakeSoulAmount = 0;
  unstakeSoulAmount = 0;
  sendAmount = 0;
  sendMaxAmount = 0;
  sendSymbol = "";
  sendDecimals = 0;
  sendDestination = "";
  nameToRegister = "";

  swapToCustomDest = false;
  swapToChain = "";
  swapFromChain = "";

  burnAmount = 0;
  burnMaxAmount = 0;
  burnSymbol = "";
  burnDecimals = 0;

  lastSwapTx = "";
  lastSwapTxUrl = "";

  errorDialog = false;
  errorMessage = "";

  signTxDialog = false;
  signTxCallback: (() => void) | null = null;

  swapToClaim: Swap | null = null;

  bscGasPrices: number[] = [10, 20, 30];
  ethGasPrices: number[] = [50, 70, 100];
  neoGasPrices: number[] = [0.0, 0.0011, 0.1];
  swapGasIndex = 1;
  gasFeeAmount = "0.1";

  state = state;

  wif = "";
  password = "";
  hexPk = "";

  async mounted() {
    (window as any).state = state;
    await state.check(this.$parent.$i18n);
    await Promise.all([
      this.state.refreshCurrentAccount(),
      this.state.fetchRates(),
    ]);
    this.isLoading = false;

    console.log("all loaded with " + JSON.stringify(this.account));

    this.$root.$on("loading", (value: boolean) => {
      this.isLoading = value;
    });
  }

  goto(route: string) {
    this.$router.push(route);
  }

  get nftArray() {
    return Object.keys(this.state.nfts).map((k) =>
      Object.assign({ id: k }, this.state.nfts[k])
    );
  }

  get nfts() {
    return this.state.nfts;
  }

  get account() {
    return this.state.currentAccount;
  }

  get accountSendList() {
    return this.state.accounts
      .filter((a) => a.address !== this.account!.address)
      .map((a) => {
        const addr = a.address;
        return {
          text: a.data.name != "anonymous" ? a.data.name : a.address,
          name: a.data.name,
          value: a.data.name != "anonymous" ? a.data.name : a.address,
          address:
            addr.substring(0, 10) +
            "..." +
            addr.substring(addr.length - 8, addr.length),
        };
      });
  }

  get needsWif() {
    const account = state.currentAccount;
    if (!account) return true;

    return account.type != "encKey" && account.type != "wif";
  }

  get needsPass() {
    const account = state.currentAccount;
    return account && account.type == "encKey";
  }

  get shorterAddress(): string {
    if (!this.account) return this.$t("home.errorMessage1").toString();

    if (this.account.data.name && this.account.data.name != "")
      return this.account.data.name;

    const addr = this.account.address;
    return (
      addr.substring(0, 6) +
      "..." +
      addr.substring(addr.length - 4, addr.length)
    );
  }

  get shortAddress(): string {
    if (!this.account) return this.$t("home.errorMessage1").toString();

    let addr = this.account.address;
    return (
      addr.substring(0, 10) +
      "..." +
      addr.substring(addr.length - 8, addr.length)
    );
  }

  get isMissingKCAL(): boolean {
    if (!this.account) return true;

    const kcalBalance = this.account.data.balances.find(
      (b) => b.symbol == "KCAL"
    );

    const soulBalance = this.account.data.balances.find(
      (b) => b.symbol == "SOUL"
    );

    if (soulBalance && parseFloat(soulBalance.amount) < 0.02) return false;

    if (!kcalBalance?.amount || !soulBalance?.amount) return true;

    if (
      parseFloat(kcalBalance.amount) / 10 ** kcalBalance.decimals > 0.1 ||
      parseFloat(soulBalance.amount) / 10 ** soulBalance.decimals < 0.02
    )
      return false;

    return true;
  }

  @Watch("state.nexus")
  onWatchNexus(oldValue: string, newValue: string) {
    if (this.activeTab == 1) {
      this.onActivityTab(); // refresh activity tab on nexus change
    }
  }

  getTime(timestamp: number) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString();
  }

  getDate(timestamp: number) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString();
  }

  getFeeNeo(gas: number) {
    const currencyPrice = state.getRate("GAS");
    const feesValue = gas * currencyPrice;
    return feesValue.toFixed(2);
  }

  getFeeEth(gwei: number, symbol: string) {
    const gasLimit = symbol == "ETH" ? 21000 : 100000;
    const currencyPrice = state.getRate("ETH");
    const decimals = 18;
    const decimalsGas = 9;
    const fees = (gwei * 10 ** decimalsGas * gasLimit) / 10 ** decimals;
    const feesValue = fees * currencyPrice;
    return feesValue.toFixed(2);
  }

  getFeeBsc(gwei: number, symbol: string) {
    const gasLimit = symbol == "BNB" ? 21000 : 100000;
    const currencyPrice = state.getRate("BNB");
    const decimals = 18;
    const decimalsGas = 9;
    const fees = (gwei * 10 ** decimalsGas * gasLimit) / 10 ** decimals;
    const feesValue = fees * currencyPrice;
    return feesValue.toFixed(2);
  }

  formatHash(hash: string) {
    return (
      hash.substring(0, 8) +
      "..." +
      hash.substring(hash.length - 6, hash.length)
    );
  }

  isCharNumber(c: string) {
    return c >= "0" && c <= "9";
  }

  getExplorerLink(hash: string) {
    return (
      (state.nexus == "testnet"
        ? "http://testnet.phantasma.io/tx/"
        : state.nexus == "simnet"
        ? "https://localhost:7088/"
        : "https://explorer.phantasma.io/tx/") + hash
    );
  }

  getAssetIcon(item: Balance) {
    if (this.isNewLogo(item.symbol.toLowerCase())) return `assets/default.png`;
    return `assets/${item.symbol}.png`;
  }

  isNewLogo(symbol: string) {
    switch (symbol) {
      case "brc":
        return false;
      case "crown":
        return false;
      case "dai":
        return false;
      case "dank":
        return false;
      case "dyt":
        return false;
      case "eth":
        return false;
      case "game":
        return false;
      case "gas":
        return false;
      case "gfest":
        return false;
      case "ghost":
        return false;
      case "goati":
        return false;
      case "kcal":
        return false;
      case "mkni":
        return false;
      case "muu":
        return false;
      case "neo":
        return false;
      case "soul":
        return false;
      case "ttrs":
        return false;
      case "usdc":
        return false;
      case "usdt":
        return false;
      case "sem":
        return false;
      case "bnb":
        return false;
      case "busd":
        return false;
      default:
        return true;
    }
  }

  getAmount(balance: Balance) {
    return this.formatBalance(
      balance.amount,
      balance.decimals,
      balance.symbol == "ETH" || balance.symbol == "BNB" ? 3 : 2
    );
  }

  formatSymbol(amount: number | string | BigInt, symbol: string) {
    const value = amount.toString();

    if (!this.state.balanceShown) return "***" + " " + symbol;

    return (
      this.formatBalance(
        value,
        state.decimals(symbol),
        symbol == "ETH" || symbol == "BNB" ? 3 : 2
      ) +
      " " +
      symbol
    );
  }

  formatChain(name: string) {
    switch (name) {
      case "neo":
        return "NEO";
      case "ethereum":
        return "Ethereum";
      case "bsc":
        return "BSC";
      case "phantasma":
        return "Phantasma";
      default:
        return "";
    }
  }

  getCurrencyValue(balance: Balance) {
    if (!balance) return "";

    const val = parseFloat(
      this.formatBalance(balance.amount, balance.decimals, 5).replace(/ /gi, "")
    );
    const rate = state.getRate(balance.symbol);
    if (rate >= 0) {
      if (!state.balanceShown) return state.currencySymbol + "***";

      return state.currencySymbol + this.formatNumber((val * rate).toFixed(1));
    }
    return "";
  }

  isSecondLineVisible(item: Balance) {
    return item.symbol == "SOUL" || item.symbol == "KCAL";
  }

  getKcalUnclaimed() {
    return this.formatBalance(this.account!.data.unclaimed, 10).replace(
      " ",
      ""
    );
  }

  noKcal() {
    if (!this.account) return true;
    if (!this.account.data) return true;
    if (!this.account.data.balances) return true;
    const kcalBalance = this.account.data.balances.find(
      (b) => b.symbol == "KCAL"
    );

    return kcalBalance == null || kcalBalance.amount == "0";
  }

  getStackedSoul() {
    if (!this.account) return "0";
    return this.formatBalance(this.account.data.stake, 8).replace(/ /gi, "");
  }

  getUnstackedSoul() {
    if (!this.account) return "0";
    if (!this.account.data) return "0";
    if (!this.account.data.balances) return "0";
    const soulBalance = this.account.data.balances.find(
      (b) => b.symbol == "SOUL"
    );
    if (!soulBalance) return "0";
    return this.formatBalance(soulBalance!.amount, 8).replace(/ /gi, "");
  }

  getSecondLine(item: Balance) {
    if (!this.account) return "";

    if (!state.balanceShown && item.symbol == "SOUL")
      return this.$t("home.secondLine1").toString() + " " + "***" + " SOUL";

    if (!state.balanceShown && item.symbol == "KCAL")
      return this.$t("home.secondLine2").toString() + " " + "***" + " KCAL";

    if (item.symbol == "SOUL")
      return (
        this.$t("home.secondLine1").toString() +
        " " +
        this.formatBalance(this.account.data.stake, 8) +
        " SOUL"
      );
    if (item.symbol == "KCAL")
      return (
        this.$t("home.secondLine2").toString() +
        " " +
        this.formatBalance(this.account.data.unclaimed, 10) +
        " KCAL"
      );
  }

  getSecondLineValue(balance: Balance) {
    if (!this.account || !this.account.data || !balance) return "";

    const amount =
      balance.symbol == "SOUL"
        ? this.account.data.stake
        : this.account.data.unclaimed;
    const val = parseFloat(
      this.formatBalance(amount, balance.decimals).replace(/ /gi, "")
    );
    const rate = state.getRate(balance.symbol);
    if (rate >= 0) {
      if (!state.balanceShown) return state.currencySymbol + "***";

      return state.currencySymbol + this.formatNumber((val * rate).toFixed(1));
    }
    return "";
  }

  formatBalance(amount: string, decimals: number, decimalsToShow = 2): string {
    if (decimals == 0) return this.formatNumber(amount);
    while (amount.length < decimals + 1) amount = "0" + amount;

    const intPart = amount.substring(0, amount.length - decimals);
    const decimalPart = amount.substring(
      amount.length - decimals,
      amount.length
    );
    if (parseInt(decimalPart) == 0) return this.formatNumber(intPart);
    if (decimals == 18) decimalsToShow = 3;
    return (
      this.formatNumber(intPart) +
      "." +
      (decimalPart.length >= decimalsToShow
        ? decimalPart.substring(0, decimalsToShow)
        : decimalPart)
    );
  }

  formatNumber(num: any) {
    return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1 ");
  }

  isSwappable(symbol: string, swapToChain: string) {
    const isSwappableToken = state.isSwappable(symbol, swapToChain);
    if (isSwappableToken) return true;
    if (swapToChain == "eth")
      return (
        symbol == "KCAL" ||
        symbol == "SOUL" ||
        symbol == "ETH" ||
        symbol == "DANK"
      );
    else if (swapToChain == "neo")
      return symbol == "SOUL" || symbol == "NEO" || symbol == "GAS";
    else if (swapToChain == "bsc")
      return (
        symbol == "SOUL" ||
        symbol == "KCAL" ||
        symbol == "BNB" ||
        symbol == "BUSD"
      );
    return false;
  }

  openWindow(url: string) {
    window.open(url, "_blank");
  }

  askExportPrivateKeyHex() {
    this.signTxDialog = true;
    this.signTxCallback = this.exportPrivateKeyHex;
  }

  askClaimKcal() {
    this.claimDialog = false;
    this.signTxDialog = true;
    this.signTxCallback = this.claimKcal;
  }

  askStakeSoul() {
    this.stakeDialog = false;
    this.signTxDialog = true;
    this.signTxCallback = this.stakeSoul;
  }

  askUnstakeSoul() {
    this.unstakeDialog = false;
    this.signTxDialog = true;
    this.signTxCallback = this.unstakeSoul;
  }

  askSendWhere() {
    this.sendDialog = false;
    this.sendWhereDialog = true;
  }

  askBurnConfirmation() {
    this.burnDialog = false;
    this.burnConfirmationDialog = true;
  }

  askSend() {
    this.sendWhereDialog = false;
    this.signTxDialog = true;
    this.signTxCallback = this.sendFT;
  }

  askBurn() {
    this.burnConfirmationDialog = false;
    this.signTxDialog = true;
    this.signTxCallback = this.burnFT;
  }

  askRegisterName() {
    this.registerNameDialog = false;
    this.signTxDialog = true;
    this.signTxCallback = this.registerName;
  }

  onSwapAmountClick() {
    this.swapAmountDialog = false;

    // send from chain to same chain
    if (this.swapFromChain == this.swapToChain) {
      this.destinationSwapDialog = true;
      this.sendDestination = "";
      if (this.swapToChain == "eth") this.signTxCallback = this.sendFromEth;
      else if (this.swapToChain == "bsc")
        this.signTxCallback = this.sendFromBsc;
      else this.signTxCallback = this.sendFromNeo;
      return;
    }

    console.log(
      "onSwapAmountClick",
      this.sendAmount,
      this.sendSymbol,
      "from",
      this.swapFromChain,
      "to",
      this.swapToChain
    );

    // send to swap
    if (this.swapFromChain == "eth") {
      console.log("next => sendFromEth");
      this.signTxDialog = true;
      this.signTxCallback = this.sendFromEth;
    } else if (this.swapFromChain == "bsc") {
      console.log("next => sendFromBsc");
      this.signTxDialog = true;
      this.signTxCallback = this.sendFromBsc;
    } else if (this.swapFromChain == "neo") {
      console.log("next => sendFromNeo");
      this.signTxDialog = true;
      this.signTxCallback = this.sendFromNeo;
    } else if (this.swapToChain == "eth") {
      console.log("swap to eth");
      this.signTxCallback = this.swapToEth;
      if (this.swapToCustomDest || !this.account!.ethAddress) {
        this.destinationSwapDialog = true;
        this.sendDestination = "";
      } else {
        this.signTxDialog = true;
        this.sendDestination = this.account!.ethAddress;
      }
    } else if (this.swapToChain == "bsc") {
      console.log("swap to bsc");
      this.signTxCallback = this.swapToBsc;
      if (this.swapToCustomDest || !this.account!.bscAddress) {
        this.destinationSwapDialog = true;
        this.sendDestination = "";
      } else {
        this.signTxDialog = true;
        this.sendDestination = this.account!.bscAddress;
      }
    } else if (this.swapToChain == "neo") {
      console.log("swap to neo");
      this.signTxCallback = this.swapToNeo;
      if (this.swapToCustomDest || !this.account!.neoAddress) {
        this.destinationSwapDialog = true;
        this.sendDestination = "";
      } else {
        this.signTxDialog = true;
        this.sendDestination = this.account!.neoAddress;
      }
    }
  }

  closeSignTx() {
    this.wif = "";
    this.password = "";
    this.signTxCallback = null;
    this.signTxDialog = false;
    this.generateSwapAddressDialog = false;
  }

  doSignTx() {
    if (this.signTxCallback) this.signTxCallback();
    this.signTxCallback = null;
  }

  doCosmicSwap() {
    this.cosmicSwap();
  }

  exportPrivateKeyHex() {
    try {
      this.wif = state.getWifFromPassword(this.password, this.account!);
      this.hexPk = getPrivateKeyFromWif(this.wif);
      this.showPrivateKeyDialog = true;
      this.closeSignTx();
    } catch (err) {
      this.errorMessage = err;
      this.errorDialog = true;
    }
    this.password = "";
  }

  doGenerateSwapAddress() {
    try {
      if (this.needsWif) state.addSwapAddress(this.wif);
      else state.addSwapAddressWithPassword(this.password);
      this.generateSwapAddressDialog = false;
    } catch (err) {
      this.generateSwapAddressDialog = false;
      this.wif = "";
      this.password = "";
      this.errorMessage = err;
      this.errorDialog = true;
    }
  }

  async claimSwap(swap: Swap) {
    console.log("claim swap", swap);
    if (
      swap.destinationPlatform == "neo" ||
      swap.destinationPlatform == "ethereum" ||
      swap.destinationPlatform == "bsc" ||
      (swap.destinationPlatform == "phantasma" && swap.sourcePlatform == "neo")
    ) {
      this.isLoading = true;
      let res = await state.api.settleSwap(
        swap.sourcePlatform,
        swap.destinationPlatform,
        swap.sourceHash
      );
      console.log("settleSwap", res);
      if ((res as any).error) {
        this.$root.$emit("errorMessage", {
          msg: this.$t("app.errorMessage"),
          details: (res as any).error,
        });
      } else {
        setTimeout(async () => {
          await state.refreshCurrentAccount();
          this.isLoading = false;
        }, 2500);
      }
    } else if (swap.destinationPlatform == "phantasma") {
      if (swap.sourcePlatform == "ethereum") {
        this.swapToClaim = swap;
        this.signTxDialog = true;
        this.signTxCallback = this.settleFromEthereumTx;
      }
      if (swap.sourcePlatform == "bsc") {
        this.swapToClaim = swap;
        this.signTxDialog = true;
        this.signTxCallback = this.settleFromBscTx;
      }
    }
  }

  async settleFromEthereumTx() {
    console.log("settle from ethereum tx", this.swapToClaim);
    if (!this.swapToClaim || !this.account) return;

    const swapTxHash = this.swapToClaim.sourceHash;

    const symbol = this.swapToClaim.symbol;

    const address = this.account.address;
    const gasPrice = 100000;
    const minGasLimit = 2100;

    let transcodeAddress = "";

    try {
      if (this.needsWif) transcodeAddress = state.getTranscodeAddress(this.wif);
      else
        transcodeAddress = state.getTranscodeAddressWithPassword(this.password);
      console.log("transcodeAddr", transcodeAddress);
    } catch (err) {
      this.closeSignTx();
      this.errorDialog = true;
      this.errorMessage = err;
      return;
    }

    let sb = new ScriptBuilder();

    sb.beginScript();
    sb.callContract("interop", "SettleTransaction", [
      transcodeAddress,
      "ethereum",
      "ethereum",
      hexToByteArray(reverseHex(swapTxHash)),
    ]);

    const destinationBalance = await state.getAccountData(address)
    const destinationAddressKCALBalance = destinationBalance.balances.filter((t) => t.symbol == "KCAL");

    if (destinationAddressKCALBalance && destinationAddressKCALBalance[0] && parseFloat(destinationAddressKCALBalance[0].amount) > 1000000000) {
      sb.allowGas(address, sb.nullAddress, gasPrice, minGasLimit);
      sb.callInterop("Runtime.TransferBalance", [
        transcodeAddress,
        address,
        symbol,
      ]);
      sb.spendGas(address);
    } else {
      sb.callContract("swap", "SwapFee", [transcodeAddress, symbol, 1000000000]);
      sb.allowGas(transcodeAddress, sb.nullAddress, gasPrice, minGasLimit);
      sb.callInterop("Runtime.TransferBalance", [
        transcodeAddress,
        address,
        symbol,
      ]);
      sb.spendGas(transcodeAddress);
    }

    const script = sb.endScript();

    const txdata: TxArgsData = {
      nexus: state.nexus,
      chain: "main",
      script,
      payload: state.payload,
    };

    console.log("script", script);

    try {
      this.isLoading = true;
      this.signTxDialog = false;
      let tx = "";
      if (this.needsWif) {
        tx = await state.signTxEth(txdata, this.wif, true);
      } else if (this.needsPass) {
        tx = await state.signTxEthWithPassword(txdata, this.password, true);
      }
      console.log("tx successful: " + tx);
      setTimeout(() => this.$root.$emit("checkTx", tx), 2000);
    } catch (err) {
      this.errorDialog = true;
      this.errorMessage = err;
    }

    // close dialog when it's done
    this.closeSignTx();

    // refresh balances in 2.5 secs
    setTimeout(async () => {
      await this.state.refreshCurrentAccount();
      this.isLoading = false;
    }, 2850);
  }

  async settleFromBscTx() {
    console.log("settle from bsc tx", this.swapToClaim);
    if (!this.swapToClaim || !this.account) return;

    const swapTxHash = this.swapToClaim.sourceHash;

    const symbol = this.swapToClaim.symbol;

    const address = this.account.address;
    const gasPrice = 100000;
    const minGasLimit = 2100;

    let transcodeAddress = "";

    try {
      if (this.needsWif) transcodeAddress = state.getTranscodeAddress(this.wif);
      else
        transcodeAddress = state.getTranscodeAddressWithPassword(this.password);
      console.log("transcodeAddr", transcodeAddress);
    } catch (err) {
      this.closeSignTx();
      this.errorDialog = true;
      this.errorMessage = err;
      return;
    }

    let sb = new ScriptBuilder();

    sb.beginScript();
    sb.callContract("interop", "SettleTransaction", [
      transcodeAddress,
      "bsc",
      "bsc",
      hexToByteArray(reverseHex(swapTxHash)),
    ]);

    sb.callContract("swap", "SwapFee", [transcodeAddress, symbol, 1000000000]);
    sb.allowGas(transcodeAddress, sb.nullAddress, gasPrice, minGasLimit);
    sb.callInterop("Runtime.TransferBalance", [
      transcodeAddress,
      address,
      symbol,
    ]);

    sb.spendGas(transcodeAddress);
    const script = sb.endScript();

    const txdata: TxArgsData = {
      nexus: state.nexus,
      chain: "main",
      script,
      payload: state.payload,
    };

    console.log("script", script);

    try {
      this.isLoading = true;
      this.signTxDialog = false;
      let tx = "";
      if (this.needsWif) {
        tx = await state.signTxEth(txdata, this.wif);
      } else if (this.needsPass) {
        tx = await state.signTxEthWithPassword(txdata, this.password);
      }
      console.log("tx successful: " + tx);
      setTimeout(() => this.$root.$emit("checkTx", tx), 2000);
    } catch (err) {
      this.errorDialog = true;
      this.errorMessage = err;
    }

    // close dialog when it's done
    this.closeSignTx();

    // refresh balances in 2.5 secs
    setTimeout(async () => {
      await this.state.refreshCurrentAccount();
      this.isLoading = false;
    }, 2850);
  }

  async askSwapFromEth(bal: ISymbolAmount) {
    this.sendSymbol = bal.symbol;
    this.swapFromChain = "eth";
    this.swapToChain = "phantasma";
    this.sendMaxAmount = parseFloat(
      this.formatBalance(
        bal.amount.toString(),
        state.decimals(bal.symbol)
      ).replace(/ /gi, "")
    ) as number;
    this.swapAmountDialog = true;

    await this.fetchEthGasPrices();
  }

  async askSendEth(bal: ISymbolAmount) {
    this.sendSymbol = bal.symbol;
    this.swapFromChain = "eth";
    this.swapToChain = "eth";
    this.sendMaxAmount = parseFloat(
      this.formatBalance(
        bal.amount.toString(),
        state.decimals(bal.symbol)
      ).replace(/ /gi, "")
    ) as number;
    if (this.sendSymbol == "ETH") {
      const ethFee = (
        Math.round(21000 * this.ethGasPrices[1] * 1.2) / 1e9
      ).toFixed(4);
      this.sendMaxAmount -= parseFloat(parseFloat(ethFee).toFixed(3));
    }
    this.swapAmountDialog = true;

    await this.fetchEthGasPrices();
  }

  async askSwapFromBsc(bal: ISymbolAmount) {
    this.sendSymbol = bal.symbol;
    this.swapFromChain = "bsc";
    this.swapToChain = "phantasma";
    this.sendMaxAmount = parseFloat(
      this.formatBalance(
        bal.amount.toString(),
        state.decimals(bal.symbol)
      ).replace(/ /gi, "")
    ) as number;
    this.swapAmountDialog = true;
  }

  async askSendBsc(bal: ISymbolAmount) {
    this.sendSymbol = bal.symbol;
    this.swapFromChain = "bsc";
    this.swapToChain = "bsc";
    this.sendMaxAmount = parseFloat(
      this.formatBalance(
        bal.amount.toString(),
        state.decimals(bal.symbol)
      ).replace(/ /gi, "")
    ) as number;
    if (this.sendSymbol == "BNB") {
      const bnbFee = (
        Math.round(21000 * this.bscGasPrices[1] * 1.2) / 1e9
      ).toFixed(4);
      this.sendMaxAmount -= parseFloat(parseFloat(bnbFee).toFixed(3));
    }
    this.swapAmountDialog = true;
  }

  askSwapFromNeo(bal: ISymbolAmount) {
    this.sendSymbol = bal.symbol;
    this.swapFromChain = "neo";
    this.swapToChain = "phantasma";
    this.sendMaxAmount = parseFloat(
      this.formatBalance(
        bal.amount.toString(),
        state.decimals(bal.symbol)
      ).replace(/ /gi, "")
    ) as number;
    this.swapAmountDialog = true;
  }

  askSendNeo(bal: ISymbolAmount) {
    this.sendSymbol = bal.symbol;
    this.swapFromChain = "neo";
    this.swapToChain = "neo";
    this.sendMaxAmount = parseFloat(
      this.formatBalance(
        bal.amount.toString(),
        state.decimals(bal.symbol)
      ).replace(/ /gi, "")
    ) as number;
    this.swapAmountDialog = true;
  }

  async sendFromNeo() {
    if (this.swapToChain === "phantasma") {
      const platforms = await state.api.getPlatforms();
      const interopAddr = platforms.find((p) => p.platform == "neo")
        ?.interop[0];
      this.sendDestination = interopAddr!.external;
    }

    if (!this.account || !this.account.neoAddress) {
      console.log("error");
      return;
    }

    console.log("Sending from NEO", this.sendAmount, this.sendSymbol);
    console.log("NEO Address", this.account.neoAddress);

    let wif = this.wif;

    try {
      if (!this.needsWif) wif = state.getWifFromPassword(this.password);
    } catch (err) {
      this.closeSignTx();
      this.errorDialog = true;
      this.errorMessage = err;
      return;
    }

    const isMainnet = state.isMainnet;
    try {
      const hash = await sendNeo(
        wif,
        this.sendAmount,
        this.sendSymbol,
        this.sendDestination,
        this.account!.address,
        this.neoGasPrices[this.swapGasIndex],
        isMainnet
      );
      console.log("hash from sendNeo", hash);

      const neoApi = isMainnet
        ? "https://dora.coz.io/transaction/neo2/"
        : "http://mankinighost.phantasma.io:4000/transaction/";
      this.lastSwapTxUrl = neoApi + hash;
      this.swapInProgressDialog = true;
    } catch (err) {
      this.errorDialog = true;
      this.errorMessage = err;
    }
    this.closeSignTx();
  }

  async sendFromEth() {
    if (!this.account || !this.account.ethAddress) {
      console.log("error");
      return;
    }

    console.log("Sending from ETH", this.sendAmount, this.sendSymbol);
    console.log("Ethereum Address", this.account.ethAddress);

    const isMainnet = state.isMainnet;

    const nonceRes = await JSONRPC(
      "https://" +
        (isMainnet ? "mainnet" : "ropsten") +
        ".infura.io/v3/aad54c5b39ad4aefa496246bcbf817f8",
      "eth_getTransactionCount",
      [this.account.ethAddress, "pending"]
    );

    console.log("nonce", nonceRes);

    let privateKey: Buffer;

    try {
      privateKey = Buffer.from(
        getPrivateKeyFromWif(
          this.needsWif ? this.wif : state.getWifFromPassword(this.password)
        ),
        "hex"
      );
    } catch (err) {
      this.closeSignTx();
      this.errorDialog = true;
      this.errorMessage = err;
      return;
    }

    const decimals = state.decimals(this.sendSymbol);

    const amount = Math.floor(this.sendAmount * 10 ** decimals); // amount erc-20
    const gasPrice = this.ethGasPrices[this.swapGasIndex] * 10 ** 9; //100000000000;
    const gasLimit = this.sendSymbol == "ETH" ? 21000 : 100000;

    if (this.swapToChain === "phantasma") {
      const platforms = await state.api.getPlatforms();
      const interopAddr = platforms.find((p) => p.platform == "ethereum")
        ?.interop[0];

      if (!interopAddr) {
        throw new Error("No available interop address for swap");
      }
      console.log("Interop address is ", interopAddr.external);
      this.sendDestination = interopAddr.external;
    }

    if (this.sendDestination == "") {
      this.errorDialog = true;
      this.errorMessage = "Error in destination address";
      return;
    }

    const destAddr = this.sendDestination // interopAddr.external //"0x259D17A3E6658B79CE7F6F87CAC614A696056E79"
      .substring(2)
      .padStart(64, "0")
      .toLowerCase();
    const amountStr = amount.toString(16).padStart(64, "0");

    let txParams: any = {};
    if (this.sendSymbol == "ETH") {
      txParams = {
        nonce: nonceRes,
        gasPrice: "0x" + gasPrice.toString(16), //"0x09184e72a000",
        gasLimit: "0x" + gasLimit.toString(16), //"0x2710",
        to: this.sendDestination, // interopAddr.external,
        value: "0x" + amount.toString(16),
      };
    } else {
      txParams = {
        nonce: nonceRes,
        gasPrice: "0x" + gasPrice.toString(16), //"0x09184e72a000",
        gasLimit: "0x" + gasLimit.toString(16), //"0x2710",
        to: "0x" + state.getEthContract(this.sendSymbol),
        value: "0x0", // no eth to transfer
        data: "0xa9059cbb" + destAddr + amountStr,
      };
    }

    // The second parameter is not necessary if these values are used
    const tx = new EthereumTx(txParams, {
      chain: isMainnet ? "mainnet" : "ropsten",
    });
    tx.sign(privateKey);
    const serializedTx = tx
      .serialize()
      .toString("hex")
      .toUpperCase();

    console.log("%c" + serializedTx, "color:blue;font-size:20px");

    const txRes = await JSONRPC(
      "https://" +
        (isMainnet ? "mainnet" : "ropsten") +
        ".infura.io/v3/aad54c5b39ad4aefa496246bcbf817f8",
      "eth_sendRawTransaction",
      ["0x" + serializedTx]
    );

    this.closeSignTx();

    if (txRes.error) {
      this.errorDialog = true;
      this.errorMessage = txRes.error;
      return;
    }

    this.swapInProgressDialog = true;

    this.lastSwapTx = txRes;
    this.lastSwapTxUrl =
      (isMainnet
        ? "https://etherscan.io/tx/"
        : "https://ropsten.etherscan.io/tx/") + txRes;

    console.log("%c" + txRes, "color:green;font-size:20px");
  }

  async swapToEth() {
    console.log(
      "swap from pha to eth",
      this.sendAmount,
      this.sendSymbol,
      this.sendDestination
    );

    if (!this.account) return;

    if (typeof this.sendDestination == "object") {
      this.sendDestination = (this.sendDestination as any).value;
    }

    this.sendDecimals = state.decimals(this.sendSymbol);

    const ethHexBytes = "04" + this.sendDestination.substring(2).toUpperCase();

    let ethInteropBytes = [0x22];
    for (let i = 0; i < 34 * 2; i += 2) {
      const hexdig = ethHexBytes.substr(i, 2);
      if (hexdig == "") {
        ethInteropBytes.push(0);
      } else ethInteropBytes.push(parseInt(hexdig, 16));
    }

    console.log("ethInteropBytes", ethInteropBytes);

    console.log(
      "sending",
      Math.floor(this.sendAmount * 10 ** this.sendDecimals),
      "of",
      this.sendSymbol,
      "to",
      ethInteropBytes
    );

    const address = this.account.address;
    const gasPrice = 100000;
    const minGasLimit = 2100;

    let sb = new ScriptBuilder();

    sb.beginScript();
    sb.allowGas(address, sb.nullAddress, gasPrice, minGasLimit);
    sb.callInterop("Runtime.TransferTokens", [
      address,
      ethInteropBytes,
      this.sendSymbol,
      Math.floor(this.sendAmount * 10 ** this.sendDecimals),
    ]);
    sb.spendGas(address);
    const script = sb.endScript();

    const txdata: TxArgsData = {
      nexus: state.nexus,
      chain: "main",
      script,
      payload: state.payload,
    };

    console.log("script", script);

    try {
      this.isLoading = true;
      let tx = "";
      this.signTxDialog = false;
      if (this.needsWif) {
        tx = await state.signTx(txdata, this.wif);
      } else if (this.needsPass) {
        tx = await state.signTxWithPassword(txdata, address, this.password);
      }
      console.log("tx successful: " + tx);
      this.$root.$emit("checkTx", tx);

      if (this.swapToCustomDest)
        await state.addPendingSwap("ethereum", this.sendDestination, tx);
    } catch (err) {
      this.errorDialog = true;
      this.errorMessage = err;
    }

    // // close dialog when it's done
    this.closeSignTx();

    // refresh balances in 2.5 secs
    setTimeout(async () => {
      await this.state.refreshCurrentAccount();
      this.isLoading = false;
    }, 2700);
  }

  async sendFromBsc() {
    if (!this.account || !this.account.bscAddress) {
      console.log("error");
      return;
    }

    console.log("Sending from BSC", this.sendAmount, this.sendSymbol);
    console.log("BSC Address", this.account.bscAddress);

    const isMainnet = state.isMainnet;

    const nonceRes = await JSONRPCBSC(
      "https://" +
        (isMainnet
          ? "bsc-dataseed.binance.org/"
          : "data-seed-prebsc-1-s1.binance.org:8545/"),
      "eth_getTransactionCount",
      [this.account.bscAddress, "pending"]
    );

    console.log("nonce", nonceRes);

    let privateKey: Buffer;

    try {
      privateKey = Buffer.from(
        getPrivateKeyFromWif(
          this.needsWif ? this.wif : state.getWifFromPassword(this.password)
        ),
        "hex"
      );
    } catch (err) {
      this.closeSignTx();
      this.errorDialog = true;
      this.errorMessage = err;
      return;
    }

    const decimals = state.decimals(this.sendSymbol);

    const amount = Math.floor(this.sendAmount * 10 ** decimals); // amount bep-20
    const gasPrice = this.bscGasPrices[this.swapGasIndex] * 10 ** 9; //100000000000;
    const gasLimit = this.sendSymbol == "BNB" ? 21000 : 100000;

    if (this.swapToChain === "phantasma") {
      const platforms = await state.api.getPlatforms();
      const interopAddr = platforms.find((p) => p.platform == "bsc")
        ?.interop[0];

      if (!interopAddr) {
        throw new Error("No available interop address for swap");
      }
      console.log("Interop address is ", interopAddr.external);
      this.sendDestination = interopAddr.external;
    }

    if (this.sendDestination == "") {
      this.errorDialog = true;
      this.errorMessage = "Error in destination address";
      return;
    }

    const destAddr = this.sendDestination // interopAddr.external //"0x259D17A3E6658B79CE7F6F87CAC614A696056E79"
      .substring(2)
      .padStart(64, "0")
      .toLowerCase();
    const amountStr = amount.toString(16).padStart(64, "0");

    let txParams: any = {};
    if (this.sendSymbol == "BNB") {
      txParams = {
        nonce: nonceRes,
        gasPrice: "0x" + gasPrice.toString(16), //"0x09184e72a000",
        gasLimit: "0x" + gasLimit.toString(16), //"0x2710",
        to: this.sendDestination, // interopAddr.external,
        value: "0x" + amount.toString(16),
      };
    } else {
      txParams = {
        nonce: nonceRes,
        gasPrice: "0x" + gasPrice.toString(16), //"0x09184e72a000",
        gasLimit: "0x" + gasLimit.toString(16), //"0x2710",
        to: "0x" + state.getBscContract(this.sendSymbol),
        value: "0x0", // no eth to transfer
        data: "0xa9059cbb" + destAddr + amountStr,
      };
    }

    // The second parameter is not necessary if these values are used
    const common = Common.forCustomChain(
      "mainnet",
      {
        name: "bnb",
        networkId: isMainnet ? 56 : 97,
        chainId: isMainnet ? 56 : 97,
      },
      "petersburg"
    );
    const tx = new EthereumTx(txParams, {
      common,
    });
    tx.sign(privateKey);
    const serializedTx = tx
      .serialize()
      .toString("hex")
      .toUpperCase();

    console.log("%c" + serializedTx, "color:blue;font-size:20px");

    const txRes = await JSONRPCBSC(
      "https://" +
        (isMainnet
          ? "bsc-dataseed.binance.org/"
          : "data-seed-prebsc-1-s1.binance.org:8545/"),
      "eth_sendRawTransaction",
      ["0x" + serializedTx]
    );

    this.closeSignTx();

    if (txRes.error) {
      this.errorDialog = true;
      this.errorMessage = txRes.error;
      return;
    }

    this.swapInProgressDialog = true;

    this.lastSwapTx = txRes;
    this.lastSwapTxUrl =
      (isMainnet
        ? "https://bscscan.com/tx/"
        : "https://testnet.bscscan.com/tx/") + txRes;

    console.log("%c" + txRes, "color:green;font-size:20px");
  }

  async swapToBsc() {
    console.log(
      "swap from pha to bsc",
      this.sendAmount,
      this.sendSymbol,
      this.sendDestination
    );

    if (!this.account) return;

    if (typeof this.sendDestination == "object") {
      this.sendDestination = (this.sendDestination as any).value;
    }

    this.sendDecimals = state.decimals(this.sendSymbol);

    const ethHexBytes = "04" + this.sendDestination.substring(2).toUpperCase();

    let ethInteropBytes = [0x22];
    for (let i = 0; i < 34 * 2; i += 2) {
      const hexdig = ethHexBytes.substr(i, 2);
      if (hexdig == "") {
        ethInteropBytes.push(0);
      } else ethInteropBytes.push(parseInt(hexdig, 16));
    }

    console.log("ethInteropBytes", ethInteropBytes);

    console.log(
      "sending",
      Math.floor(this.sendAmount * 10 ** this.sendDecimals),
      "of",
      this.sendSymbol,
      "to",
      ethInteropBytes
    );

    const address = this.account.address;
    const gasPrice = 100000;
    const minGasLimit = 2100;

    let sb = new ScriptBuilder();

    sb.beginScript();
    sb.allowGas(address, sb.nullAddress, gasPrice, minGasLimit);
    sb.callInterop("Runtime.TransferTokens", [
      address,
      ethInteropBytes,
      this.sendSymbol,
      Math.floor(this.sendAmount * 10 ** this.sendDecimals),
    ]);
    sb.spendGas(address);
    const script = sb.endScript();

    const txdata: TxArgsData = {
      nexus: state.nexus,
      chain: "main",
      script,
      payload: state.payload,
    };

    console.log("script", script);

    try {
      this.isLoading = true;
      let tx = "";
      this.signTxDialog = false;
      if (this.needsWif) {
        tx = await state.signTx(txdata, this.wif);
      } else if (this.needsPass) {
        tx = await state.signTxWithPassword(txdata, address, this.password);
      }
      console.log("tx successful: " + tx);
      this.$root.$emit("checkTx", tx);

      if (this.swapToCustomDest)
        await state.addPendingSwap("bsc", this.sendDestination, tx);
    } catch (err) {
      this.errorDialog = true;
      this.errorMessage = err;
    }

    // // close dialog when it's done
    this.closeSignTx();

    // refresh balances in 2.5 secs
    setTimeout(async () => {
      await this.state.refreshCurrentAccount();
      this.isLoading = false;
    }, 2700);
  }

  async swapToNeo() {
    console.log(
      "swap from pha to neo",
      this.sendAmount,
      this.sendSymbol,
      this.sendDestination
    );

    this.signTxDialog = false;

    console.log("Going to swap to", this.sendDestination);

    if (!this.account) return;

    if (typeof this.sendDestination == "object") {
      this.sendDestination = (this.sendDestination as any).value;
    }

    this.sendDecimals = state.decimals(this.sendSymbol);

    const sh = getScriptHashFromAddress(this.sendDestination);
    const hexBytes = "0317" + reverseHex(sh).toUpperCase();

    let neoInteropBytes = [0x22];
    for (let i = 0; i < 34 * 2; i += 2) {
      const hexdig = hexBytes.substr(i, 2);

      // console.log(i, hexdig);
      if (hexdig == "") {
        // console.log("empty bytes - push 0");
        neoInteropBytes.push(0);
      } else neoInteropBytes.push(parseInt(hexdig, 16));
    }

    console.log(
      "sending",
      Math.floor(this.sendAmount * 10 ** this.sendDecimals),
      "of",
      this.sendSymbol,
      "to",
      neoInteropBytes
    );

    const address = this.account.address;
    const gasPrice = 100000;
    const minGasLimit = 2100;

    let sb = new ScriptBuilder();

    sb.beginScript();
    sb.allowGas(address, sb.nullAddress, gasPrice, minGasLimit);
    sb.callInterop("Runtime.TransferTokens", [
      address,
      neoInteropBytes,
      this.sendSymbol,
      Math.floor(this.sendAmount * 10 ** this.sendDecimals),
    ]);
    sb.spendGas(address);
    const script = sb.endScript();

    const txdata: TxArgsData = {
      nexus: state.nexus,
      chain: "main",
      script,
      payload: state.payload,
    };

    console.log("script", script);

    try {
      this.isLoading = true;
      let tx = "";
      if (this.needsWif) {
        tx = await state.signTx(txdata, this.wif);
      } else if (this.needsPass) {
        tx = await state.signTxWithPassword(txdata, address, this.password);
      }
      console.log("tx successful: " + tx);
      this.$root.$emit("checkTx", tx);

      if (this.swapToCustomDest)
        await state.addPendingSwap("neo", this.sendDestination, tx);
    } catch (err) {
      this.errorDialog = true;
      this.errorMessage = err;
    }

    // // close dialog when it's done
    this.closeSignTx();

    // refresh balances in 2.5 secs
    setTimeout(async () => {
      await this.state.refreshCurrentAccount();
      this.isLoading = false;
    }, 2500);
  }

  async claimKcal() {
    if (!this.account) return;

    const address = this.account.address;
    const gasPrice = 100000;
    const minGasLimit = 2100;

    let sb = new ScriptBuilder();

    const kcalBalance = this.account.data.balances.find(
      (b) => b.symbol == "KCAL"
    );

    if (kcalBalance != null && kcalBalance.amount != "0") {
      sb.allowGas(address, sb.nullAddress, gasPrice, minGasLimit);
      sb.callContract("stake", "Claim", [address, address]);
    } else {
      console.log("no kcal");
      sb.callContract("stake", "Claim", [address, address]);
      sb.allowGas(address, sb.nullAddress, gasPrice, minGasLimit);
    }

    sb.spendGas(address);
    const script = sb.endScript();

    const txdata: TxArgsData = {
      nexus: state.nexus,
      chain: "main",
      script,
      payload: state.payload,
    };

    console.log(script);

    let tx = "";

    try {
      this.isLoading = true;
      let tx = "";
      if (this.needsWif) {
        tx = await state.signTx(txdata, this.wif);
      } else if (this.needsPass) {
        tx = await state.signTxWithPassword(txdata, address, this.password);
      }
      console.log("tx successful: " + tx);
      this.$root.$emit("checkTx", tx);
    } catch (err) {
      this.errorDialog = true;
      this.errorMessage = err;
    }

    // close dialog when it's done
    this.closeSignTx();

    // refresh balances in 2.5 secs
    setTimeout(async () => {
      await this.state.refreshCurrentAccount();
      this.isLoading = false;
    }, 2500);
  }

  async stakeSoul() {
    if (!this.account) return;

    const address = this.account.address;
    const gasPrice = 100000;
    const minGasLimit = 2100;

    let sb = new ScriptBuilder();

    sb.allowGas(address, sb.nullAddress, gasPrice, minGasLimit);
    sb.callContract("stake", "Stake", [
      address,
      Math.floor(this.stakeSoulAmount * 10 ** 8),
    ]);

    sb.spendGas(address);
    const script = sb.endScript();

    const txdata: TxArgsData = {
      nexus: state.nexus,
      chain: "main",
      script,
      payload: state.payload,
    };

    try {
      this.isLoading = true;
      let tx = "";
      if (this.needsWif) {
        tx = await state.signTx(txdata, this.wif);
      } else if (this.needsPass) {
        tx = await state.signTxWithPassword(txdata, address, this.password);
      }
      console.log("tx successful: " + tx);
      this.$root.$emit("checkTx", tx);
    } catch (err) {
      this.errorDialog = true;
      this.errorMessage = err;
    }

    // close dialog when it's done
    this.closeSignTx();

    // refresh balances in 2.5 secs
    setTimeout(async () => {
      await this.state.refreshCurrentAccount();
      this.isLoading = false;
    }, 2500);
  }

  async unstakeSoul() {
    if (!this.account) return;

    const address = this.account.address;
    const gasPrice = 100000;
    const minGasLimit = 2100;

    let sb = new ScriptBuilder();

    sb.allowGas(address, sb.nullAddress, gasPrice, minGasLimit);
    sb.callContract("stake", "Unstake", [
      address,
      Math.floor(this.unstakeSoulAmount * 10 ** 8),
    ]);

    sb.spendGas(address);
    const script = sb.endScript();

    const txdata: TxArgsData = {
      nexus: state.nexus,
      chain: "main",
      script,
      payload: state.payload,
    };

    try {
      this.isLoading = true;
      let tx = "";
      if (this.needsWif) {
        tx = await state.signTx(txdata, this.wif);
      } else if (this.needsPass) {
        tx = await state.signTxWithPassword(txdata, address, this.password);
      }
      console.log("tx successful: " + tx);
      this.$root.$emit("checkTx", tx);
    } catch (err) {
      this.errorDialog = true;
      this.errorMessage = err;
    }

    // close dialog when it's done
    this.closeSignTx();

    // refresh balances in 2.5 secs
    setTimeout(async () => {
      await this.state.refreshCurrentAccount();
      this.isLoading = false;
    }, 2500);
  }

  async cosmicSwap() {
    if (!this.account) return;

    const address = this.account.address;
    const gasPrice = 100000;
    const minGasLimit = 2100;

    let sb = new ScriptBuilder();

    sb.beginScript();

    sb.callContract("swap", "SwapFee", [address, "SOUL", 2000000000]);
    sb.allowGas(address, sb.nullAddress, gasPrice, minGasLimit);
    sb.spendGas(address);

    const script = sb.endScript();

    const txdata: TxArgsData = {
      nexus: state.nexus,
      chain: "main",
      script,
      payload: state.payload,
    };

    try {
      this.isLoading = true;
      let tx = "";
      if (this.needsWif) {
        tx = await state.signTx(txdata, this.wif);
      } else if (this.needsPass) {
        tx = await state.signTxWithPassword(txdata, address, this.password);
      }
      console.log("tx successful: " + tx);
      this.$root.$emit("checkTx", tx);
    } catch (err) {
      this.errorDialog = true;
      this.errorMessage = err;
    }

    // close dialog when it's done
    this.closeSignTx();

    // refresh balances in 2.5 secs
    setTimeout(async () => {
      await this.state.refreshCurrentAccount();
      this.isLoading = false;
    }, 2500);
  }

  async burnFT() {
    if (!this.account) return;

    console.log("burning " + this.burnAmount + " of " + this.burnSymbol);

    const address = this.account.address;
    const gasPrice = 100000;
    const minGasLimit = 2100;

    let sb = new ScriptBuilder();

    sb.beginScript();
    sb.allowGas(address, sb.nullAddress, gasPrice, minGasLimit);
    sb.callInterop("Runtime.BurnTokens", [
      address,
      this.burnSymbol,
      Math.floor(this.burnAmount * 10 ** this.burnDecimals),
    ]);
    sb.spendGas(address);
    const script = sb.endScript();

    const txdata: TxArgsData = {
      nexus: state.nexus,
      chain: "main",
      script,
      payload: state.payload,
    };

    try {
      this.isLoading = true;
      let tx = "";
      if (this.needsWif) {
        tx = await state.signTx(txdata, this.wif);
      } else if (this.needsPass) {
        tx = await state.signTxWithPassword(txdata, address, this.password);
      }
      console.log("tx successful: " + tx);
      this.$root.$emit("checkTx", tx);
    } catch (err) {
      this.errorDialog = true;
      this.errorMessage = err;
    }

    // close dialog when it's done
    this.closeSignTx();

    // refresh balances in 2.5 secs
    setTimeout(async () => {
      await this.state.refreshCurrentAccount();
      this.isLoading = false;
    }, 2500);
  }

  burnAsset(event: Event, item: Balance) {
    event.stopImmediatePropagation();
    console.log("Going to burn: " + item.symbol);

    if (state.isNFT(item.symbol)) {
      this.goto("/nfts/" + item.symbol + "/burn");
      return;
    }

    this.burnSymbol = item.symbol;
    this.burnDecimals = item.decimals;
    this.burnMaxAmount = parseFloat(
      this.formatBalance(item.amount, item.decimals).replace(/ /gi, "")
    );
    if (this.burnSymbol == "KCAL")
      this.burnMaxAmount = this.burnMaxAmount - 0.01;
    this.burnDialog = true;
  }

  transferAsset(event: Event, item: Balance) {
    event.stopImmediatePropagation();
    console.log("Going to transfer: " + item.symbol);

    if (state.isNFT(item.symbol)) {
      this.goto("/nfts/" + item.symbol + "/send");
      return;
    }

    this.sendSymbol = item.symbol;
    this.sendDecimals = item.decimals;
    this.sendMaxAmount = parseFloat(
      this.formatBalance(item.amount, item.decimals).replace(/ /gi, "")
    );
    if (this.sendSymbol == "KCAL")
      this.sendMaxAmount = this.sendMaxAmount - 0.01;
    this.sendDialog = true;
  }

  async sendFT() {
    if (!this.account) return;

    if (typeof this.sendDestination == "object") {
      this.sendDestination = (this.sendDestination as any).value;
    }

    console.log(
      "sending",
      Math.floor(this.sendAmount * 10 ** this.sendDecimals),
      "of",
      this.sendSymbol,
      "to",
      this.sendDestination
    );

    const address = this.account.address;
    const gasPrice = 100000;
    const minGasLimit = 2100;

    let sb = new ScriptBuilder();

    sb.beginScript();
    sb.allowGas(address, sb.nullAddress, gasPrice, minGasLimit);
    sb.callInterop("Runtime.TransferTokens", [
      address,
      this.sendDestination,
      this.sendSymbol,
      Math.floor(this.sendAmount * 10 ** this.sendDecimals),
    ]);
    sb.spendGas(address);
    const script = sb.endScript();

    const txdata: TxArgsData = {
      nexus: state.nexus,
      chain: "main",
      script,
      payload: state.payload,
    };

    try {
      this.isLoading = true;
      let tx = "";
      if (this.needsWif) {
        tx = await state.signTx(txdata, this.wif);
      } else if (this.needsPass) {
        tx = await state.signTxWithPassword(txdata, address, this.password);
      }
      console.log("tx successful: " + tx);
      this.$root.$emit("checkTx", tx);
    } catch (err) {
      this.errorDialog = true;
      this.errorMessage = err;
    }

    // close dialog when it's done
    this.closeSignTx();

    // refresh balances in 2.5 secs
    setTimeout(async () => {
      await this.state.refreshCurrentAccount();
      this.isLoading = false;
    }, 2500);
  }

  async registerName() {
    if (!this.account) return;

    const address = this.account.address;
    const gasPrice = 100000;
    const minGasLimit = 2100;

    let sb = new ScriptBuilder();

    const kcalBalance = this.account.data.balances.find(
      (b) => b.symbol == "KCAL"
    );

    sb.allowGas(address, sb.nullAddress, gasPrice, minGasLimit);
    sb.callContract("account", "RegisterName", [address, this.nameToRegister]);
    sb.spendGas(address);
    const script = sb.endScript();

    const txdata: TxArgsData = {
      nexus: state.nexus,
      chain: "main",
      script,
      payload: state.payload,
    };

    console.log(script);

    try {
      this.isLoading = true;
      let tx = "";
      if (this.needsWif) {
        tx = await state.signTx(txdata, this.wif);
      } else if (this.needsPass) {
        tx = await state.signTxWithPassword(txdata, address, this.password);
      }
      console.log("tx successful: " + tx);
      this.$root.$emit("checkTx", tx);
    } catch (err) {
      this.errorDialog = true;
      this.errorMessage = err;
    }

    // close dialog when it's done
    this.closeSignTx();

    // refresh balances in 2.5 secs
    setTimeout(async () => {
      await this.state.refreshCurrentAccount();
      this.isLoading = false;
    }, 2500);
  }

  selectAssetToSwap(chain: string, customDest: boolean) {
    this.swapFromChain = "phantasma";
    this.swapToCustomDest = customDest;
    this.swapToChain = chain;
    this.selectAssetToSwapDialog = true;
  }

  async askAmountToSwap(bal: Balance) {
    this.selectAssetToSwapDialog = false;
    this.sendSymbol = bal.symbol;
    this.sendAmount = 0;
    this.sendMaxAmount = parseFloat(
      this.formatBalance(
        bal.amount,
        bal.decimals,
        bal.symbol == "ETH" || bal.symbol == "BNB" ? 3 : 2
      ).replace(/ /gi, "")
    );

    await this.fetchEthGasPrices();

    if (this.sendSymbol == "GAS") {
      this.sendMaxAmount -= 0.1;
    }
    if (this.sendSymbol == "ETH") {
      const ethFee = (
        Math.round(21000 * this.ethGasPrices[1] * 1.2) / 1e9
      ).toFixed(4);
      this.sendMaxAmount -= parseFloat(parseFloat(ethFee).toFixed(3));
    }
    if (this.sendSymbol == "BNB") {
      const bnbFee = (
        Math.round(21000 * this.bscGasPrices[1] * 1.2) / 1e9
      ).toFixed(4);
      this.sendMaxAmount -= parseFloat(parseFloat(bnbFee).toFixed(3));
    }
    if (this.sendMaxAmount < 0) this.sendMaxAmount = 0;
    this.swapAmountDialog = true;
  }

  async onActivityTab() {
    if (!this.account) return;

    this.isLoading = true;
    const res = await state.getAccountTransactions(this.account.address);
    this.offsetTxPage = 0;
    this.showLoadMore = res.result.txs ? res.result.txs.length === 15 : false;
    this.txs = res.result.txs;
    this.loadingTxs = [];
    this.isLoading = false;
  }

  async onAssetsTab() {
    if (state.hasAccount) {
      this.$root.$emit("loading", true);
      await state.refreshCurrentAccount();
      this.$root.$emit("loading", false);
    }
  }

  async onSwapsTab() {
    await this.fetchEthGasPrices();
  }

  async fetchEthGasPrices() {
    const minPrices = [10, 30, 50];
    const prices = [10, 30, 50];
    let hasSetPrices = false;

    try {
      const res = await fetch("https://gasprice.poa.network/");
      const resJson = await res.json();

      if (resJson) {
        const slow = resJson.slow;
        const standard = resJson.standard;
        const fast = (resJson.fast + resJson.instant) / 2;
        if (slow > minPrices[0]) prices[0] = slow;
        if (standard > minPrices[1]) prices[1] = standard;
        if (fast > minPrices[2]) prices[2] = fast;
        hasSetPrices = true;
      }
    } catch {
      console.log("Error fetching gas prices from gasprice.poa.network");
    }

    try {
      const res = await fetch("https://www.etherchain.org/api/gasPriceOracle");
      const resJson = await res.json();

      if (resJson) {
        const slow = resJson.safeLow;
        const standard = resJson.standard;
        const fast = (resJson.fast + resJson.fastest) / 2;
        if (slow > minPrices[0])
          prices[0] = hasSetPrices ? (prices[0] + slow) / 2 : slow;
        if (standard > minPrices[1])
          prices[1] = hasSetPrices ? (prices[1] + standard) / 2 : standard;
        if (fast > minPrices[2]) {
          prices[2] = hasSetPrices ? prices[2] + fast / 2 : fast;
        }
      }
    } catch {
      console.log("Error fetching gas prices from etherchain");
    }

    this.ethGasPrices[0] = parseFloat(prices[0].toFixed(1));
    this.ethGasPrices[1] = parseFloat(prices[1].toFixed(1));
    this.ethGasPrices[2] = parseFloat(prices[2].toFixed(1));
  }

  async loadMoreTxs() {
    if (!this.account) return;

    this.loadingTxs = [0, 1, 2, 3, 4];
    this.isLoading = true;
    ++this.offsetTxPage;
    const res = await state.getAccountTransactions(
      this.account.address,
      this.offsetTxPage
    );
    this.showLoadMore = res.result.txs ? res.result.txs.length === 15 : false;
    this.txs.push(...res.result.txs);
    this.loadingTxs = [];
    this.isLoading = false;
  }

  copyToClipboard(text: string) {
    if (!this.account) return;
    const el = document.createElement("textarea");
    el.value = text;
    el.setAttribute("readonly", "");
    el.style.position = "absolute";
    el.style.left = "-9999px";
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
  }
}
</script>

<style>
.v-tab {
  font-size: 12px;
}

.v-tabs .v-slide-group__prev {
  display: none !important;
}

.v-tabs .v-slide-group__next {
  display: none !important;
}

.v-tabs .v-slide-group__prev {
  min-width: 12px;
}

.v-tabs .v-slide-group__next {
  min-width: 12px;
}
</style>
