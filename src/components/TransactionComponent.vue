<style scoped></style>
<template>
  <div>
    <div v-for="(item, i) in descriptions" :key="i">
      <v-tooltip v-if="item.tooltip" top>
        <template v-slot:activator="{ on, attrs }">
          <span v-bind="attrs" v-on="on">
            <v-icon :color="item.iconColor || 'blue'" size="16" class="mr-1"
              >{{ item.icon }} </v-icon
            >{{ item.text }}</span
          >
        </template>
        <span>{{ item.tooltip }}</span>
      </v-tooltip>
      <span v-else>
        <v-icon :color="item.iconColor || 'blue'" size="16" class="mr-1">{{
          item.icon
        }}</v-icon
        >{{ item.text }}</span
      >
      <v-tooltip v-if="item.postIcon" left>
        <template v-slot:activator="{ on, attrs }">
          <v-icon
            :color="item.postIconColor || 'blue'"
            size="16"
            class="ml-1"
            v-bind="attrs"
            v-on="on"
            >{{ item.postIcon }}</v-icon
          >
        </template>
        <div style="width: 240px; max-width:240px; overflow: hidden">
          <div
            class="overline"
            style="color:#17b1e8; font-size: 11px !important;text-shadow: 1px 1px 20px #000000, 1px 1px 2px #000000;"
          >
            {{ getNftInfo(item.nftId, item.symbol).category }}
          </div>
          <div style="text-shadow: 1px 1px 10px #000000, 1px 1px 2px #000000;">
            {{ getNftInfo(item.nftId, item.symbol).title }}
          </div>
          <div>
            <v-img
              class="mx-auto"
              contain
              :src="getNftInfo(item.nftId, item.symbol).image"
              width="177px"
              height="126px"
            ></v-img>
          </div>
          <div
            style="position:absolute; bottom:5px; right:10px; color: #eee; text-shadow: 1px 1px 20px #000000, 1px 1px 2px #000000;"
          >
            {{ getNftInfo(item.nftId, item.symbol).mint }}
          </div>

          <div
            style="opacity: 0.8"
            v-html="getNftInfusion(item.nftId, item.symbol)"
          ></div>
        </div>
      </v-tooltip>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { Prop } from "vue-property-decorator";
import { TransactionData } from "@/phan-js";
import {
  EventKind,
  getString,
  getTokenEventData,
  getMarketEventData,
  getInfusionEventData,
} from "@/phan-js/vm/EventData";
import { state } from "@/popup/PopupState";

function isFungible(symbol: string) {
  return symbol !== "TTRS" && symbol !== "GHOST" && symbol !== "CROWN";
}

function decimals(symbol: string) {
  switch (symbol) {
    case "KCAL":
      return 10;
    case "SOUL":
      return 8;
    case "NEO":
      return 0;
    case "GAS":
      return 8;
    case "GOATI":
      return 3;
    case "ETH":
      return 18;
    case "MKNI":
      return 0;
    default:
      return 0;
  }
}

function formatBalance(amount: string, decimals: number): string {
  if (decimals == 0) return amount;
  while (amount.length < decimals + 1) amount = "0" + amount;

  const intPart = amount.substring(0, amount.length - decimals);
  const decimalPart = amount.substring(amount.length - decimals, amount.length);
  if (parseInt(decimalPart) == 0) return intPart;
  return (
    intPart +
    "." +
    (decimalPart.length >= 4 ? decimalPart.substring(0, 4) : decimalPart)
  );
}

function formatSymbol(amount: string, symbol: string): string {
  return formatBalance(amount, decimals(symbol)) + " " + symbol;
}

function formatAddress(addr: string) {
  return (
    addr.substring(0, 6) + ".." + addr.substring(addr.length - 6, addr.length)
  );
}

@Component
export default class extends Vue {
  @Prop({ required: true }) tx!: TransactionData;
  @Prop({ required: true }) address!: string;

  public state = state;

  private hasQueriedNfts = false;

  descriptions: any[] = [];

  mounted() {
    this.descriptions = this.getDescriptions();
  }

