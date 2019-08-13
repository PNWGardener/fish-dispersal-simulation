var width = 1920,
    height = 1080,
    elements = {},
    context = {
        paused: false,
        started: false
    };

var fishTemplate = d3.select('#fish').node();
var config = {
    allowWater: false,
    pauseOnClick: true,
    homeRadius: 90,
    maxNodesPerHome: 100,
    reproductiveRate: 0.01, // start low
    reproductiveMultiplier: 1.1,
    deathRate: 0.01,
    moveRate: 0.5,
    nodeSize: 6,
    initialCount: 40,
    clusterPadding: 2,
    padding: 1,
    fociOffset: {
        left: 300,
        top: 200
    },
    foci: {
        radius: 20
    },
    species: {
        red: {
            color: '#ff0000'
        }
    }
};
var nodeState = {
    ALIVE: 'alive',
    DEAD: 'dead'
};

var populations = {
    red: 0,
    blue: 0,
    green: 0,
    orange: 0,
    water: 0
}

var colors = {
    red: '#ff7c66',
    blue: '#47ceff',
    green: '#70b360',
    orange: '#ffb541',
    purple: '#e89ffc',
    gray: '#eeeeee'
};

var fishes = [
    {
        name: 'Jackson',
        x: 300,
        y: 130,
        color: 'blue',
        type: 'fish',
        nodeCount: 0
    },
    {
        name: 'Bubbles',
        x: 1000,
        y: 90,
        color: 'red',
        type: 'fish',
        nodeCount: 0
    },
    {
        name: 'CashMoney',
        x: 360,
        y: 550,
        color: 'green',
        type: 'fish',
        nodeCount: 0
    },
    {
        name: 'NoRhymes',
        x: 1100,
        y: 500,
        color: 'orange',
        type: 'fish',
        nodeCount: 0
    }
];

var water = {
    x: Math.floor(width / 2),
    y: Math.floor(height / 2),
    nodeCount: 0,
    color: 'purple',
    type: 'water'
};

var graveyard = {
    x: 0,
    y: 0,
    nodeCount: 0
};

/*
- Color is species
- 5 different microbes
- if host is null, in the water
- actions:
    * Move
    * Die
    * Duplicate

    {
        x: number,
        y: number,
        color: color,
        size: num,
        host: string,
        reproductiveRate: num,

    }
*/

function reproduce(node) {
    var child = {
        state: nodeState.ALIVE,
        color:  node.color,
        radius: node.radius,
        x: node.x,
        y: node.y
    };
    sendToHost(child, node.host);

    return child;
}

function move(microbe, host) {
    // if host is null, moves into water
    // must move from fish to water before going to another fish
}

function die(node) {
    node.state = nodeState.DEAD;
    node.color = 'gray';
    node.radius = 5;
    // sendToHost(node, graveyard);
}

function getClone(fish) {
    return fishTemplate.cloneNode(true);
}

function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function getRandomOffset(max) {
    return {
        left: getRandomNumber(max, -1 * max),
        top: getRandomNumber(max, -1 * max)
    }
}

function getRandomHost(allowWater) {
    var start = allowWater ? -1 : 0;
    var fishIndex = getRandomNumber(start, fishes.length - 1);
    if(fishIndex < 0) {
        return water;
    }
    else {
        return fishes[fishIndex];
    }
}

function getHostByColor(color) {
    console.log(`finding host for ${color}`);
    var host = fishes.find(function(fish) {
        return fish.color === color;
    });

    if(!host) {
        host = config.allowWater ? water : getRandomHost(config.allowWater);
    }
    console.log(`color ${color} host is ${host.name}:${host.color}`);
    return host;
}

function getHostFoci(host) {
    var foci = {
        x: host.x,
        y: host.y
    };

    if(host.type == 'fish') {
        foci.x += config.fociOffset.left,
        foci.y += config.fociOffset.top
    }

    return foci;
}

