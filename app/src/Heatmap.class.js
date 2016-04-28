import _ from 'lodash';

const DEFAULTS = {
    blur: 35,
    radius: 25,
    gradient: {
        0.4: 'blue',
        0.6: 'cyan',
        0.7: 'lime',
        0.8: 'yellow',
        1.0: 'red'
    }
};

export default class {

    constructor(canvas, img) {
        this.canvas = _.isString(canvas) ? document.getElementById(canvas) : canvas;
        this._ctx = this.canvas.getContext('2d');
        this._width = this.canvas.width;
        this._height = this.canvas.height;

        this.canvasHeat = this._createCanvas(this._width, this._height);
        this._ctxHeat = this.canvasHeat.getContext('2d');

        if (img) {
            console.log('trying to draw an image', img);
            this._img = new Image;
            this._img.src = img;
            this._isLoaded = false;
            this._img.addEventListener('load', () => {
                this._isLoaded = true;
            });
        }

        this._data = [];
    }

    add(point) {
        this._data.push(point);
        return this;
    }

    data(data) {
        this._data = data;
        return this;
    }

    draw(force) {
        if (this._img && !this._isLoaded) {
            setTimeout(()=> {
                this.draw();
            });
            return this;
        }

        if (!this.circle || force) {
            this._cacheCircle();
        }
        if (!this.gradient || force) {
            this._cacheGradient();
        }

        let ctx = this._ctx;
        let ctxHeat = this._ctxHeat;

        ctxHeat.clearRect(0, 0, this._width, this._height);

        if (this._img) {
            ctx.drawImage(this._img, 0, 0);
        }

        for (let i = 0, len = this._data.length, p; i < len; i++) {
            p = this._data[i];
            ctxHeat.globalAlpha = Math.max(1 / len, 0.1);
            ctxHeat.drawImage(this._circle, p[0] - this._r - this._blur, p[1] - this._r - this._blur);
        }

        let colored = ctxHeat.getImageData(0, 0, this._width, this._height);

        this._normalize(colored.data);
        this._colorize(colored.data, this.gradient);
        ctxHeat.putImageData(colored, 0, 0);

        // ctx.globalCompositeOperation = 'lighten';
        ctx.drawImage(this.canvasHeat, 0, 0);

        return this;
    }

    setBlur(value) {
        this._blur = value ? parseFloat(value) : DEFAULTS.blur;
        this._cacheCircle();

        this.draw(true);
    }

    setRadius(value) {
        this._r = value ? parseFloat(value) : DEFAULTS.radius;
        this._cacheCircle();

        this.draw(true);
    }
    
    setGradient(grad) {
        this.grad = grad;
        this._cacheGradient(grad);
        this.draw();
    }

    /* -- private methods */
    _cacheCircle() {
        let blur = this._blur = this._blur ? this._blur : DEFAULTS.blur;
        let r = this._r = this._r ? this._r : DEFAULTS.radius;
        let r2 = blur + r;

        let canvas = this._circle = this._createCanvas(r2 * 2);
        let ctx = canvas.getContext('2d');

        ctx.shadowOffsetX = ctx.shadowOffsetY = r2 * 2;
        ctx.shadowBlur = blur;
        ctx.shadowColor = 'black';

        ctx.beginPath();
        ctx.arc(-r2, -r2, r, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.fill();
    }

    _cacheGradient(grad) {
        let canvas = this._createCanvas(1, 256);
        let ctx = canvas.getContext('2d');
        let gradient = ctx.createLinearGradient(0, 0, 0, 256);

        this.grad = grad ? grad : this.grad ? this.grad : DEFAULTS.gradient;

        for (var i in this.grad) {
            gradient.addColorStop(+i, this.grad[i]);
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1, 256);

        this.gradient = ctx.getImageData(0, 0, 1, 256).data;
    }

    _normalize(pixels) {
        var max = -1;
        for (var i = 0, len = pixels.length, j; i < len; i += 4) {
            max = Math.max(pixels[i + 3], max);
        }

        for (var i = 0, len = pixels.length, j; i < len; i += 4) {
            // j = pixels[i + 3];
            // var p = (j / max) * 255;
            pixels[i + 0] = 0;
            pixels[i + 1] = 0;
            pixels[i + 2] = 0;
            pixels[i + 3] = (pixels[i + 3] / max) * 255;
        }
    }

    _colorize(pixels, gradient) {
        for (var i = 0, len = pixels.length, j; i < len; i += 4) {
            j = pixels[i + 3] * 4; // get gradient color from opacity value

            if (j) {
                pixels[i] = gradient[j];
                pixels[i + 1] = gradient[j + 1];
                pixels[i + 2] = gradient[j + 2];
            }
        }
    }

    _createCanvas(w, h) {
        var canvas = document.createElement('canvas');
        if (w || h) {
            canvas.width = w;
            canvas.height = h || w;
        }

        return canvas;
    }
}