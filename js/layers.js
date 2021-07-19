const GridRows = 7
const GridCols = 7

addLayer("TD1", {
    name: "battlefield",
    symbol: "B",
    position: 0,
    row: 0,
    color: "#FFFFFF",
    resource: "essence",

    tabFormat: [
        "main-display",
        "grid",
        "clickables",
    ],

    grid: {
        rows: GridRows,
        cols: GridCols,

        getStartData(id) {
            return {
                tower: false,
                road: false,
                enemyCount: 0
            }
        },

        getUnlocked(id) {
            return true
        },

        getCanClick(data, id) {
            return true
        },

        onClick(data, id) {

            //if the start or the end -> dont do anything
            if (id == formatGridId(this.cols, this.rows) || id == formatGridId(0, 0)) {
                return
            }

            //placing tower
            if (player[this.layer].holdingTower && !data.tower) {
                player[this.layer].holdingTower = false
                data.tower = true
                var pos = decodeGridId(id)
                player[this.layer].towers.push(new Tower(player[this.layer].towerAttackDelay, player[this.layer].towerDamage, player[this.layer].towerRange, towerParticle, pos.row, pos.col, this.layer))
            }

            //clear old path
            for (var c = 1; c <= GridCols; c++) {
                for (var r = 1; r <= GridRows; r++) {
                    setGridData(this.layer, formatGridId(c, r), {
                        tower: getGridData(this.layer, formatGridId(c, r)).tower,
                        road: false,
                        enemyCount: getGridData(this.layer, formatGridId(c, r)).enemyCount
                    })
                }
            }

            //generate path
            player[this.layer].road = createRoad(this.layer, GridCols, GridRows)

            //destroying tower if requested or path is invalid
            if ((player[this.layer].destroingTowers && data.tower) || player[this.layer].road === false) {
                data.tower = false
                //dont know why but second check is needed
                setGridData(this.layer, id, {
                    tower: false,
                    road: false,
                    enemyCount: getGridData(this.layer, id).enemyCount
                })
                var pos = decodeGridId(id)
                tmpArray = Array()
                for (var i = 0; i < player[this.layer].towers.length; i++) {
                    if (player[this.layer].towers[i].col !== pos.col && player[this.layer].towers.row !== pos.row) {
                        tmpArray.push(player[this.layer].towers[i])
                    }
                }
                player[this.layer].towers = tmpArray
            }

            player[this.layer].road = createRoad(this.layer, GridCols, GridRows)

            player[this.layer].road.forEach(id => setGridData(this.layer, id, {
                tower: false,
                road: true,
                enemyCount: getGridData(this.layer, id).enemyCount
            }))
        },

        getDisplay(data, id) {
            return data.enemyCount ? data.enemyCount : " "
        },

        getStyle(data, id) {
            return {
                "background-color": data.enemyCount ? "#FF0000" :
                    data.road ? "#707070" :
                        data.tower ? "#00FF00" :
                            "#FFFFFF"
            }
        }
    },

    clickables: {
        11: {
            display() {
                return player[this.layer].holdingTower ? "Click this to discard tower" : "Click this to place tower"
            },

            canClick() {
                return !player[this.layer].destroingTowers && !player[this.layer].running
            },

            onClick() {
                player[this.layer].holdingTower = !player[this.layer].holdingTower
            }
        },

        12: {
            display() {
                return player[this.layer].destroingTowers ? "Click here to stop destroing towers" : "Click here to destroy towers"
            },

            canClick() {
                return !player[this.layer].holdingTower && !player[this.layer].running
            },

            onClick() {
                player[this.layer].destroingTowers = !player[this.layer].destroingTowers
            }
        },

        13: {
            display() {
                return player[this.layer].running ? "Pause" : "Run"
            },

            canClick() {
                return true
            },

            onClick() {
                player[this.layer].running = !player[this.layer].running
                player[this.layer].holdingTower = false


            }
        },
    },

    buyables: {
        11: {
            cost(x) { return new Decimal(1.2).pow(x).mul(1).floor() },
            display() { return "Upgrade damage by 1<br> <b>Currently: </b>" + getBuyableAmount(this.layer, this.id).add(1).toString() + "<br><b>Cost: </b>" + this.cost(getBuyableAmount(this.layer, this.id)).toString() },
            canAfford() { return player[this.layer].points.gte(this.cost(getBuyableAmount(this.layer, this.id))) },
            buy() {
                player[this.layer].points = player[this.layer].points.sub(this.cost(getBuyableAmount(this.layer, this.id)))
                player[this.layer].towerDamage += 1
                setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
            },
        },

        12: {
            cost(x) { return new Decimal(1.5).pow(x).mul(1).floor() },
            display() { return "Decrease enemy delay by 5<br> <b>Currently: </b>" + new Decimal(100).sub(getBuyableAmount(this.layer, this.id).mul(5)).toString() + "<br><b>Cost: </b>" + this.cost(getBuyableAmount(this.layer, this.id)).toString() },
            canAfford() { return player[this.layer].points.gte(this.cost(getBuyableAmount(this.layer, this.id))) && getBuyableAmount(this.layer, this.id).lt(19) },
            buy() {
                player[this.layer].points = player[this.layer].points.sub(this.cost(getBuyableAmount(this.layer, this.id)))
                player[this.layer].spawnDelay = player[this.layer].enemyDelay -= 5
                setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
            }
        },

        13: {
            cost(x) { return new Decimal(3).pow(x).mul(1).floor() },
            display() { return "Increase currency multiplayer by 1<br> <b>Currently: </b>" + player[this.layer].currencyMultiplayer + "<br><b>Cost: </b>" + this.cost(getBuyableAmount(this.layer, this.id)).toString() },
            canAfford() { return player[this.layer].points.gte(this.cost(getBuyableAmount(this.layer, this.id))) },
            buy() {
                player[this.layer].points = player[this.layer].points.sub(this.cost(getBuyableAmount(this.layer, this.id)))
                player[this.layer].currencyMultiplayer += 1
                setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
            }
        },

        14: {
            cost(x) { return new Decimal(4).pow(x).mul(1).floor() },
            display() { return "Increase spawn count by 1<br> <b>Currently: </b>" + player[this.layer].spawnCount + "<br><b>Cost: </b>" + this.cost(getBuyableAmount(this.layer, this.id)).toString() },
            canAfford() { return player[this.layer].points.gte(this.cost(getBuyableAmount(this.layer, this.id))) },
            buy() {
                player[this.layer].points = player[this.layer].points.sub(this.cost(getBuyableAmount(this.layer, this.id)))
                player[this.layer].spawnCount += 1
                setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
            }
        },

    },

    startData() {
        return {
            unlocked: true,
            points: new Decimal(0),
            holdingTower: false,
            running: false,
            destroingTowers: false,
            enemies: [],
            towers: [],
            road: [],
            spawnDelay: 100,
            spawnWait: 0,
            enemyDelay: 100,
            towerAttackDelay: 30,
            towerRange: 5,
            maxParticleSpeed: .1,
            towerDamage: 1,
            currencyMultiplayer: 1,
            spawnCount: 1,
        }
    },

    update(diff) {
        if(player[this.layer].road === []) {
            player[this.layer].road = createRoad(this.layer, GridCols, GridRows)

            player[this.layer].road.forEach(id => setGridData(this.layer, id, {
                tower: false,
                road: true,
                enemyCount: getGridData(this.layer, id).enemyCount
            }))
        }

        player[this.layer].enemies.forEach(enemy => enemyTick(enemy))
        player[this.layer].towers.forEach(tower => towerTick(tower))

        while (player[this.layer].enemies.length > 0 && !player[this.layer].enemies[0].active) {
            player[this.layer].enemies.shift()
        }

        if (player[this.layer].running) {

            player[this.layer].spawnWait++
            if (player[this.layer].spawnWait >= player[this.layer].spawnDelay) {
                player[this.layer].spawnWait = 0
                player[this.layer].enemies.push(new Enemy(player[this.layer].spawnCount, player[this.layer].road, 0, player[this.layer].enemyDelay, true, this.layer))
            }
        }
    },

    baseAmount() { return player.points },
    layerShown() { return true }
})

addLayer("EB1", {
    name: "engineering bay",
    symbol: "E",
    position: 1,
    row: 0,
    color: "#FFFFFF",
    resource: "essence",

    tabFormat: [
        "main-display",
        "blank",
        ["layer-proxy", ["TD1", ["buyables"]]],
    ],

    startData() {
        return {
            unlocked: true,
            points: new Decimal(0),
        }
    },

    update(diff) {
        player[this.layer].points = player["TD1"].points
    },

    baseAmount() { return player.points },
    layerShown() { return true }
})