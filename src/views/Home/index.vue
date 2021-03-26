<template lang="pug">
span
    v-row
        v-col
            //- v-btn(@click="$window.document.getElementById('imgFile').click()",color="black",dark) 画像読み込み
            v-btn(@click="resetStunPlace()",color="black",dark) 規定値に戻す

        v-col(cols="12") スタンゲージ1pxあたり {{ Math.round(stun1px * 100) / 100 }} % 
        v-col 
          span(v-for='p in ["enermy","player"]')
            span(v-for=" (elm , i) in stunPlace[p]" ,:key="i")
              v-btn( cols="2" , @click="slide = {isPlayer:p,place:i};display_slider = (display_slider === p + i)? undefined : p + i") {{ Math.round(elm / stunWidth * 10000) / 100 }} %
              v-slider.sss(v-if="display_slider === p + i ",min=0,:max="stunWidth",step=1,:value="elm",@input="x = $event;",style="max-width:500px")

        v-col(cols="12")
            canvas#output(style="max-width: 90vw;max-height:calc(70vh - 50px);/*display:none;")

        v-col 
          span(v-for=" (elm , i) in recastPlace" ,:key="i")
            v-btn( cols="2" , @click="slide = {type:'p',place:i};display_slider = (display_slider === 'r' + i)? undefined : 'r' + i") {{  Math.round((1 - elm / recastHeight) * 10000) / 100}} %
            v-slider.sss(v-if="display_slider === 'r' + i ",min=0,:max="recastHeight",step=1,:value="elm",@input="x = $event;",style="max-width:500px")
        v-col(cols="12") リキャストゲージ1pxあたり {{ recast1px }} %
        
        v-col
          strong 使い方
          br
          | 戦闘画面のスクショを右上のボタンから読み込むとスタンゲージとリキャストのデータを表示します
          br
          | 16:9、またはそれより縦長のスクショにのみ対応
          

    canvas#editorUse(style="max-width: 100vw;max-height:calc(100vh - 50px);display:none;")
    
</template>

<script>
import cv from "../../plugins/opencv";

