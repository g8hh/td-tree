const GridRows = 7
const GridCols = 7

var towerIDs = {
    "normal-tower": normalTower,
    "wall-tower": wallTower,
    "spread-tower": spreadTower
}

var towerColors = {
    "normal-tower": "#00FF00",
    "wall-tower": "#0000FF",
    "spread-tower": "#FFAA00"
}

addLayer("TD1", {
    name: "battlefield",
    symbol: "B",
    position: 0,
    row: 0,
    color: "#FFFFFF",
    resource: "essence",

    tabFormat: {
        "Main tab": {
            content: [
                "main-display",
                ["display-text", function () {
                    return "You have<br>"
                        + player[this.layer].placedTowers["normal-tower"] + "/" + player[this.layer].boughtTowers["normal-tower"] + " Normal towers<br>"
                        + player[this.layer].placedTowers["wall-tower"] + "/" + player[this.layer].boughtTowers["wall-tower"] + " Walls<br>"
                        + player[this.layer].placedTowers["spread-tower"] + "/" + player[this.layer].boughtTowers["spread-tower"] + " Spread Towers<br>"
                }],
                "grid",
                ["row", [
                    ["clickable", "running-button"]
                ]],
                ["row", [
                    ["clickable", "normal-tower-selector"],
                    ["clickable", "wall-tower-selector"],
                    ["clickable", "spread-tower-selector"],
                    ["clickable", "tower-destroyer"]
                ]],
                ["row", [
                    ["buyable", "normal-tower-buyer"],
                    ["buyable", "wall-tower-buyer"],
                    ["buyable", "spread-tower-buyer"],
                    ["buyable", "blank"]
                ]]
            ]
        },
        "Upgrades": {
            content: [
                "main-display",
                "blank",
                ["display-text", "Enemy related upgrades"],
                "blank",
                ["row", [
                    ["buyable", "enemy-count"],
                    ["buyable", "enemy-delay"],
                    ["buyable", "currency-multiplayer"]
                ]],
                "blank",
                ["display-text", "Normal Tower related upgrades"],
                "blank",
                ["row", [
                    ["buyable", "normal-tower-damage-upgrade"],
                    ["buyable", "normal-tower-bullet-speed"]
                ]],
                "blank",
                ["display-text", "Spread Tower related upgrades"],
                "blank",
                ["row", [
                    ["buyable", "spread-tower-count-upgrade"],
                ]]
            ]
        }
    },

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
            if (data.tower === false && player[this.layer].currentTower != "none" && player[this.layer].placedTowers[player[this.layer].currentTower] < player[this.layer].boughtTowers[player[this.layer].currentTower]) {
                data.tower = player[this.layer].currentTower
                player[this.layer].placedTowers[player[this.layer].currentTower]++
                var pos = decodeGridId(id)
                player[this.layer].towers.push(createTower(player[this.layer].currentTower, this.layer, pos.row, pos.col))
            } else if (player[this.layer].currentTower != "none" && player[this.layer].placedTowers[player[this.layer].currentTower] < player[this.layer].boughtTowers[player[this.layer].currentTower]) {
                var pos = decodeGridId(id)
                tmpArray = Array()
                for (var i = 0; i < player[this.layer].towers.length; i++) {
                    if (player[this.layer].towers[i].col !== pos.col || player[this.layer].towers[i].row !== pos.row) {
                        tmpArray.push(player[this.layer].towers[i])
                    }
                }

                player[this.layer].towers = tmpArray

                player[this.layer].placedTowers[data.tower]--
                data.tower = player[this.layer].currentTower
                player[this.layer].placedTowers[player[this.layer].currentTower]++
                player[this.layer].towers.push(createTower(player[this.layer].currentTower, this.layer, pos.row, pos.col))
            }
            //clear old path
            for (var c = 1; c <= GridCols; c++) {
                for (var r = 1; r <= GridRows; r++) {
                    setGridData(this.layer, formatGridId(c, r), {
                        tower: getGridData(this.layer, formatGridId(c, r)).tower,
                        road: false,
                        enemyCount: 0
                    })
                }
            }

            player[this.layer].enemies.forEach(enemy => enemy.active = false)
            player[this.layer].enemies = []


            //generate path
            player[this.layer].road = createRoad(this.layer, GridCols, GridRows)

            //destroying tower if requested or path is invalid
            if (data.tower != false && (player[this.layer].road === false || player[this.layer].currentTower == "none")) {
                player[this.layer].placedTowers[data.tower]--
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
                    if (player[this.layer].towers[i].col !== pos.col || player[this.layer].towers[i].row !== pos.row) {
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
            var color = "#000000"
            if (data.enemyCount) {
                color = "#FF0000"
            } else if (data.road) {
                color = "#707070"
            } else {
                color = towerColors[data.tower]
            }

            return {
                "background-color": color
            }
        }
    },

    clickables: {
        "running-button": {
            display() {
                return player[this.layer].running ? "<h3>Pause</h3>" : "<h3>Run</h3>"
            },

            canClick() {
                return true
            },

            onClick() {
                player[this.layer].running = !player[this.layer].running
            },

            style: {
                "width": "100px",
                "height": "100px"
            }
        },

        "normal-tower-selector": {
            display() {
                return "Click this to place normal towers"
            },

            canClick() {
                return player[this.layer].currentTower != "normal-tower"
            },

            onClick() {
                return player[this.layer].currentTower = "normal-tower"
            },

            style: {
                "width": "100px",
                "height": "100px"
            }
        },

        "wall-tower-selector": {
            display() {
                return "Click this to place walls"
            },

            canClick() {
                return player[this.layer].currentTower != "wall-tower"
            },

            onClick() {
                return player[this.layer].currentTower = "wall-tower"
            },

            style: {
                "width": "100px",
                "height": "100px"
            }
        },

        "spread-tower-selector": {
            display() {
                return "Click this to place spread towers"
            },

            canClick() {
                return player[this.layer].currentTower != "spread-tower"
            },

            onClick() {
                return player[this.layer].currentTower = "spread-tower"
            },

            style: {
                "width": "100px",
                "height": "100px"
            }
        },

        "tower-destroyer": {
            display() {
                return "Click this to destroy towers"
            },

            canClick() {
                return player[this.layer].currentTower != "none"
            },

            onClick() {
                return player[this.layer].currentTower = "none"
            },

            style: {
                "width": "100px",
                "height": "100px"
            }
        }

    },

    buyables: {
        "normal-tower-damage-upgrade": {
            cost(x) { return new Decimal(1.2).pow(x).mul(1).floor() },
            display() { return "Upgrade damage by 1<br><b>Currently: </b>" + format(getBuyableAmount(this.layer, this.id).add(1)) + "<br><b>Cost: </b>" + format(this.cost(getBuyableAmount(this.layer, this.id))) },
            canAfford() { return player[this.layer].points.gte(this.cost(getBuyableAmount(this.layer, this.id))) },
            buy() {
                player[this.layer].points = player[this.layer].points.sub(this.cost(getBuyableAmount(this.layer, this.id)))
                setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
                player[this.layer].towerStats["normal-tower"].damage = 1 + getBuyableAmount(this.layer, this.id).toNumber()
            },
        },

        "enemy-delay": {
            cost(x) { return new Decimal(4).pow(x).mul(1).floor() },
            display() { return "Decrease enemy delay by 5<br><b>Currently: </b>" + format(new Decimal(100).sub(getBuyableAmount(this.layer, this.id).mul(5))) + "<br><b>Cost: </b>" + format(this.cost(getBuyableAmount(this.layer, this.id))) },
            canAfford() { return player[this.layer].points.gte(this.cost(getBuyableAmount(this.layer, this.id))) && getBuyableAmount(this.layer, this.id).lt(9) },
            buy() {
                player[this.layer].points = player[this.layer].points.sub(this.cost(getBuyableAmount(this.layer, this.id)))
                setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
                player[this.layer].spawnDelay = player[this.layer].enemyDelay -= 5
            }
        },

        "currency-multiplayer": {
            cost(x) { return new Decimal(3).pow(x).mul(1).floor() },
            display() { return "Increase currency multiplayer by 1<br><b>Currently: </b>" + format(player[this.layer].currencyMultiplayer) + "<br><b>Cost: </b>" + format(this.cost(getBuyableAmount(this.layer, this.id))) },
            canAfford() { return player[this.layer].points.gte(this.cost(getBuyableAmount(this.layer, this.id))) },
            buy() {
                player[this.layer].points = player[this.layer].points.sub(this.cost(getBuyableAmount(this.layer, this.id)))
                setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
                player[this.layer].currencyMultiplayer += 1
            }
        },

        "enemy-count": {
            cost(x) { return new Decimal(4).pow(x).mul(1).floor() },
            display() { return "Increase spawn count by 1<br><b>Currently: </b>" + format(player[this.layer].spawnCount) + "<br><b>Cost: </b>" + format(this.cost(getBuyableAmount(this.layer, this.id))) },
            canAfford() { return player[this.layer].points.gte(this.cost(getBuyableAmount(this.layer, this.id))) },
            buy() {
                player[this.layer].points = player[this.layer].points.sub(this.cost(getBuyableAmount(this.layer, this.id)))
                player[this.layer].spawnCount += 1
                setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
            }
        },

        "normal-tower-bullet-speed": {
            cost(x) { return new Decimal(10).pow(x).mul(1).floor() },
            display() { return "Increase bullet speed by .1<br><b>Currently: </b>" + format(player[this.layer].towerStats["normal-tower"].maxParticleSpeed) + "<br><b>Cost: </b>" + format(this.cost(getBuyableAmount(this.layer, this.id))) },
            canAfford() { return player[this.layer].points.gte(this.cost(getBuyableAmount(this.layer, this.id))) },
            buy() {
                player[this.layer].points = player[this.layer].points.sub(this.cost(getBuyableAmount(this.layer, this.id)))
                player[this.layer].towerStats["normal-tower"].maxParticleSpeed += .1
                setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
            }
        },

        "spread-tower-count-upgrade": {
            cost(x) { return new Decimal(10).pow(x).mul(5).floor() },
            display() { return "Increase bullet count by 1<br><b>Currently: </b>" + format(player[this.layer].towerStats["spread-tower"].bulletCount) + "<br><b>Cost: </b>" + format(this.cost(getBuyableAmount(this.layer, this.id))) },
            canAfford() { return player[this.layer].points.gte(this.cost(getBuyableAmount(this.layer, this.id))) },
            buy() {
                player[this.layer].points = player[this.layer].points.sub(this.cost(getBuyableAmount(this.layer, this.id)))
                player[this.layer].towerStats["spread-tower"].bulletCount += 1
                setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
            }
        },

        "normal-tower-buyer": {
            cost(x) { return new Decimal(5).pow(x).mul(5).floor() },
            display() { return "Increase number of normal towers by one<br><b>Currenly: </b>" + format(getBuyableAmount(this.layer, this.id)) + "<br><b>Cost: </b>" + format(this.cost(getBuyableAmount(this.layer, this.id))) },
            canAfford() { return player[this.layer].points.gte(this.cost(getBuyableAmount(this.layer, this.id))) },
            buy() {
                player[this.layer].points = player[this.layer].points.sub(this.cost(getBuyableAmount(this.layer, this.id)))
                player[this.layer].boughtTowers["normal-tower"] += 1
                setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
            },
            style: {
                "width": "100px",
                "height": "100px"
            }

        },

        "wall-tower-buyer": {
            cost(x) { return new Decimal(2.5).pow(x).mul(3).floor() },
            display() { return "Increase number of walls by one<br><b>Currenly: </b>" + format(getBuyableAmount(this.layer, this.id)) + "<br><b>Cost: </b>" + format(this.cost(getBuyableAmount(this.layer, this.id))) },
            canAfford() { return player[this.layer].points.gte(this.cost(getBuyableAmount(this.layer, this.id))) },
            buy() {
                player[this.layer].points = player[this.layer].points.sub(this.cost(getBuyableAmount(this.layer, this.id)))
                player[this.layer].boughtTowers["wall-tower"] += 1
                setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
            },
            style: {
                "width": "100px",
                "height": "100px"
            }
        },

        "spread-tower-buyer": {
            cost(x) { return new Decimal(10).pow(x).mul(20).floor() },
            display() { return "Increase number of spread towers by one<br><b>Currenly: </b>" + format(getBuyableAmount(this.layer, this.id)) + "<br><b>Cost: </b>" + format(this.cost(getBuyableAmount(this.layer, this.id))) },
            canAfford() { return player[this.layer].points.gte(this.cost(getBuyableAmount(this.layer, this.id))) },
            buy() {
                player[this.layer].points = player[this.layer].points.sub(this.cost(getBuyableAmount(this.layer, this.id)))
                player[this.layer].boughtTowers["spread-tower"] += 1
                setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
            },
            style: {
                "width": "100px",
                "height": "100px"
            }
        },

        "blank": {
            canAfford() { return true },
            style: {
                "width": "100px",
                "height": "100px"
            }
        }

    },

    startData() {
        return {
            unlocked: true,
            points: new Decimal(10),
            running: false,
            currentTower: "none",
            enemies: [],
            towers: [],
            road: [],
            spawnDelay: 50,
            spawnWait: 0,
            enemyDelay: 50,
            currencyMultiplayer: 1,
            spawnCount: 1,
            boughtTowers: {
                "normal-tower": 1,
                "wall-tower": 1,
                "spread-tower": 1
            },
            placedTowers: {
                "normal-tower": 0,
                "wall-tower": 0,
                "spread-tower": 0
            },
            towerStats: {
                "normal-tower": {
                    attackDelay: 30,
                    range: 5,
                    damage: 1,
                    maxParticleSpeed: .1,
                    particleLifespan: 1e10
                },
                "wall-tower": {
                    attackDelay: -1,
                    range: -1,
                    damage: -1,
                    maxParticleSpeed: -1,
                    particleLifespan: -1
                },
                "spread-tower": {
                    attackDelay: 50,
                    range: 5,
                    damage: 1,
                    maxParticleSpeed: .1,
                    particleLifespan: 3,
                    angleSpeed: .1,
                    bulletCount: 4
                }
            }
        }
    },

    update(diff) {
        if (player[this.layer].road.length == 0) {
            player[this.layer].road = createRoad(this.layer, GridCols, GridRows)

            player[this.layer].road.forEach(id => setGridData(this.layer, id, {
                tower: false,
                road: true,
                enemyCount: getGridData(this.layer, id).enemyCount
            }))
        }

        player[this.layer].enemies.forEach(enemy => enemyTick(enemy))
        player[this.layer].towers.forEach(tower => towerIDs[tower.id].tick(tower))

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