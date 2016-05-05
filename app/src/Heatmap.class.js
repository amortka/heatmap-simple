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
    },
    scaleFactor: 1.1
};

export default class {

    constructor(canvas, img) {
        this.canvas = canvas = _.isString(canvas) ? document.getElementById(canvas) : canvas;
        this._ctx = canvas.getContext('2d');
        this._width = canvas.width;
        this._height = canvas.height;

        this.lastX = canvas.width / 2;
        this.lastY = canvas.height / 2;
        this.scaleFactor = DEFAULTS.scaleFactor;
        this.currentScale = 1;
        this.dragged = false;

        this.canvasHeat = this._createCanvas(this._width, this._height);
        this._ctxHeat = this.canvasHeat.getContext('2d');
        this._ctxHeat.save();

        if (img) {
            this._img = new Image();
            this._img.src = img;
            this._isLoaded = false;
            this._img.addEventListener('load', () => {
                this._isLoaded = true;
            });
        }

        this._data = [];

        trackTransforms(this._ctx);

        canvas.addEventListener('DOMMouseScroll', this._handleScroll.bind(this));
        canvas.addEventListener('mousewheel', this._handleScroll.bind(this));
        canvas.addEventListener('mousemove', this._handleMouseMove.bind(this));
        canvas.addEventListener('mousedown', this._handleMouseDown.bind(this));
        canvas.addEventListener('mouseup', this._handleMouseUp.bind(this));
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
            setTimeout(() => {
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

        var p1 = ctx.transformedPoint(0, 0);
        var p2 = ctx.transformedPoint(this._width, this._height);
        ctx.clearRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);

        if (this._img) {
            ctx.drawImage(this._img, 0, 0);
        }

        this._drawHeat(p1, p2);

        return this;
    }

    zoom(clicks) {
        let ctx = this._ctx;

        var pt = ctx.transformedPoint(this.lastX, this.lastY);
        ctx.translate(pt.x, pt.y);

        var factor = Math.pow(this.scaleFactor, clicks);
        this.currentScale *= factor;
        ctx.scale(factor, factor);
        ctx.translate(-pt.x, -pt.y);

        this._cacheCircle(factor);

        //this._drawHeat();
        this.draw();
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
    
    catchMouse() {
        this.drawMouse = _.isUndefined(this.drawMouse) ? true : !this.drawMouse;
    }

    /* -- private methods */

    _drawHeat(p1, p2) {

        let ctx = this._ctx;
        let ctxHeat = this._ctxHeat;
        let l = (this._r + this._blur) * this.currentScale;
        
        
        ctx.scale(1 / this.currentScale, 1 / this.currentScale);

        // ---- all drawing code must be between re-scale 1:1
        ctxHeat.globalAlpha = 1;

        ctxHeat.clearRect(0, 0, this._width, this._height);
        let data = _.filter(this._data, (p) => {
            return p[0] >= Math.max(p1.x, 0) - l &&
                p[0] <= Math.min(p2.x, this._width) + l &&
                p[1] >= Math.max(p1.y, 0)  - l &&
                p[1] <= Math.min(p2.y, this._height) + l;
        });

        // ctxHeat.strokeStyle = "green";
        // ctxHeat.strokeRect(10, 10, this._width - 20, this._height - 20);

        // ctxHeat.strokeStyle = "#FFF000";
        for (let i = 0, len = data.length, p; i < len; i++) {
            let p = data[i];
            let x = (p[0] - p1.x) * this.currentScale;
            let y = (p[1] - p1.y) * this.currentScale;

            ctxHeat.globalAlpha = Math.max(1 / this._data.length, 0.2);
            ctxHeat.drawImage(this._circle, x - this._r - this._blur, y - this._r - this._blur);
            // ctxHeat.strokeRect(x - 5, y - 5, 10, 10);
        }

        let colored = ctxHeat.getImageData(0, 0, this._width, this._height);
        this._normalize(colored.data);
        this._colorize(colored.data, this.gradient);
        ctxHeat.putImageData(colored, 0, 0);

        ctx.drawImage(this.canvasHeat, p1.x * this.currentScale, p1.y * this.currentScale);

        // ---- end of heat draw, reset scale to the current one
        ctx.scale(this.currentScale, this.currentScale);
    }

    _handleMouseDown(evt) {
        document.body.style.mozUserSelect = document.body.style.webkitUserSelect = document.body.style.userSelect = 'none';
        this.lastX = evt.offsetX || (evt.pageX - this.canvas.offsetLeft);
        this.lastY = evt.offsetY || (evt.pageY - this.canvas.offsetTop);
        this.dragStart = this._ctx.transformedPoint(this.lastX, this.lastY);
        this.dragged = false;
    }
    _handleMouseUp(evt) {
        this.dragStart = null;
        if (!this.dragged) {
            this.zoom(evt.shiftKey ? -1 : 1);
        }
    }

    _handleScroll(evt) {
        var delta = evt.wheelDelta ? evt.wheelDelta / 40 : evt.detail ? -evt.detail : 0;
        if (delta) {
            this.zoom(delta);
        }
        return evt.preventDefault() && false;
    }

    _handleMouseMove(evt) {
        this.lastX = evt.offsetX || (evt.pageX - this.canvas.offsetLeft);
        this.lastY = evt.offsetY || (evt.pageY - this.canvas.offsetTop);
        let pt = this._ctx.transformedPoint(this.lastX, this.lastY);
        
        this.dragged = true;
        if (this.dragStart) {
            
            let dx = (pt.x - this.dragStart.x);

            this._ctx.translate(pt.x - this.dragStart.x, pt.y - this.dragStart.y);
            this.draw();
        }
        
        if (this.drawMouse) {
            this._data.push([pt.x, pt.y]);
            this.draw();
        }
    }

    _cacheCircle(factor) {
        let blur = (this._blur = this._blur ? this._blur : DEFAULTS.blur);
        let r = this._r = (this._r ? this._r : DEFAULTS.radius);
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

function trackTransforms(ctx) {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
    var xform = svg.createSVGMatrix();
    ctx.getTransform = function() {
        return xform;
    };

    var savedTransforms = [];
    var save = ctx.save;
    ctx.save = function() {
        savedTransforms.push(xform.translate(0, 0));
        return save.call(ctx);
    };
    var restore = ctx.restore;
    ctx.restore = function() {
        xform = savedTransforms.pop();
        return restore.call(ctx);
    };

    var scale = ctx.scale;
    ctx.scale = function(sx, sy) {
        xform = xform.scaleNonUniform(sx, sy);
        return scale.call(ctx, sx, sy);
    };
    var rotate = ctx.rotate;
    ctx.rotate = function(radians) {
        xform = xform.rotate(radians * 180 / Math.PI);
        return rotate.call(ctx, radians);
    };
    var translate = ctx.translate;
    ctx.translate = function(dx, dy) {
        xform = xform.translate(dx, dy);
        return translate.call(ctx, dx, dy);
    };
    var transform = ctx.transform;
    ctx.transform = function(a, b, c, d, e, f) {
        var m2 = svg.createSVGMatrix();
        m2.a = a;
        m2.b = b;
        m2.c = c;
        m2.d = d;
        m2.e = e;
        m2.f = f;
        xform = xform.multiply(m2);
        return transform.call(ctx, a, b, c, d, e, f);
    };
    var setTransform = ctx.setTransform;
    ctx.setTransform = function(a, b, c, d, e, f) {
        xform.a = a;
        xform.b = b;
        xform.c = c;
        xform.d = d;
        xform.e = e;
        xform.f = f;
        return setTransform.call(ctx, a, b, c, d, e, f);
    };

    var pt = svg.createSVGPoint();
    ctx.transformedPoint = function(x, y) {
        pt.x = x;
        pt.y = y;
        return pt.matrixTransform(xform.inverse());
    }
}