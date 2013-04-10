var Bubble = require('bubble');

setInterval(function() {
    (new Bubble({length: 50 + (250 * Math.random())})).pop();
}, 100);
