var width = 1920,
    height = 1080,
    elements = {},
    context = {};

var fishTemplate = d3.select('#fish').node();
var config = {
    allowWater: true,
    homeRadius: 90,
    maxNodesPerHome: 100,
    reproductiveRate: 0.01, // start low
    reproductiveMultiplier: 1.1,
    deathRate: 0.01,
    moveRate: 0.5,
    nodeSize: 6,
    initialCount: 30,
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

var colors = {
    red: '#ff7c66',
    blue: '#47ceff',
    green: '#70b360',
    orange: '#ffb541',
    gray: '#eeeeee'
};

var fishes = [
    {
        name: 'Jackson',
        x: 100,
        y: 100,
        color: 'blue',
        type: 'fish',
        nodeCount: 0
    },
    {
        name: 'Bubbles',
        x: 1000,
        y: 50,
        color: 'red',
        type: 'fish',
        nodeCount: 0
    },
    {
        name: 'CashMoney',
        x: 200,
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
    nodeCount: 0
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


function generateMicrobe(species) {

}

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

function randomizeNodes(nodes, count) {
    d3.range(count || 3).map(function(i) {
        return getRandomNumber(0, nodes.length);
    }).forEach(function(i) {
        var node = nodes[i];
        nodes[i] = randomizeNode(node);
    });
    return nodes;
}

function randomizeNode(node) {
    var colorNames = Object.keys(colors);
    var index = node.index % 4;
    var color = colorNames[index];
    var host = getRandomHost(config.allowWater);
    sendToHost(node, host);
    node.color = color;
    node.state = nodeState.ALIVE;
    node.radius = config.nodeSize;

    return node;
}

function sendToHost(node, host) {
    node.host = host;
    node.foci = getHostFoci(host);
    node.clusterPadding = host.type == 'fish' ? 2 : 15;
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
    return randomizeNode({ index: i });
});

var force = d3.layout.force()
    .nodes(context.nodes)
    .gravity(0)
    .charge(0)
    .friction(.91)
    .size([width, height])
    .on('tick', tick);

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

elements.foci = elements.stage.selectAll('.foci')
            .data(fishes)
            .enter().append('circle')
        .attr('class', 'foci')
        .attr('r', 10)
        .style('stroke', 'rgba(0,0,0, 0.24)')
        .style('fill', 'none')
        .attr('cx', function(d) { return d.x + config.fociOffset.left })
        .attr('cy', function(d) { return d.y + config.fociOffset.top });
        // .style('fill', function(d, i) { return colors[d.color]; })
        // .style('stroke', function(d, i) { return d3.rgb(colors[d.color]).darker(1); });

function tick(e) {
    elements.node.each(gravity(.051 * e.alpha))
        .each(collide(.5))
        .style('fill', function(d, i) { return colors[d.color]; })
        .style('stroke', function(d, i) { return d3.rgb(colors[d.color]).darker(1); })
        .attr('radius', function(d) { return d.radius; })
        .attr('cx', function(d) { return d.x; })
        .attr('cy', function(d) { return d.y; });
}

function gravity(alpha) {
    return function(d) {
        d.y += (d.foci.y - d.y) * alpha;
        d.x += (d.foci.x - d.x) * alpha;
    };
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
        if (quad.point && (quad.point !== d)) {
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
var changeCount = Math.floor(config.initialCount / (1000 / config.iteration.interval));


function render(nodes) {
    // var deadOnes = nodes.filter(function(node) { return node.state == nodeState.DEAD});
    // console.log('Dead Nodes: ', deadOnes.length, deadOnes);

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
        var nodeCountInHost = node.host.nodeCount;
        var isSameColor = doesColorMatch(node, node.host);
        var shouldReproduce = shouldDo(isSameColor ? 0.5 : 0.1);
        var shouldDie = shouldDo(0.2);
        var shouldMove = shouldDo(0.3);
        var nodesInHost = nodes.filter(function(x) {
            return x.host.color == node.host.color;
        }).length;

        if(shouldReproduce) {
            var child = reproduce(node);
            var index = nodes.length;
            // console.log(`${node.color} had baby in host ${node.host.color}`);
            nodes.push(child);
        }

        if(shouldDie) {
            // die(node); // TODO: kill node
            // console.log(`${node.color} at ${i} died in host ${node.host.color}`);
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


// render(context.nodes);

var iterator = setInterval(function() {
    //force.stop();
    // context.nodes = randomizeNodes(context.nodes, 3);
    context.nodes = simulateChange(context.nodes, currentIndex, changeCount);
    currentIndex += changeCount;

    if(currentIndex >= context.nodes.length - 1) {
        currentIndex = 0;
    }

    render(context.nodes);
}, config.iteration.interval);


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
