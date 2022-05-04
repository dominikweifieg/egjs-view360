import { ComponentEvent } from "@egjs/component";

import { SUPPORT_WILLCHANGE, TRANSFORM } from "../utils/browserFeature";

import SpriteImage from "./SpriteImage";
import { SpinViewerOptions } from "./SpinViewer";


class MultiImage extends SpriteImage {
  private static _createMultiBgDiv(imgs: HTMLImageElement[], rowCount: number, colCount: number, autoHeight: boolean) {
    const el = document.createElement("div");

    el.style.position = "relative";
    el.style.overflow = "hidden";

    const pe = document.createElement("div");

    pe.style.position = "absolute";
    pe.style.width = `${colCount * 100}%`;
    pe.style.height = `${rowCount * 100}%`;
    pe.style.display = "grid";
    pe.style.gridGap = "0px";
    pe.style.gridTemplateColumns = `repeat(${imgs.length})`;

    /** Prevent image from being dragged on IE10, IE11, Safari especially */
    pe.ondragstart = () => false; // img.style.pointerEvents = "none";
    // Use hardware accelerator if available
    if (SUPPORT_WILLCHANGE) {
      (pe.style.willChange = "transform");
    }

    imgs.forEach((image, _index) => {
      // image.style.position = "realtive";
      // // if (typeof height === "string") {
      // //   image.style.top = MultiImage.getSizeString(index * parseInt(height, 10));
      // // } else {
      // //   image.style.top = MultiImage.getSizeString(index * height);
      // // }
      // image.style.top = `${100 * index}%`;
      //
      // image.style.left = MultiImage.getSizeString(0);
      // image.style.height = "auto";
      image.style.width = "100%";
      // image.style.width = MultiImage.getSizeString(width);
      // image.style.height = MultiImage.getSizeString(height);
      pe.appendChild(image);

    });

    el.appendChild(pe);

    const unitWidth = imgs[0].naturalWidth; // / colCount;
    const unitHeight = imgs[0].naturalHeight; // / rowCount;

    if (autoHeight) {
      const r = unitHeight / unitWidth;

      el.style.paddingBottom = `${r * 100}%`;
    } else {
      // el.style.height = "100%";
      el.style.height = MultiImage.getSizeString(unitHeight);
    }

    return {bgDiv: el, positioningElement: pe};
  }

  protected _images: HTMLImageElement[];
  protected _isSafari: boolean;

  public constructor(element: HTMLElement, options: Partial<SpinViewerOptions>) {
    const opt = options || {};

    if (!opt.imageUrls) {
      setTimeout(() => {
        this.trigger(new ComponentEvent("imageError", {
          imageUrl: ""
        }));
      }, 0);
      return;
    }

    const superOptions: Partial<SpinViewerOptions> = {
      imageUrl: opt.imageUrls[0] ?? "",
      rowCount: opt.imageUrls.length ?? 0,
      colCount: 1,
      width: opt.width,
      height: opt.height,
      autoHeight: opt.autoHeight,
      colRow: opt.colRow,
      scale: opt.scale,
      frameIndex: opt.frameIndex,
      wrapperClass: opt.wrapperClass,
      imageClass: opt.imageClass
    };
    super(element, superOptions);

    this._isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    this._images = [];

    for (const item of opt.imageUrls) {
      this._images.push(new Image());
    }

    /**
     * Event
     */

    const images = this._images;

    let onLoadTriggered = false;

    for (let i = 0; i < opt.imageUrls.length; i++) {
      // opt.imageUrls.forEach((url, index) => {
      const url = opt.imageUrls[i];
      const image = images[i];
      image.onload = () => {
        let allLoaded = true;
        images.forEach(img => {
          if (!img.complete) {
            allLoaded = false;
          }
        });

        if (allLoaded && !onLoadTriggered) {
          onLoadTriggered = true;
          const result = MultiImage._createMultiBgDiv(
            images,
            this._rowCount,
            this._colCount,
            this._autoHeight
          );

          this._bg = result.bgDiv;
          this._positioningElement = result.positioningElement;
          if (this._el.children.length === 1) {
            this._el.removeChild(this._el.children[0]);
          }
          this._el.appendChild(this._bg);
          this.setColRow(this._colRow[0], this._colRow[1]);

          this.trigger(new ComponentEvent("load", {
            target: this._el,
            bgElement: this._bg
          }));

          if (this._autoPlayReservedInfo) {
            this.play(this._autoPlayReservedInfo);
            this._autoPlayReservedInfo = null;
          }
        }
      };

      image.onerror = () => {
        this.trigger(new ComponentEvent("imageError", {
          imageUrl: url
        }));
      };

      image.src = url;
      // });
    }
  }

  /**
   * Specifies the col and row values of the frame to be shown in the sprite image.
   * @ko 스프라이트 이미지 중 보여질 프레임의 col, row 값을 지정
   * @method eg.view360.SpriteImage#setColRow
   * @param {Number} col Column number of a frame<ko>프레임의 행값</ko>
   * @param {Number} row Row number of a frame<ko>프레임의 열값</ko>
   *
   * @example
   *
   * sprites.setlColRow(1, 2); // col = 1, row = 2
   */
  public setColRow(col: number, row: number) {
    if (row > this._rowCount - 1 || col > this._colCount - 1) {
      return;
    }
    if (col === this._colRow[0] && row === this._colRow[1]) {
      return;
    }

    if (this._positioningElement && TRANSFORM) {

      // NOTE: Currently, do not apply translate3D for using layer hack. Do we need layer hack for old browser?
      let transform: string;
      if (this._isSafari) {
        const height = Math.ceil(Math.ceil(this._positioningElement.clientHeight) / this._rowCount);
        transform = `translate(${-(col / this._colCount * 100)}%, ${-(row * height)}px)`;
      } else {
        transform = `translate(${-(col / this._colCount * 100)}%, ${-(row / this._rowCount * 100 )}%)`;
      }

      this._positioningElement.style[TRANSFORM] = transform;
      // console.log("ROW", row, transform);
    }

    this._colRow = [col, row];
  }
}

export default MultiImage;
