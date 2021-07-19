//File containing all tower related stuff

//particle used as model for towers' bullets
const towerParticle = {
    //if layer would be used istead of _layer, the particle would be deleted when switching tabs. We don't want that
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

            // == if target is offgrid(non reachable)
            if (!this.target.active) {
                //due to every tower function requesting tower I had to make dummy tower
                this.target = towerTarget({ range: this.towerRange, col: this.towerCol, row: this.towerRow }, player[this._layer].enemies)
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
            } else if (dist < player[this._layer].maxParticleSpeed) {
                this.speed = Math.max(.01, dist / 2)
            } else {
                this.speed = player[this._layer].maxParticleSpeed
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

//called every tick for every tower
function towerTick(tower) {
    tower.waitTime++
    if (tower.waitTime >= tower.attackDelay) {
        tower.waitTime = 0
        tower.target = towerTarget(tower, player[tower.layer].enemies)
        towerAttack(tower)
    }
}

//called when tower is attacting
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

//finds a target in range of tower
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