function generateNode(node) {
    var colorNames = Object.keys(colors);
    var colorCount = config.allowWater ? 5 : 4;
    var index = node.index % colorCount;
    var color = colorNames[index];
    var host = getHostByColor(color);
    sendToHost(node, host);
    node.color = color;
    node.state = nodeState.ALIVE;
    node.radius = config.nodeSize;

    node.x = water.x;
    node.y = water.y;

    return node;
}

function updateHostPopulation(host, amount) {
    if(host && host.type == 'fish') {
        var currentPop = populations[host.color];
        populations[host.color] = currentPop + amount;
    } else {
        var currentPop = populations.water;
        populations.water = currentPop + amount;
    }
}

function sendToHost(node, host) {
    if(node.host) {
        updateHostPopulation(node.host, -1);
    }

    if(host) {
        updateHostPopulation(host, 1);
    }


    node.host = host;
    node.foci = getHostFoci(host);
    node.clusterPadding = host.type == 'fish' ? 2 : 25;
}

function shouldDo(chance) {
    var random = Math.random();
    return random <= (chance || 0.5);
}

function ifHostFishThenOr(host, then, or) {
    if(host.type == 'fish') {
        return then;
    } else {
        return or;
    }
}

context.nodes = d3.range(config.initialCount).map(function(i) {
    return generateNode({ index: i });
});

var force = d3.layout.force()
    .nodes(context.nodes)
    .gravity(0)
    .charge(0)
    .friction(.91)
    .size([width, height])
    .on('tick', tick);

elements.body = d3.select('body')
    .on('click', function() {
        if(!context.started) {
            start();
            return;
        }
        if(config.pauseOnClick) {
            context.paused = !context.paused;
        }
    })

elements.stage = d3.select('#demo').append('svg')
    .attr('class', 'stage')
    .attr('width', width)
    .attr('height', height);

elements.fish = elements.stage.selectAll('.fish')
    .data(fishes)
    .enter()
        .append(function(data) { return getClone(data); })
            .attr('viewBox', '0 0 600 400')
            .attr('width', '600px')
            .attr('height', '400px')
            .attr('x', function(d) { return d.x })
            .attr('y', function(d) { return d.y })
            .attr('class', function(fish) { return ['fish', `color-${fish.color}`].join(' '); });

if(config.showFoci) {
    elements.foci = elements.stage.selectAll('.foci')
        .data(fishes)
        .enter().append('circle')
            .attr('class', 'foci')
            .attr('r', 10)
            .style('stroke', 'rgba(0,0,0, 0.24)')
            .style('fill', 'none')
            .attr('cx', function(d) { return d.x + config.fociOffset.left })
            .attr('cy', function(d) { return d.y + config.fociOffset.top });
}


function tick(e) {
    elements.node.each(gravity(.051 * e.alpha))
        .each(collide(.5))
        .style('fill', function(d, i) { return colors[d.color]; })
        .style('stroke', function(d, i) { return d3.rgb(colors[d.color]).darker(1); })
        .attr('radius', function(d) { return d.radius; })
        .attr('cx', function(d) {
            if(isValidPoint(d)) {
                return d.x;
            }
        })
        .attr('cy', function(d) {
            if(isValidPoint(d)) {
                return d.y;
            }
        });
}

function gravity(alpha) {
    return function(d) {

        if(d.host && d.host.type == 'water' && context.started) {
            d.y += (d.foci.y - d.y) * alpha * (getRandomNumber(0, 10) / 10);
            d.x += (d.foci.x - d.x) * alpha * (getRandomNumber(0, 10) / 10);
        }
        else {
            d.y += (d.foci.y - d.y) * alpha;
            d.x += (d.foci.x - d.x) * alpha;
        }
    };
}

function isValidPoint(point) {
    return point && point.x && point.y && !isNaN(point.x) && !isNaN(point.y);
}