  getDescriptions(): any[] {
    let res: any[] = [];

    if (this.tx == null || this.tx.events == null) {
      console.log("TX undefined or no events");
      return [];
    }

    const events = this.tx.events;
    for (let i = 0; i < events.length; ++i) {
      const ev = events[i];
      switch (ev.kind) {
        case "AddressRegister": {
          res.push({
            icon: "mdi-account",
            text: "Set name: " + getString(ev.data),
          });
          break;
        }
        case "TokenMint": {
          const data = getTokenEventData(ev.data);
          if (ev.address != this.address) break;
          if (isFungible(data.symbol)) {
            const amount = data.value;
            res.push({
              icon: "mdi-plus-circle-outline",
              text: "Minted " + formatSymbol(amount, data.symbol),
            });
          } else {
            const nftId = data.value;
            if (ev.address == this.address) {
              res.push({
                icon: "mdi-plus-circle-outline",
                text: "Minted NFT (" /*+ nftId + " of "*/ + data.symbol + ")",
                postIcon: "mdi-eye-outline",
                postIconColor: "gray",
                nftId,
                symbol: data.symbol,
              });
            }
          }
          break;
        }
        case "TokenBurn": {
          // const data = getTokenEventData(ev.data);
          // if (ev.address != this.address) break;
          // if (isFungible(data.symbol)) {
          //   const amount = data.value;
          //   res.push({ text: "Burned " + amount + " of " + data.symbol });
          // } else {
          //   const nftId = data.value;
          //   res.push({
          //     text: "Burned NFT " + nftId,
          //     url: "https://www.22series.com/part_info?id=" + nftId,
          //   });
          // }
          break;
        }
        case "TokenClaim": {
          const data = getTokenEventData(ev.data);
          if (ev.address != this.address) break;
          if (data.symbol == "SOUL") {
            const amount = data.value;
            res.push({
              icon: "mdi-star-outline",
              text: "Claimed " + formatSymbol(amount, data.symbol),
            });
          } else if (!isFungible(data.symbol)) {
            const nftId = data.value;
            res.push({
              icon: "mdi-plus-circle-outline",
              text: "Claimed NFT (" + data.symbol + ")",
              postIcon: "mdi-eye-outline",
              postIconColor: "gray",
              nftId,
              symbol: data.symbol,
            });
          }
          break;
        }
        case "TokenStake": {
          const data = getTokenEventData(ev.data);
          if (ev.address != this.address) break;
          if (ev.contract == "stake") {
            const amount = data.value;
            res.push({
              icon: "mdi-bank-transfer-in",
              text: "Staked " + formatSymbol(amount, data.symbol),
            });
          }
          if (ev.contract == "swap") {
            const amount = data.value;
            res.push({
              icon: "mdi-swap-horizontal",
              text: "Swaped " + formatSymbol(amount, data.symbol),
            });
          }
          break;
        }
        case "TokenSend": {
          const data = getTokenEventData(ev.data);
          if (ev.address == this.address) {
            if (isFungible(data.symbol)) {
              const amount = data.value;
              let to = null;
              let isPayment = false;

              if (i + 1 < events.length && ev.data == events[i + 1].data) {
                to = "Sent to " + formatAddress(events[i + 1].address);
                isPayment =
                  events[i + 1].address ==
                  "S3dBVkyE9kdfbBjh7HMEr1BfPTg53CeSWaj3srYzBTZ4vyK";
              }

              if (isPayment)
                res.push({
                  icon: "mdi-cash",
                  iconColor: "red",
                  text: "Paid " + formatSymbol(amount, data.symbol),
                });
              else
                res.push({
                  icon: "mdi-arrow-right-bold-outline",
                  iconColor: "red",
                  text: "Sent " + formatSymbol(amount, data.symbol),
                  tooltip: to,
                });
            } else {
              const nftId = data.value;
              let to = null;
              if (i + 1 < events.length && ev.data == events[i + 1].data) {
                to = "Sent to " + formatAddress(events[i + 1].address);
              }
              res.push({
                icon: "mdi-arrow-right-bold-outline",
                iconColor: "red",
                postIcon: "mdi-eye-outline",
                postIconColor: "gray",
                text: "Sent NFT (" + data.symbol + ") ",
                nftId,
                symbol: data.symbol,
                tooltip: to,
              });
            }
          }
          break;
        }
        case "TokenReceive": {
          const data = getTokenEventData(ev.data);

          let from = null;
          if (i > 0 && ev.data == events[i - 1].data) {
            from = "From " + formatAddress(events[i - 1].address);
          }

          if (ev.address == this.address) {
            if (isFungible(data.symbol)) {
              const amount = data.value;
              res.push({
                icon: "mdi-arrow-left-bold-outline",
                iconColor: "green",
                text: "Received " + formatSymbol(amount, data.symbol),
                tooltip: from,
              });
            } else {
              const nftId = data.value;
              res.push({
                icon: "mdi-arrow-left-bold-outline",
                iconColor: "green",
                postIcon: "mdi-eye-outline",
                postIconColor: "gray",
                text: "Received NFT (" + data.symbol + ")",
                nftId,
                symbol: data.symbol,
                tooltip: from,
              });
            }
          }
          break;
        }
        case "OrderCreated": {
          const data = getMarketEventData(ev.data);
          if (ev.address == this.address) {
            {
              const nftId = data.id;
              res.push({
                icon: "mdi-cart-plus",
                iconColor: "blue",
                postIcon: "mdi-eye-outline",
                postIconColor: "gray",
                text: "Listed NFT (" + data.baseSymbol + ")",
                tooltip:
                  "For " + formatSymbol("" + data.amount, data.quoteSymbol),
                nftId,
                symbol: data.baseSymbol,
              });
            }
          }
          break;
        }
        case "OrderFilled": {
          const data = getMarketEventData(ev.data);
          // if (ev.address == this.address) {
          {
            const nftId = data.id;
            res.push({
              icon: "mdi-cart-arrow-down",
              iconColor: "green",
              postIcon: "mdi-eye-outline",
              postIconColor: "gray",
              text: "NFT sale (" + data.baseSymbol + ")",
              tooltip:
                "For " + formatSymbol("" + data.amount, data.quoteSymbol),
              nftId,
              symbol: data.baseSymbol,
            });
          }
          // }
          break;
        }
        case "Infusion": {
          const data = getInfusionEventData(ev.data);
          // if (ev.address == this.address) {
          {
            const nftId = data.TokenID;
            if (
              data.InfusedSymbol === "TTRS" ||
              data.InfusedSymbol === "GHOST" ||
              data.InfusedSymbol === "CROWN"
            ) {
              res.push({
                icon: "mdi-basket-fill",
                text: "Infused NFT (" + data.baseSymbol + ")",
                tooltip: "With " + data.InfusedSymbol + " NFT",
                nftId,
                symbol: data.baseSymbol,
              });
            } else {
              res.push({
                icon: "mdi-basket-fill",
                text: "Infused NFT (" + data.baseSymbol + ")",
                tooltip:
                  "With " +
                  formatSymbol("" + data.InfusedValue, data.InfusedSymbol),
                nftId,
                symbol: data.baseSymbol,
              });
            }
          }
          // }
          break;
        }
      }
    }

    const numEvents = res.length;

    if (res.length > 100) {
      res.length = 100;
      res.push({
        icon: "mdi-alert",
        iconColor: "red",
        text: "Unshown events (" + (numEvents - 100) + ")",
      });
    }

    // Query NFT Data that might be missing
    if (!this.hasQueriedNfts) {
      this.hasQueriedNfts = true;
      const allNfts = res.filter((i) => i.nftId != undefined);
      const allSymbols = [...new Set(allNfts.map((i) => i.symbol))];
      for (let k = 0; k < allSymbols.length; ++k) {
        const symbol = allSymbols[k];
        const allNftOfSymbol = [
          ...new Set(
            allNfts.filter((i) => i.symbol == symbol).map((i) => i.nftId)
          ),
        ];
        console.log("Going to query ", symbol, allNftOfSymbol);
        this.state.queryNfts(allNftOfSymbol, symbol);
      }
    }

    return res;
  }

  getOverline(item: any) {
    let rarities = [
      "None",
      "Consumer",
      "Industrial",
      "Professional",
      "Custom",
      "Collector",
      "Unique",
    ];
    const rarity = item.rarity;
    if (rarity) return rarities[rarity];

    return "NFT";
  }

  getNftInfusion(nftId: string, symbol: string) {
    // console.log(nftId, symbol);
    const nfts = this.state.nfts;
    const item = nfts[symbol + "@" + nftId];
    if (item && item.infusion) {
      return item.infusion
        .map((i: any) => state.formatBalance(i.Key, i.Value))
        .join("<br/>");
    }
    return "";
  }

  getNftInfo(nftId: string, symbol: string) {
    // console.log(nftId, symbol);
    const nfts = this.state.nfts;
    const item = nfts[symbol + "@" + nftId];
    if (item) {
      const info = {
        image: item.img,
        title: item.name,
        mint: "#" + item.mint,
        category: this.getOverline(item),
      };
      return info;
    }

    // if not found return something
    return {
      image: "",
      mint: "",
      title: "",
      category: "",
    };
  }
}
</script>
