var towerTemplate = {
    id: "",
    layer: "",

    row: -1,
    col: -1,

    waitTime: 0,
    target: undefined,
}

function createTower(id, layer, row, col) {
    var tower = Object.assign({}, towerTemplate)
    tower.id = id
    tower.layer = layer
    tower.row = row
    tower.col = col
    return tower
}

var normalTower = {

    //called every tick for every tower
    tick(tower) {
        tower.waitTime++
        if (tower.waitTime >= player[tower.layer].towerStats[tower.id].attackDelay) {
            tower.waitTime = 0
            tower.target = towerIDs[tower.id].target(tower, player[tower.layer].enemies)
            towerIDs[tower.id].attack(tower, towerIDs[tower.id].particle)
        }
    },

    //called when tower is attacting
    attack(tower, particle) {
        if (tower.target !== undefined) {
            particle._layer = tower.layer
            particle.target = tower.target
            particle.gridX = tower.col
            particle.gridY = tower.row
            particle.damage = player[tower.layer].towerStats[tower.id].damage
            particle.towerRange = player[tower.layer].towerStats[tower.id].range
            particle.towerCol = tower.col
            particle.towerRow = tower.row
            particle.towerID = tower.id
            makeParticles(particle, 1)
        }
    },

    //finds a target in range of tower
    target(tower, enemies) {
        for (var i = 0; i < enemies.length; i++) {
            var a = enemyGetPos(enemies[i])
            if (a === undefined) {
                continue
            }
            var dist = Math.hypot(a.col - tower.col, a.row - tower.row)
            if (dist < player[tower.layer].towerStats[tower.id].range) {
                return enemies[i]
            }
        }
        return undefined
    },

    //particle used as model for towers' bullets
    particle: {
        //if layer would be used istead of _layer, the particle would be deleted when switching tabs. We don't want that
        _layer: undefined,
        damage: 0,
        x: 0,
        y: 0,
        gridX: 0,
        gridY: 0,
        time: 1e10,
        target: undefined,
        towerID: "",
        towerCol: 0,
        towerRow: 0,
        speed: 10,
        update() {
            if (this.target !== undefined) {

                // == if target is offgrid(non reachable)
                if (!this.target.active) {
                    //due to every tower function requesting tower I had to make dummy tower
                    this.target = towerIDs[this.towerID].target({ layer: this._layer, id: this.towerID, col: this.towerCol, row: this.towerRow }, player[this._layer].enemies)
                    // == if no arget if found, delete particle
                    if (this.target === undefined) {
                        Vue.delete(particles, this.id)
                        return
                    }
                }

                var div = document.getElementById("grid-div")
                if (div !== null) {
                    var boundingRect = div.getBoundingClientRect()
                }

                var e = enemyGetPos(this.target)
                if (e === undefined) {
                    return
                }

                var dist = Math.hypot(e.col - this.gridX, e.row - this.gridY)

                //detecting "collision" and speed limiting wen close
                if (dist < .1) {
                    enemyDamage(this.target, this.damage)
                    Vue.delete(particles, this.id)
                    return
                } else if (dist < player[this._layer].towerStats[this.towerID].maxParticleSpeed) {
                    this.speed = Math.max(.01, dist / 2)
                } else {
                    this.speed = player[this._layer].towerStats[this.towerID].maxParticleSpeed
                }

                //moving particle
                this.gridX += ((e.col - this.gridX) / dist) * this.speed
                this.gridY += ((e.row - this.gridY) / dist) * this.speed

                //calculate position on a display
                if (div !== null) {
                    this.x = boundingRect.left + ((boundingRect.right - boundingRect.left) * ((this.gridX - 0.5) / GridCols))
                    this.y = boundingRect.top + ((boundingRect.bottom - boundingRect.top) * ((this.gridY - 0.5) / GridRows))
                }
            }

            //making the particle "invisible" when in diffrent tab
            if (this._layer !== player.tab || player.subtabs[this._layer].mainTabs !== "Main tab") {
                this.width = this.height = 0
            } else {
                this.width = this.height = 35
            }
        }
    }
}

var wallTower = {
    tick(tower) { },
    attack(tower, particle) { },
    target(tower, enemies) { },
    particle: {}
}

