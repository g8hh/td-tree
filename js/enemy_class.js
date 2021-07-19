// File containing all Enemy related classes and functions

//Enemy class
class Enemy {
    //with constructing also spawn enemy on the path
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

//function called every tick for every enemy
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

//moves enemy on the road
function enemyMove(enemy) {

    //delete enemy form current position
    setGridData(enemy.layer, enemy.road[enemy.pos], {
        tower: false,
        road: true,
        enemyCount: getGridData(enemy.layer, enemy.road[enemy.pos]).enemyCount - enemy.hp
    })

    //increase position and deactivate enemy if on the end of the road
    enemy.pos++
    
    if (enemy.pos == enemy.road.length) {
        enemy.active = false
        return
        
    }
    
    //add enemy to next position
    setGridData(enemy.layer, enemy.road[enemy.pos], {
        tower: false,
        road: true,
        enemyCount: getGridData(enemy.layer, enemy.road[enemy.pos]).enemyCount + enemy.hp
    })

}

//called when enemy is damaged
function enemyDamage(enemy, damage) {
    setGridData(enemy.layer, enemy.road[enemy.pos], {
        tower: false,
        road: true,
        enemyCount: Math.max(0, getGridData(enemy.layer, enemy.road[enemy.pos]).enemyCount - damage)
    })

    if(enemy.hp <= damage) {
        enemy.active = false
    } else {
        enemy.hp -= damage    
    }

    player[enemy.layer].points = player[enemy.layer].points.add(damage * player[enemy.layer].currencyMultiplayer)
}

//returns enemy position as Object{row, col}
function enemyGetPos(enemy) {
    return decodeGridId(enemy.road[enemy.pos])
}