function collide(alpha) {

    var quadtree = d3.geom.quadtree(context.nodes);

    return function(d) {
        var r = d.radius + config.nodeSize + Math.max(1, d.clusterPadding),
          nx1 = d.x - r,
          nx2 = d.x + r,
          ny1 = d.y - r,
          ny2 = d.y + r;
      quadtree.visit(function(quad, x1, y1, x2, y2) {

        if (quad.point && (quad.point !== d) && isValidPoint(quad.point)) {
          var x = d.x - quad.point.x,
              y = d.y - quad.point.y,
              l = Math.sqrt(x * x + y * y),
              r = d.radius + quad.point.radius + (d.foci === quad.point.foci ? 1 : d.clusterPadding);

          if (l < r) {
            l = (l - r) / l * alpha;
            d.x -= x *= l;
            d.y -= y *= l;
            quad.point.x += x;
            quad.point.y += y;
          }
        }
        return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
      });
    };
}


function doesColorMatch(node, host) {
    return node.color && node.color == host.color;
}

function removeNode(index, nodes) {
    nodes.splice(index, 0);
}

config.iteration = {
    interval: 200
};

var currentIndex = 0;
var changeCount = Math.floor(Math.min(config.initialCount / (1000 / config.iteration.interval), (config.initialCount / 4)));

function render(nodes) {
    elements.node = elements.node.data(nodes);
    elements.node.enter().insert('circle')
        .attr('class', 'node')
        .attr('r', function(d) {
            return d.radius ;
        })
        .style('fill', function(d, i) { return colors[d.color]; })
        .style('stroke', function(d, i) { return d3.rgb(colors[d.color]).darker(1); });

    elements.node.exit().remove();

    force.start();
}

function simulateChange(nodes, startIndex, count) {
    var start = startIndex + 0;
    var end = Math.min(startIndex + count, nodes.length - 1);

    var remove = [];
    for(var i = start; i < end; i++) {
        var node = nodes[i];
        var population = node.host.color ? populations[node.host.color] : populations.water;
        var isSameColor = doesColorMatch(node, node.host);
        var shouldReproduce = shouldDo(isSameColor ? 0.5 : 0.1);
        var shouldDie = shouldDo(0.2);
        var shouldMove = !shouldDie && shouldDo(0.3);
        if(node.host.type == 'fish' && population >= config.maxNodesPerHome) {
            shouldDie = shouldDo(0.8);
        }

        if(shouldReproduce) {
            var child = reproduce(node);
            var index = nodes.length;
            // console.log(`${node.color} had baby in host ${node.host.color}`);
            nodes.push(child);
        }

        if(shouldDie) {
            // die(node); // TODO: kill node
            // console.log(`${node.color} at ${i} died in host ${node.host.color}`);
            updateHostPopulation(node.host, -1);
            remove.push(i);
        }

        if(shouldMove) {
            var currentHostColor = node.host.color;
            var host = getRandomHost(config.allowWater);
            sendToHost(node, host);
            // console.log(`${node.color} moved from ${currentHostColor} to ${host.color}`);
        }

        nodes[i] = node;
    }

    remove.sort().reverse().forEach(function(i) {
        nodes.splice(i, 1);
    });

    return nodes; // .filter(function(node) { return node.state == nodeState.ALIVE; });
}

elements.node = elements.stage.selectAll('.node');


config.delay = 4000;
// setTimeout(start, config.delay);
render(context.nodes);
function start() {
    context.started = true;
    var iterator = setInterval(function() {

        if(!context.paused) {
            context.nodes = simulateChange(context.nodes, currentIndex, changeCount);
            currentIndex += changeCount;

            if(currentIndex >= context.nodes.length - 1) {
                currentIndex = 0;
            }
        }

        render(context.nodes);
    }, config.iteration.interval);
}



/*
each node has a state that determines speed and charge
    - states: floating, transitioning, contained
    - nodes in the water have low charge and others have high
    - transitioning has lower speed

how many should be checked per interval?
what should that interval be?
*/
function getBoundary(pos, radius) {
    return {
        top: pos.y - radius,
        right: pos.x + radius,
        bottom: pos.y + radius,
        left: pos.x - radius
    }
}

function isWithinBoundary(coord, boundary) {
    return coord.x >= boundary.left &&
            coord.x <= boundary.right &&
            coord.y >= boundary.bottom &&
            coord.y <= boundary.top;
}
