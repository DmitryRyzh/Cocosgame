var HelloWorldScene = cc.Scene.extend({
    onEnter: function () {
        this._super();
        var layer = new HelloWorldLayer();
        this.addChild(layer);
    }
});

var HelloWorldLayer = cc.Layer.extend({
    selectedSprite: null,
    sprites: [],
    grid: [],
    cellSize: 0,
    gap: 15,
    startX: 0,
    startY: 0,
    currentPlayer: 'player',
    gameInProgress: true,

    ctor: function () {
        this._super();
        this.grid = [
            [null, null, null],
            [null, null, null],
            [null, null, null]
        ];

        var background = new cc.Sprite("res/background.png");
        background.attr({
            x: cc.winSize.width / 2,
            y: cc.winSize.height / 2
        });
        this.addChild(background);

        this.initSprites();
        this.initGrid();

        cc.audioEngine.playMusic("res/background_music.mp3", true);

        cc.eventManager.addListener({
            event: cc.EventListener.MOUSE,
            onMouseDown: this.processMouseDown.bind(this)
        }, this);

        return true;
    },

    initSprites: function () {
        
        this.createSprite("res/circle.png", cc.winSize.width / 2 - 145, cc.winSize.height / 2 + 270, 1, 'red');
        this.createSprite("res/circle.png", cc.winSize.width / 2 - 145, cc.winSize.height / 2 + 270, 1, 'red');
        this.createSprite("res/cross.png", cc.winSize.width / 2 - 0, cc.winSize.height / 2 + 270, 2, 'red');
        this.createSprite("res/cross.png", cc.winSize.width / 2 - 0, cc.winSize.height / 2 + 270, 2, 'red');
        this.createSprite("res/triangle.png", cc.winSize.width / 2 + 145, cc.winSize.height / 2 + 270, 3, 'red');
        this.createSprite("res/triangle.png", cc.winSize.width / 2 + 145, cc.winSize.height / 2 + 270, 3, 'red');

        this.createSprite("res/blue_circle.png", cc.winSize.width / 2 - 145, cc.winSize.height / 2 - 270, 1, 'blue');
        this.createSprite("res/blue_circle.png", cc.winSize.width / 2 - 145, cc.winSize.height / 2 - 270, 1, 'blue');
        this.createSprite("res/blue_cross.png", cc.winSize.width / 2 + 0, cc.winSize.height / 2 - 270, 2, 'blue');
        this.createSprite("res/blue_cross.png", cc.winSize.width / 2 + 0, cc.winSize.height / 2 - 270, 2, 'blue');
        this.createSprite("res/blue_triangle.png", cc.winSize.width / 2 + 145, cc.winSize.height / 2 - 270, 3, 'blue');
        this.createSprite("res/blue_triangle.png", cc.winSize.width / 2 + 145, cc.winSize.height / 2 - 270, 3, 'blue');
    },

    createSprite: function (img, x, y, value, team) {
        var sprite = new cc.Sprite(img);
        sprite.attr({
            x: x,
            y: y,
            value: value,
            team: team
        });
        this.addChild(sprite);
        this.sprites.push(sprite);
    },

    initGrid: function () {
      
        var gridWidth = cc.winSize.width - this.gap * 38;
        var gridHeight = cc.winSize.height - this.gap * 4;
        this.cellSize = Math.min(gridWidth, gridHeight) / 3;

        this.startX = (cc.winSize.width - (this.cellSize * 3 + this.gap * 2)) / 2;
        this.startY = (cc.winSize.height - (this.cellSize * 3 + this.gap * 2)) / 2;

        for (var i = 0; i < 3; i++) {
            for (var j = 0; j < 3; j++) {
                var cell = new cc.Sprite("res/cell.png");
                cell.attr({
                    x: this.startX + i * (this.cellSize + this.gap) + this.cellSize / 2,
                    y: this.startY + j * (this.cellSize + this.gap) + this.cellSize / 2
                });
                this.addChild(cell);
                this.grid[j][i] = null;
            }
        }
    },

    processMouseDown: function (event) {
        if (!this.gameInProgress) return;
    
        var location = event.getLocation();
        cc.audioEngine.playEffect("res/click.mp3");
    
        if (this.currentPlayer === 'player') {
            if (this.selectedSprite) {
                var x = Math.floor((location.x - this.startX) / (this.cellSize + this.gap));
                var y = Math.floor((location.y - this.startY) / (this.cellSize + this.gap));
    
                if (x >= 0 && x < 3 && y >= 0 && y < 3) {
                    if (!this.grid[y][x] || this.grid[y][x].value < this.selectedSprite.value) {
                      
                        this.animateCoverSprite(x, y, this.selectedSprite);
    
                      
                        this.grid[y][x] = { team: this.selectedSprite.team, value: this.selectedSprite.value };
    
                       
                        var moveAction = cc.moveTo(0.5, cc.p(this.startX + x * (this.cellSize + this.gap) + this.cellSize / 2, this.startY + y * (this.cellSize + this.gap) + this.cellSize / 2)).easing(cc.easeInOut(2));
                        this.selectedSprite.runAction(moveAction);
    
                        this.selectedSprite.isLocked = true;
                        this.selectedSprite.setColor(cc.color(255, 255, 255)); 
                        this.checkForWin(this.selectedSprite);
                        this.checkForDraw();
                        cc.audioEngine.playEffect("res/correct.mp3");
                        this.selectedSprite = null;
                        this.currentPlayer = 'ai'; 
                        this.scheduleOnce(this.aiMove.bind(this), 1); 
                    } else {
                        this.selectedSprite.setColor(cc.color(255, 255, 255)); 
                        this.selectedSprite = null;
                        cc.audioEngine.playEffect("res/wrong.mp3");
                    }
                }
            } else {

                for (var i = 0; i < this.sprites.length; i++) {
                    if (cc.rectContainsPoint(this.sprites[i].getBoundingBox(), location) && !this.sprites[i].isLocked && this.sprites[i].team === 'blue') {
                        this.selectedSprite = this.sprites[i];
                        this.selectedSprite.setColor(cc.color(255, 255, 0)); 
                        break;
                    }
                }
            }
        }
    },

    checkForWin: function (sprite) {
        var team = sprite.team;
        for (var i = 0; i < 3; i++) {
            if (this.grid[i][0] && this.grid[i][0].team === team &&
                this.grid[i][1] && this.grid[i][1].team === team &&
                this.grid[i][2] && this.grid[i][2].team === team) {
                this.showWinMessage(team === 'blue' ? "Ты выиграл" : "Ты проиграл", team);
                return;
            }
        }
        for (var i = 0; i < 3; i++) {
            if (this.grid[0][i] && this.grid[0][i].team === team &&
                this.grid[1][i] && this.grid[1][i].team === team &&
                this.grid[2][i] && this.grid[2][i].team === team) {
                this.showWinMessage(team === 'blue' ? "Ты выиграл" : "Ты проиграл", team);
                return;
            }
        }
        if ((this.grid[0][0] && this.grid[0][0].team === team && this.grid[1][1] && this.grid[1][1].team === team && this.grid[2][2] && this.grid[2][2].team === team) ||
            (this.grid[0][2] && this.grid[0][2].team === team && this.grid[1][1] && this.grid[1][1].team === team && this.grid[2][0] && this.grid[2][0].team ===
                team)) {
                    this.showWinMessage(team === 'blue' ? "Ты выиграл" : "Ты проиграл", team);
                }
            },
        
            showWinMessage: function (message, winningTeam) {
                this.gameInProgress = false;
                var size = cc.winSize;
                var winLayer = new cc.LayerColor(cc.color(0, 0, 0, 180), size.width, size.height);
                var label = new cc.LabelTTF(message, "Arial", 38);
                label.attr({
                    x: size.width / 2,
                    y: size.height / 2
                });
                winLayer.addChild(label);
                this.addChild(winLayer);
                cc.audioEngine.playEffect(winningTeam === 'blue' ? "res/victory.mp3" : "res/lose_sound.mp3");
        
               
                this.scheduleOnce(this.restartGame, 3);
            },
        
            restartGame: function () {
                cc.director.runScene(new HelloWorldScene());
            },
        
            aiMove: function () {
                if (!this.gameInProgress) return;
            
                var bestMove = this.findBestMove();
                if (bestMove) {
                    var aiSprite = this.getAISprite(bestMove);
                    if (aiSprite) {
                       
                        this.animateCoverSprite(bestMove.x, bestMove.y, aiSprite);
            
                      
                        var moveAction = cc.moveTo(0.5, cc.p(this.startX + bestMove.x * (this.cellSize + this.gap) + this.cellSize / 2, this.startY + bestMove.y * (this.cellSize + this.gap) + this.cellSize / 2)).easing(cc.easeInOut(2));
                        aiSprite.runAction(moveAction);
                        this.grid[bestMove.y][bestMove.x] = { team: 'red', value: aiSprite.value };
                        aiSprite.isLocked = true;
                        this.checkForWin(aiSprite);
                        this.checkForDraw();
                        this.currentPlayer = 'player';
                        cc.audioEngine.playEffect("res/enemy_correct.mp3");
                    }
                }
            },
        
            findBestMove: function () {
                for (var y = 0; y < 3; y++) {
                    for (var x = 0; x < 3; x++) {
                        if (!this.grid[y][x] || (this.grid[y][x].team !== 'red' && this.grid[y][x].value < 3)) {
                            return { x: x, y: y };
                        }
                    }
                }
                return null;
            },
        
            getAISprite: function (bestMove) {
                for (var i = 0; i < this.sprites.length; i++) {
                    if (this.sprites[i].team === 'red' && !this.sprites[i].isLocked) {
                        if (!this.grid[bestMove.y][bestMove.x] || this.grid[bestMove.y][bestMove.x].value < this.sprites[i].value) {
                            return this.sprites[i];
                        }
                    }
                }
                return null;
            },
        
            checkForDraw: function () {
                var isDraw = true;
                for (var i = 0; i < 3; i++) {
                    for (var j = 0; j < 3; j++) {
                        if (!this.grid[i][j]) {
                            isDraw = false;
                            break;
                        }
                    }
                }
                if (isDraw) {
                    this.showDrawMessage();
                }
            },
        
            showDrawMessage: function () {
                this.gameInProgress = false;
                var size = cc.winSize;
                var drawLayer = new cc.LayerColor(cc.color(0, 0, 0, 180), size.width, size.height);
                var label = new cc.LabelTTF("Ничья", "Arial", 38);
                label.attr({
                    x: size.width / 2,
                    y: size.height / 2
                });
                drawLayer.addChild(label);
                this.addChild(drawLayer);
        
              
                this.scheduleOnce(this.restartGame, 3);
            },
        
            removeCoveredSprite: function (x, y) {
                var targetX = this.startX + x * (this.cellSize + this.gap) + this.cellSize / 2;
                var targetY = this.startY + y * (this.cellSize + this.gap) + this.cellSize / 2;
                
                for (var i = 0; i < this.sprites.length; i++) {
                    var sprite = this.sprites[i];
                    if (Math.abs(sprite.x - targetX) < 1 && Math.abs(sprite.y - targetY) < 1) {
                        var fadeOutAction = cc.fadeOut(0.5);
                        sprite.runAction(fadeOutAction);
                        this.sprites.splice(i, 1);
                        break;
                    }
                }
            },
        
            animateCoverSprite: function (x, y, newSprite) {
                var targetX = this.startX + x * (this.cellSize + this.gap) + this.cellSize / 2;
                var targetY = this.startY + y * (this.cellSize + this.gap) + this.cellSize / 2;
                
                for (var i = 0; i < this.sprites.length; i++) {
                    var sprite = this.sprites[i];
                    if (Math.abs(sprite.x - targetX) < 1 && Math.abs(sprite.y - targetY) < 1) {
                        var fadeOutAction = cc.fadeOut(0.5);
                        sprite.runAction(fadeOutAction);
                        this.sprites.splice(i, 1);
                        break;
                    }
                }
            }
        });
        
        cc.game.onStart = function () {
            cc.LoaderScene.preload([
                "res/click.mp3", "res/victory.mp3", "res/lose_sound.mp3", "res/background_music.mp3",
                "res/background.png", "res/circle.png", "res/cross.png", "res/triangle.png",
                "res/blue_circle.png", "res/blue_cross.png", "res/blue_triangle.png", "res/cell.png"
            ], function () {
                cc.director.runScene(new HelloWorldScene());
            }, this);
        };
        
        cc.game.run("gameCanvas");
        