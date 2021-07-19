//File containing "stuffs" needed for mod but not fitable to other categories

/**
 * 
 * @param {String} layer Layer ID
 * @param {Number} cols Number of columns
 * @param {Number} rows Number of rows
 * @returns False if can't get from right-bottom to left-up, otherwise array containing grid IDs creating shortest path
 */
function createRoad(layer, cols, rows) {

    var queue = [[cols, rows]]

    var dist = Array(cols + 1).fill(0).map(x => Array(rows + 1).fill(Infinity))
    dist[cols][rows] = 0

    var previous = Array(cols + 1).fill(0).map(x => Array(rows + 1).fill(Infinity))
    previous[cols][rows] = -1

    while (queue.length) {
        var v = queue.shift()

        var x = v[0]
        var y = v[1]

        var state = getGridData(layer, formatGridId(x - 1, y))
        if (state != undefined && !state.tower && dist[x][y] + 1 < dist[x - 1][y]) {
            queue.push([x - 1, y])
            dist[x - 1][y] = dist[x][y] + 1
            previous[x - 1][y] = [x, y]
        }

        var state = getGridData(layer, formatGridId(x + 1, y))
        if (state != undefined && !state.tower && dist[x][y] + 1 < dist[x + 1][y]) {
            queue.push([x + 1, y])
            dist[x + 1][y] = dist[x][y] + 1
            previous[x + 1][y] = [x, y]
        }

        var state = getGridData(layer, formatGridId(x, y - 1))
        if (state != undefined && !state.tower && dist[x][y] + 1 < dist[x][y - 1]) {
            queue.push([x, y - 1])
            dist[x][y - 1] = dist[x][y] + 1
            previous[x][y - 1] = [x, y]
        }

        var state = getGridData(layer, formatGridId(x, y + 1))
        if (state != undefined && !state.tower && dist[x][y] + 1 < dist[x][y + 1]) {
            queue.push([x, y + 1])
            dist[x][y + 1] = dist[x][y] + 1
            previous[x][y + 1] = [x, y]
        }
    }


    if (!isFinite(dist[1][1])) {
        return false
    }

    var result = Array([1, 1])
    while (previous[result[result.length - 1][0]][result[result.length - 1][1]] != -1) {
        result.push(previous[result[result.length - 1][0]][result[result.length - 1][1]]);
    }

    return result.map((element) => { return formatGridId(element[0], element[1]) }).reverse()
}

/**
 * 
 * @param {Number} cols Number of column
 * @param {Number} rows Number of row
 * @returns ID of clickable in given column and row
 */

function formatGridId(col, row) {
    return col < 10 ? row + "0" + col : "" + row + col
}

/**
 * 
 * @param {String | Number} id 
 * @returns Object {col, row} or undefined if id is undefined
 */
function decodeGridId(id) {
    if (id !== undefined) {
        if(typeof id === "number") {
            id = id.toString();
        }
        if (id.length == 3) {
            return {
                row: Number(id[0]),
                col: Number(id[1] + id[2])
            }
        } else {
            return {
                row: Number(id[0] + id[1]),
                col: Number(id[2] + id[3])
            }
        }
    }
    return undefined
}