var spreadTower = {
    tick(tower) {
        tower.waitTime++
        if (tower.waitTime >= player[tower.layer].towerStats[tower.id].attackDelay) {
            tower.waitTime = 0
            tower.target = towerIDs[tower.id].target(tower, player[tower.layer].enemies)
            towerIDs[tower.id].attack(tower, towerIDs[tower.id].particle)
        }
    },

    attack(tower, particle) {
        if (tower.target !== undefined) {
            particle._layer = tower.layer
            particle.target = tower.target
            particle.gridX = tower.col
            particle.gridY = tower.row
            particle.damage = player[tower.layer].towerStats[tower.id].damage
            particle.towerRange = player[tower.layer].towerStats[tower.id].range
            particle.towerCol = tower.col
            particle.towerRow = tower.row
            particle.towerID = tower.id
            particle.time = player[tower.layer].towerStats[tower.id].particleLifespan
            for (var i = 0; i < 2 * Math.PI; i += (2 * Math.PI) / player[tower.layer].towerStats[tower.id].bulletCount) {
                particle.angle = i;
                makeParticles(particle, 1)
            }
        }
    },

    target(tower, enemies) {
        var best = {enemy: undefined, dist: Number.MAX_SAFE_INTEGER}
        for (var i = 0; i < enemies.length; i++) {
            var a = enemyGetPos(enemies[i])
            if (a === undefined) {
                continue
            }
            var dist = Math.hypot(a.col - tower.col, a.row - tower.row)
            if (dist < player[tower.layer].towerStats[tower.id].range && dist < best.dist) {
                best = {enemy: enemies[i], dist: dist}
            }
        }
        return best.enemy
    },

    particle: {
        _layer: undefined,
        damage: 0,
        x: 0,
        y: 0,
        gridX: 0,
        gridY: 0,
        time: 10,
        target: undefined,
        towerID: "",
        towerCol: 0,
        towerRow: 0,
        speed: 10,
        angle: 0,
        update() {
            if (this.target !== undefined) {

                if (!this.target.active) {
                    this.target = towerIDs[this.towerID].target({ layer: this._layer, id: this.towerID, col: this.towerCol, row: this.towerRow }, player[this._layer].enemies)
                    if (this.target === undefined) {
                        Vue.delete(particles, this.id)
                        return
                    }
                }

                var div = document.getElementById("grid-div")
                if (div !== null) {
                    var boundingRect = div.getBoundingClientRect()
                }

                var e = enemyGetPos(this.target)
                if (e === undefined) {
                    return
                }

                var dist = Math.hypot(e.col - this.gridX, e.row - this.gridY)

                if (dist < .1) {
                    enemyDamage(this.target, this.damage)
                    Vue.delete(particles, this.id)
                    return
                } else if (dist < player[this._layer].towerStats[this.towerID].maxParticleSpeed) {
                    this.speed = Math.max(.01, dist / 2)
                } else {
                    this.speed = player[this._layer].towerStats[this.towerID].maxParticleSpeed
                }

                var enemyAngle = Math.atan2(this.gridY - e.row, this.gridX - e.col)
                if (enemyAngle !== this.angle) {
                    this.angle += Math.sign(Math.atan2(Math.sin(enemyAngle - this.angle), Math.cos(enemyAngle - this.angle))) * player[this._layer].towerStats[this.towerID].angleSpeed
                }

                // this.angle = enemyAngle

                if (this.angle < 0) this.angle += 2 * Math.PI
                if (this.angle > 2 * Math.PI) this.angle -= 2 * Math.PI

                this.gridX += -Math.cos(this.angle) * this.speed
                this.gridY += -Math.sin(this.angle) * this.speed

                if (div !== null) {
                    this.x = boundingRect.left + ((boundingRect.right - boundingRect.left) * ((this.gridX - 0.5) / GridCols))
                    this.y = boundingRect.top + ((boundingRect.bottom - boundingRect.top) * ((this.gridY - 0.5) / GridRows))
                }
            }

            if (this._layer !== player.tab || player.subtabs[this._layer].mainTabs !== "Main tab") {
                this.width = this.height = 0
            } else {
                this.width = this.height = 35
            }
        }
    }
}