export default {
  data: () => ({
    stunData: { player: {}, enermy: {} },
    stunPlace: { player: {}, enermy: {} },
    recastData: {},
    recastPlace: {},
    stunPlace_default: { player: {}, enermy: {} },
    recastPlace_default: {},

    display_slider: undefined,
    editedImg: undefined,
    stunWidth: 0,
    recastHeight: 0,

    x: 0,
    slide: {
      isPlayer: undefined,
      place: -1,
    },

    is1334_750: false,
  }),

  computed: {
    stun1px() {
      return Math.round(10000 / this.stunWidth) / 100;
    },
    recast1px() {
      return Math.round(10000 / this.recastHeight) / 100;
    },
    canvas() {
      return {
        editorUse: document.getElementById("editorUse"),
        output: document.getElementById("output"),
      };
    },
  },

  methods: {
    transpose(a) {
      return Object.keys(a[0]).map((c) => a.map((r) => r[c]));
    },
    ObjectCopy(obj) {
      return JSON.parse(JSON.stringify(obj));
    },
    reloadObj() {
      this.stunPlace = this.ObjectCopy(this.stunPlace);
      this.recastPlace = this.ObjectCopy(this.recastPlace);
    },
    resetStunPlace() {
      this.stunPlace = this.ObjectCopy(this.stunPlace_default);
      this.recastPlace = this.ObjectCopy(this.recastPlace_default);
    },
    isPlayerStr(isPlayer) {
      return isPlayer ? "player" : "enermy";
    },
    thresholding(img) {
      return new Promise((resolve) => {
        function canny() {
          const src = cv.imread(img);
          const dst = new cv.Mat();
          cv.cvtColor(src, src, cv.COLOR_RGB2GRAY, 0);
          cv.Canny(src, dst, 50, 100, 3, false);
          cv.imshow("editorUse", dst);
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
      return array.reduce((accumulator, currentValue, x) => {
        accumulator[x] = currentValue.reduce(
          (accumulator, currentValue) => accumulator + currentValue[0],
          0
        );
        return accumulator;
      }, new Array(array.length).fill(0));
    },
    getRecastLineData(array) {
      array = this.transpose(array);
      return array.reduce((accumulator, currentValue, x) => {
        accumulator[x] = currentValue.reduce(
          (accumulator, currentValue) => accumulator + currentValue[0],
          0
        );
        return accumulator;
      }, new Array(array.length).fill(0));
    },
    async loadImg(path = require("../../assets/sc2.png")) {
      let img = new Image();
      const canvas = this.canvas.editorUse;
      const canvas2 = this.canvas.output;
      await this.imgOnload(img, path);

      if (img.width === 1334 && img.height === 750) {
        this.is1334_750 = true;
      } else {
        this.is1334_750 = false;
        if (img.width / img.height > 16 / 9) {
          const tmpCanvas = document.createElement("canvas");
          const ctx = this.canvasInit(tmpCanvas, img);
          ctx.drawImage(img, 0, 0);
          let imgData = this.getColorMap(
            tmpCanvas,
            0,
            0,
            tmpCanvas.width,
            tmpCanvas.height
          );
          {
            let rmBlackArea = false;
            //eslint-disable-next-line
            while (true) {
              const elm = imgData[0];
              const colorSum = elm.reduce(
                (accumulator, currentValue) =>
                  accumulator +
                  currentValue.slice(0, -1).reduce((a, c) => a + c),
                0
              );
              if (colorSum <= 50 * elm.length) {
                rmBlackArea = true;
                imgData.shift();
              } else {
                break;
              }
            }
            if (!rmBlackArea) {
              //eslint-disable-next-line
              while (true) {
                const elm = imgData[imgData.length - 1];
                const colorSum = elm.reduce(
                  (accumulator, currentValue) =>
                    accumulator +
                    currentValue.slice(0, -1).reduce((a, c) => a + c),
                  0
                );
                if (colorSum <= 50 * elm.length) {
                  imgData.pop();
                } else {
                  break;
                }
              }
            }
          }
          const height = imgData[0].length;
          const width = imgData.length;
          const trimWidth = Math.floor((height / 9) * 16);
          const logoSpace = Math.floor((width - trimWidth) / 2);
          if (logoSpace !== 0 && width / height > 16 / 9) {
            imgData = imgData.slice(logoSpace, -logoSpace);
          }

          const imageData = this.ColorMapToImageData(imgData);
          this.canvasInit(tmpCanvas, imageData).putImageData(imageData, 0, 0);
          const blob = await this.toBlob(tmpCanvas);
          const imgUrl = URL.createObjectURL(blob);
          await this.imgOnload(img, imgUrl);
        }
      }
      this.editedImg = img;

      this.canvasInit(canvas2, img).drawImage(img, 0, 0);
      this.canvasInit(canvas, canvas2);

      await this.thresholding(img);
    },
    toBlob(CanvasElement) {
      return new Promise((resolve, reject) => {
        try {
          CanvasElement.toBlob(resolve);
        } catch (e) {
          reject(e);
        }
      });
    },
    canvasInit(canvas, img) {
      canvas.width = img.width;
      canvas.height = img.height;
      return canvas.getContext("2d");
    },
    x_start(isPlayer, place) {
      let initPlace = isPlayer ? 786 : 60;
      if (this.is1334_750 && !isPlayer) initPlace--;
      return initPlace + 194 * place;
    },
    getStunData(isPlayer, place) {
      const canvas = this.canvas.editorUse;
      // const ctx = canvas.getContext("2d");

      const x_width = 137;
      const y_start = 95;
      const fixed = isPlayer ? 0 : -2;

      this.stunWidth = Math.floor(canvas.width * (x_width / 1334));

      const coordinate = [
        Math.floor(
          canvas.width * (this.x_start(isPlayer, place) / 1334)
        ) /*+ 3*/,
        Math.floor(canvas.height * (y_start / 750)) + fixed,
        Math.floor(canvas.width * (x_width / 1334)) /*- 3*/,
        3,
      ];

      // ctx.fillStyle = "#00FFFF";

      const ColorMap = this.getColorMap(canvas, ...coordinate);
      // ctx.fillRect(...coordinate);

      this.stunData[this.isPlayerStr(isPlayer)][
        String(place)
      ] = this.getLineData(ColorMap);
    },
    getRecastData(place) {
      const canvas = this.canvas.editorUse;
      // const ctx = canvas.getContext("2d");

      // const x_width = 137;
      // const y_start = 95;
      // const fixed = isPlayer ? 0 : -2;

      this.recastHeight = Math.floor(canvas.height * (106 / 750));

      // 683,576,83,106

      const coordinate = [
        Math.floor(canvas.width * ((545 + 138 * place) / 1334)),
        Math.floor(canvas.height * (576 / 750)),
        Math.floor(canvas.width * (83 / 1334)),
        this.recastHeight - 2,
      ];

      // ctx.fillStyle = "#00FFFF";

      const ColorMap = this.getColorMap(canvas, ...coordinate);
      // ctx.fillRect(...coordinate);

      this.recastData[String(place)] = this.getRecastLineData(ColorMap);
    },
    getColorMap(canvas, ...coordinate) {
      const width = coordinate[2];
      const height = coordinate[3];
      const output = this.create2DArray(width, height);

      const ctx = canvas.getContext("2d");
      ctx.getImageData(...coordinate).data.forEach((value, i) => {
        const group = (i - (i % 4)) / 4;
        const x = group % width;
        const y = Math.floor(group / width);
        if (i % 4 === 0) {
          output[x][y] = new Array(4);
        }
        output[x][y][i % 4] = value;
      });
      return output;
    },
    ColorMapToImageData(ColorMap) {
      const imgData = document
        .createElement("canvas")
        .getContext("2d")
        .createImageData(ColorMap.length, ColorMap[0].length);
      let i = 0;
      this.transpose(ColorMap).forEach((x) => {
        x.forEach((y) => {
          y.forEach((color) => {
            imgData.data[i] = color;
            i++;
          });
        });
      });
      return imgData;
    },
    create2DArray(N, M, value = 0) {
      return Array.from({ length: N }, () => new Array(M).fill(value));
    },
    getStunRate(isPlayer, place) {
      const data = this.stunData[this.isPlayerStr(isPlayer)][String(place)];
      let tmp = 0;
      let index = 0;
      data.forEach((x, i) => {
        if (x >= tmp && x >= 255 * 2 && i / this.stunWidth >= 0.01) {
          tmp = x;
          index = i;
        }
      });
      return index;
    },
    getRecastRate(place) {
      const data = this.recastData[String(place)];
      // console.log(data);
      let tmp = 0;
      let index = -2;
      data
        .slice()
        .reverse()
        .forEach((x, i) => {
          if (x >= tmp && x >= 255 * (this.recastHeight / 2.5)) {
            tmp = x;
            index = i;
          }
        });
      return data.length - index;
    },
    drawImageAndLine() {
      const canvas = this.canvas.output;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(this.editedImg, 0, 0);

      const y_start = 95;
      [false, true].forEach((isPlayer) => {
        const fixed = isPlayer ? 0 : -2;
        [0, 1, 2].forEach((place) => {
          const stunPlace = this.stunPlace[this.isPlayerStr(isPlayer)][
            String(place)
          ];
          ctx.fillStyle = "blue";
          ctx.fillRect(
            Math.floor(
              canvas.width * (this.x_start(isPlayer, place) / 1334) + stunPlace
            ),
            Math.floor(canvas.height * (y_start / 750)) + fixed,
            1,
            100
          );

          ctx.fillStyle = "red";
          //start
          ctx.fillRect(
            Math.floor(
              canvas.width * (this.x_start(isPlayer, place) / 1334) + 0
            ),
            Math.floor(canvas.height * (y_start / 750)) + fixed,
            1,
            100
          );
          //end
          ctx.fillRect(
            Math.floor(
              canvas.width * (this.x_start(isPlayer, place) / 1334) +
                this.stunWidth
            ),
            Math.floor(canvas.height * (y_start / 750)) + fixed,
            1,
            100
          );
        });
      });
      /*
        Math.floor(canvas.width * ((545 + 138 * place) / 1334)),
        Math.floor(canvas.height * (576 / 750)),
        Math.floor(canvas.width * (83 / 1334)),
        this.recastHeight - 1,
       */

      [0, 1, 2].forEach((place) => {
        const recastPlace = this.recastPlace[String(place)];
        // console.log(recastPlace);
        ctx.fillStyle = "blue";
        ctx.fillRect(
          Math.floor(canvas.width * ((545 + 138 * place) / 1334)),
          Math.floor(canvas.height * (576 / 750)) + recastPlace,
          Math.floor(canvas.width * (83 / 1334)),
          1
        );

        ctx.fillStyle = "red";
        //start
        ctx.fillRect(
          Math.floor(canvas.width * ((545 + 138 * place) / 1334)),
          Math.floor(canvas.height * (576 / 750)),
          Math.floor(canvas.width * (83 / 1334)),
          1
        );
        //end
        ctx.fillRect(
          Math.floor(canvas.width * ((545 + 138 * place) / 1334)),
          Math.floor(canvas.height * (576 / 750)) + this.recastHeight,
          Math.floor(canvas.width * (83 / 1334)),
          1
        );
      });
    },
  },

  async mounted() {
    if (location.hostname === "localhost") {
      window.v = this;
      window.p = process;
      // this.loadImg();
    }

    document.getElementById("imgFile").addEventListener("change", (e) => {
      const file_reader = new FileReader();
      file_reader.addEventListener("load", async (e) => {
        this.output = "";
        await this.loadImg(e.target.result);
        [false, true].forEach((isPlayer) => {
          [0, 1, 2].forEach((place) => {
            this.getStunData(isPlayer, place);
            this.stunPlace[this.isPlayerStr(isPlayer)][
              String(place)
            ] = this.getStunRate(isPlayer, place);
          });
        });
        [0, 1, 2].forEach((place) => {
          this.getRecastData(place);
          this.recastPlace[String(place)] = this.getRecastRate(place);
        });
        this.stunPlace_default = this.ObjectCopy(this.stunPlace);
        this.recastPlace_default = this.ObjectCopy(this.recastPlace);
        this.reloadObj();
        this.drawImageAndLine();
      });
      file_reader.readAsDataURL(e.target.files[0]);
    });
  },
  watch: {
    stunPlace() {
      this.drawImageAndLine();
    },
    recastPlace() {
      this.drawImageAndLine();
    },
    x(e) {
      if (this.slide?.type === "p") {
        this.recastPlace[this.slide.place] = e;
        this.recastPlace = this.ObjectCopy(this.recastPlace);
      } else {
        this.stunPlace[this.slide.isPlayer][this.slide.place] = e;
        this.stunPlace = this.ObjectCopy(this.stunPlace);
      }
    },
  },
};
</script>
