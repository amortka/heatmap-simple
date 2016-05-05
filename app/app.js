'use strict';

import main from './index.html';
import styles from './style.css';

import Heatmap from './src/Heatmap.class';

(function() {

    //var heat = new Heatmap('playground').data(randomPoints(250, 640, 640)).draw();
    var heat = new Heatmap('playground', 'assets/img.jpg').data(randomPoints(5, 640, 640)).draw();
    /*var heat = new Heatmap('playground', '/assets/img.jpg').data([
            [10, 10],
            [10, 10],
            [10, 10],
            [50, 50]
    ]).draw();*/

    var curr = 0;
    var gradients = [{
        0: '#134E5E',
        1: '#71B280'
    }, {
        0: 'blue',
        1: 'red'
    }, {
        0.00: '#F9F23D',
        0.25: '#F9D738',
        0.5: '#FBA330',
        0.75: '#FC7529',
        1.00: '#FC5E25'
    }, {
        0.00: '#FFFFFF',
        0.25: '#BD2B2B',
        0.50: '#9E1B30',
        0.75: '#780E3D',
        1.00: 'red'
    }, {
        0.4: 'blue',
        0.6: 'cyan',
        0.7: 'lime',
        0.8: 'yellow',
        1.0: 'red'
    }];

    var blurCtrl = document.getElementById('blur-slider');
    var radiusCtrl = document.getElementById('radius-slider');
    var colorBtn = document.getElementById('btn-color');
    var mouseBtn = document.getElementById('btn-mouse');

    blurCtrl.addEventListener('change', blurChangeHandler);
    blurCtrl.addEventListener('input', blurChangeHandler);
    radiusCtrl.addEventListener('change', radiusChangeHandler);
    radiusCtrl.addEventListener('input', radiusChangeHandler);
    colorBtn.addEventListener('click', colorBtnHandler);
    mouseBtn.addEventListener('click', mouseBtnHandler);

    function blurChangeHandler(ev) {
        heat.setBlur(ev.target.value);
    }

    function radiusChangeHandler(ev) {
        heat.setRadius(ev.target.value);
    }

    function colorBtnHandler() {
        heat.setGradient(gradients[curr++]);
        curr = curr < gradients.length ? curr : 0;
    }
    
    function mouseBtnHandler(evt) {
        heat.catchMouse();
    }

    function randomPoints(n, width, height) {
        var a = [];
        for (let i = 0; i < n; i++) {
            a.push([~~(Math.random() * width), ~~(Math.random() * height)]);
        }
        return a;
    }

}());