class Enemy {
    constructor(hp, road, pos, delay, active, layer) {
        this.hp = hp
        this.roundHp = hp
        this.road = road
        this.pos = pos
        this.delay = delay
        this.active = active
        this.layer = layer

        this.waitTime = 0

        setGridData(this.layer, this.road[this.pos], {
            tower: false,
            road: true,
            enemyCount: getGridData(this.layer, this.road[this.pos]).enemyCount + this.hp
        })
        
    }
}

function enemyTick(enemy) {   
    if (enemy.active) {
        enemy.waitTime++
        if (enemy.waitTime >= enemy.delay) {
            enemy.roundHp = enemy.hp
            enemyMove(enemy)
            enemy.waitTime = 0
        }
    }
}

function enemyMove(enemy) {

    setGridData(enemy.layer, enemy.road[enemy.pos], {
        tower: false,
        road: true,
        enemyCount: getGridData(enemy.layer, enemy.road[enemy.pos]).enemyCount - enemy.hp
    })

    enemy.pos++
    
    if (enemy.pos == enemy.road.length) {
        enemy.active = false
        return
        
    }
    
    setGridData(enemy.layer, enemy.road[enemy.pos], {
        tower: false,
        road: true,
        enemyCount: getGridData(enemy.layer, enemy.road[enemy.pos]).enemyCount + enemy.hp
    })

}

function enemyDamage(enemy, damage) {
    if(enemy.hp <= damage) {
        setGridData(enemy.layer, enemy.road[enemy.pos], {
            tower: false,
            road: true,
            enemyCount: 0
        })
        enemy.active = false
        player[enemy.layer].points = player[enemy.layer].points.add(enemy.hp * player[enemy.layer].currencyMultiplayer)
    } else {
        setGridData(enemy.layer, enemy.road[enemy.pos], {
            tower: false,
            road: true,
            enemyCount: Math.max(0, getGridData(enemy.layer, enemy.road[enemy.pos]).enemyCount - damage)
        })
        enemy.hp -= damage
        player[enemy.layer].points = player[enemy.layer].points.add(damage * player[enemy.layer].currencyMultiplayer)

    }
}

/**
 * 
 * @param {Enemy} enemy 
 * @return position of enemy
 */
function enemyGetPos(enemy) {
    return decodeGridId(enemy.road[enemy.pos])
}