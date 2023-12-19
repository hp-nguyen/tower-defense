const Emitter = require("EventEmitter");
const Key = require("Key");

const { TOWER_1_DATA, TOWER_2_DATA } = require("TowersData");
cc.Class({
  extends: cc.Component,

  properties: {
    damage: 0,
    reloadTime: 0,
    attackRange: 0,
    rotationSpeed: 2000,
    price: 0,
    upgradePrice: 0,
    bulletPrefab: cc.Prefab,
    bulletPosition: cc.Node,

    shootingSound: {
      type: cc.AudioClip,
      default: null,
    },
  },
  onLoad() {
    cc.director.getCollisionManager().enabledDebugDraw = true;
    this.timer = 0;
    this.currentEnemy = null;
  },
  update(dt) {
    if (!this.currentEnemy) return;
    this.timer += dt;
    if (this.timer >= this.reloadTime) {
      this.shoot();
      this.timer = 0;
    }
  },
  init(coordinates, type) {
    this.coordinates = coordinates;
    this.level = 1;
    this.maxLevel = 5;
    this.targets = [];
    this.type = type;
    this.towerData = this.type === "Tower1" ? TOWER_1_DATA : TOWER_2_DATA;
    this.configTower();
  },
  configTower() {
    const curLevelData = this.towerData[this.level - 1];
    this.damage = curLevelData.damage;
    this.reloadTime = curLevelData.reloadTime;
    this.price = curLevelData.price;
    this.attackRange = curLevelData.attackRange;
    this.upgradePrice = curLevelData.upgradePrice;
  },
  upgradeTower() {
    if (this.level < this.maxLevel) return;
    this.level++;
    this.configTower();
  },
  onCollisionEnter(other, self) {
    if (other.node.name === "enemy") {
      this.targets.push(other.node);
      this.currentEnemy = this.getTarget();
    }
  },
  onCollisionStay(other, self) {
    if (other.node.name === "enemy") {
      this.lookAtEnemy(this.currentEnemy);
    }
  },
  onCollisionExit(other, self) {
    this.removeTarget(other.node);
    this.currentEnemy = this.getTarget();
  },
  removeTarget(node) {
    this.targets = this.targets.filter((target) => target !== node);
  },
  getTarget() {
    return this.targets[0];
  },

  shoot() {
    if (!this.currentEnemy) return;
    const bulletNode = cc.instantiate(this.bulletPrefab);
    const bulletPositionRelativeToTowers = this.node.convertToWorldSpaceAR(
      this.bulletPosition.position
    );
    const bulletPositionInTowers = this.node.parent.convertToNodeSpaceAR(
      bulletPositionRelativeToTowers
    );

    bulletNode.position = cc.v2(
      bulletPositionInTowers.x,
      bulletPositionInTowers.y
    );
    bulletNode.angle = this.node.angle;
    this.node.parent.addChild(bulletNode);
    bulletNode.getComponent("Bullet").setVelocity();

    Emitter.instance.emit(Key.PLAY_SFX, this.shootingSound);
  },

  lookAtEnemy(targetNode) {
    const targetPosition = cc.v2(targetNode.x, targetNode.y);
    const towerPosition = cc.v2(this.node.x, this.node.y);
    const direction = targetPosition.sub(towerPosition);
    const radianAngle = Math.atan2(direction.y, direction.x);
    const angle = cc.misc.radiansToDegrees(radianAngle) - 90;
    this.node.angle = angle;
  },
});
