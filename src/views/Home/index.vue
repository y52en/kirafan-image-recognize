<template lang="pug">
span
    v-row
        v-col
            v-btn(@click="$window.document.getElementById('imgFile').click()",color="black",dark) 画像読み込み
            input#imgFile(type="file",style="display:none;")
        v-col(cols=12) 16:9の画像にのみ対応
        v-col(cols=12) {{ output }}
        
        v-col(cols=12)
            canvas#canvasInput(style="max-width: 100vw;max-height:calc(100vh - 50px);display:none;")
        v-col
            canvas#noChanged(style="max-width: 100vw;max-height:calc(100vh - 50px);/*display:none;")
</template>

<script>
import cv from "../../plugins/opencv";

export default {
  data: () => ({
    stunData: { player: {}, enermy: {} },
    stunWidth: 0,
    output: "",
  }),

  methods: {
    transpose(a) {
      return Object.keys(a[0]).map(function (c) {
        return a.map(function (r) {
          return r[c];
        });
      });
    },
    thresholding(img) {
      return new Promise((resolve) => {
        function canny() {
          const src = cv.imread(img);
          const dst = new cv.Mat();
          cv.cvtColor(src, src, cv.COLOR_RGB2GRAY, 0);
          cv.Canny(src, dst, 50, 100, 3, false);
          cv.imshow("canvasInput", dst);
          src.delete();
          dst.delete();
          resolve();
        }

        if (cv.getBuildInformation) {
          canny();
        } else {
          cv["onRuntimeInitialized"] = canny; // WASM
        }
      });
    },
    imgOnload(img_elm, url) {
      return new Promise((resolve, reject) => {
        const img = img_elm;
        img.onload = () => resolve();
        img.onerror = (e) => reject(e);
        img.src = url;
      });
    },
    getLineData(array) {
      return array.reduce((accumulator, currentValue, index) => {
        if (index % 4 === 0) {
          // 0 ,4,8
          accumulator[
            ((index - (index % 4)) / 4) % (array.length / 12)
          ] += currentValue;
        }
        return accumulator;
      }, new Array(array.length / 12).fill(0));
    },
    async loadImg(path = require("../../assets/sc2.png")) {
      const img = new Image();
      await this.imgOnload(img, path);
      const canvas = document.getElementById("canvasInput");
      const canvas2 = document.getElementById("noChanged");

      const elm = [canvas, canvas2];
      elm.forEach((x) => {
        x.width = img.width;
        x.height = img.height;
      });

      canvas2.getContext("2d").drawImage(img, 0, 0);

      await this.thresholding(img);
    },
    x_start(isPlayer, place) {
      const initPlace = isPlayer ? 786 : 59;
      return initPlace + 194 * place;
    },
    getStunData(isPlayer, place) {
      const canvas = document.getElementById("canvasInput");
      // const canvas = document.getElementById("noChanged");
      const ctx = canvas.getContext("2d");

      const x_width = 137;
      const y_start = 95;
      const fixed = isPlayer ? 0 : -2;

      this.stunWidth = canvas.width * (x_width / 1334);

      const coordinate = [
        Math.floor(
          canvas.width * (this.x_start(isPlayer, place) / 1334)
        ) /*+ 3*/,
        Math.floor(canvas.height * (y_start / 750)) + fixed,
        Math.floor(canvas.width * (x_width / 1334)) /*- 3*/,
        3,
      ];

      ctx.fillStyle = "#00FFFF";

      const b = ctx.getImageData(...coordinate).data;
      // ctx.fillRect(...coordinate);

      this.stunData[isPlayer ? "player" : "enermy"][
        String(place)
      ] = this.getLineData(b);
    },
    getStunRate(isPlayer, place) {
      // const canvas = document.getElementById("canvasInput");
      const canvas = document.getElementById("noChanged");
      const ctx = canvas.getContext("2d");

      const data = this.stunData[isPlayer ? "player" : "enermy"][String(place)];
      let tmp = 0;
      let index = 0;
      const y_start = 95;
      const fixed = isPlayer ? 0 : -2;
      data.forEach((x, i) => {
        if (x >= tmp && x >= 255 * 2 && i / this.stunWidth >= 0.01) {
          tmp = x;
          index = i;
        }
      });
      ctx.fillStyle = "blue";

      ctx.fillRect(
        Math.floor(
          canvas.width * (this.x_start(isPlayer, place) / 1334) + index
        ),
        Math.floor(canvas.height * (y_start / 750)) + fixed,
        1,
        100
      );

      ctx.fillStyle = "red";
      //start
      ctx.fillRect(
        Math.floor(canvas.width * (this.x_start(isPlayer, place) / 1334) + 0),
        Math.floor(canvas.height * (y_start / 750)) + fixed,
        1,
        100
      );
      //end
      ctx.fillRect(
        Math.floor(
          canvas.width * (this.x_start(isPlayer, place) / 1334) + this.stunWidth
        ),
        Math.floor(canvas.height * (y_start / 750)) + fixed,
        1,
        100
      );
      return index / this.stunWidth;
    },
  },

  async mounted() {
    window.v = this;

    document.getElementById("imgFile").addEventListener("change", (e) => {
      const file_reader = new FileReader();
      file_reader.addEventListener("load", async (e) => {
        this.output = "";
        await this.loadImg(e.target.result);
        [false, true].forEach((isPlayer) => {
          [0, 1, 2].forEach((place) => {
            this.getStunData(isPlayer, place);
            this.output += (
              this.getStunRate(isPlayer, place) * 100 +
              "% , "
            ).replace(/(\.\d{2})\d+/, "$1");
          });
          this.output += "\n";
        });
      });
      file_reader.readAsDataURL(e.target.files[0]);
    });
  },
};
</script>