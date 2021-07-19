const towerParticle = {
    _layer: undefined,
    damage: 0,
    x: 0,
    y: 0,
    gridX: 0,
    gridY: 0,
    time: 1e10,
    target: undefined,
    towerRange: 0,
    towerCol: 0,
    towerRow: 0,
    speed: 10,
    update() {
        if (this.target !== undefined) {

            if (!this.target.active) {
                this.target = towerTarget({ range: this.towerRange, col: this.towerCol, row: this.towerRow }, player[this._layer].enemies)
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

            dist = Math.hypot(e.col - this.gridX, e.row - this.gridY)

            if (dist < .1) {
                enemyDamage(this.target, this.damage)
                Vue.delete(particles, this.id)
                return
            } else if (dist < player[this._layer].maxParticleSpeed) {
                this.speed = Math.max(.01, dist / 2)
            } else {
                this.speed = player[this._layer].maxParticleSpeed
            }

            this.gridX += ((e.col - this.gridX) / dist) * this.speed
            this.gridY += ((e.row - this.gridY) / dist) * this.speed

            if (div !== null) {
                this.x = boundingRect.left + ((boundingRect.right - boundingRect.left) * ((this.gridX - 0.5) / GridCols))
                this.y = boundingRect.top + ((boundingRect.bottom - boundingRect.top) * ((this.gridY - 0.5) / GridRows))
            }
        }

        if (this._layer !== player.tab) {
            this.width = this.height = 0
        } else {
            this.width = this.height = 35
        }


    }
}

class Tower {
    /**
     * 
     * @param {Number} attackDelay
     * @param {Number} range 
     * @param {Particle} particle 
     * @param {Number} row 
     * @param {Number} col 
     * @param {String} layer 
     */
    constructor(attackDelay, damage, range, particle, row, col, layer) {
        this.attackDelay = attackDelay
        this.range = range
        this.particle = particle
        this.row = row
        this.col = col
        this.layer = layer
        this.damage = damage

        this.waitTime = 0
        this.target = undefined
        this.particle._layer = this.layer
    }
}

/**
 * 
 * @param {Tower} tower 
 */
function towerTick(tower) {
    tower.waitTime++
    if (tower.waitTime >= tower.attackDelay) {
        tower.waitTime = 0
        tower.target = towerTarget(tower, player[tower.layer].enemies)
        towerAttack(tower)
    }
}

/**
 * 
 * @param {Tower} tower 
 */
function towerAttack(tower) {
    if (tower.target !== undefined) {
        tower.particle.target = tower.target
        tower.particle.gridX = tower.col
        tower.particle.gridY = tower.row
        tower.particle.damage = tower.damage = player[tower.layer].towerDamage
        tower.particle.update = towerParticle.update
        tower.particle.towerRange = tower.range
        tower.particle.towerCol = tower.col
        tower.particle.towerRow = tower.row
        makeParticles(tower.particle, 1)
    }
}

/**
 * 
 * @param {Tower} tower 
 * @param {Enemy[]} enemies 
 */
function towerTarget(tower, enemies) {
    for (var i = 0; i < enemies.length; i++) {
        var a = enemyGetPos(enemies[i])
        if (a === undefined) {
            continue
        }
        var dist = Math.hypot(a.col - tower.col, a.row - tower.row)
        if (dist < tower.range) {
            return enemies[i]
        }
    }
    return undefined
}