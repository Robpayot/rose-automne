import { getNow } from '~utils/time'
import { toRadian } from '~utils/math'
import { inOutQuart } from '~utils/ease'
import { DEBUG, MOUSE_MOVE, SCROLL } from '~constants/index'
import touchEnabled from '~utils/touchEnabled'
import * as THREE from 'three'

class CameraController {
  constructor() {
    this.progressPosition = 0
    this.progressPositionTarget = 0

    this.progressLookIntroX = 0
    this.progressLookIntroY = 0
    this.progressLookIntroZ = 0

    this.mouse = {
      x: 0,
      y: 0,
    }
    this.rotateForceX = 3.5
    this.rotateForceY = 3.5
    this.rotateForceStep1X = 2
    this.rotateForceStep1Y = 3
    this.coefRotate = 0.035
    this.coefMove = 0.08
    this.allowRotateThreshold = 0.08
    this.targetRotateX = 180
    this.targetRotateY = 0
  }

  init(camera, scene) {
    this.camera = camera

    this.scene = scene

    this.scene.add(this.camera)

    this.camera.position.set(0, 50, 50)
    this.camera.lookAt(0, 0, 0)
    this.camera.updateProjectionMatrix()
  }

  events() {
    // if (!touchEnabled()) {
    //   window.addEventListener(MOUSE_MOVE, this.handleMouseMove)
    // }

    // window.addEventListener(SCROLL, this.handleScroll)
  }

  handleMouseMove = e => {
    const { x, y } = e.detail
    this.mouse.x = x
    this.mouse.y = y

    const forceX = this.progressPosition < this.allowRotateThreshold ? this.rotateForceStep1X : this.rotateForceX
    const forceY = this.progressPosition < this.allowRotateThreshold ? this.rotateForceStep1Y : this.rotateForceY

    this.targetRotateX = -(this.mouse.y * 1) * forceX + 180
    this.targetRotateY = this.mouse.x * forceY
  }

  render(now) {
    if (this.canMove) {
      // this.mouseMoveCamera()
    }
  }

  mouseMoveCamera() {
    if (this.camera.rotation.x !== toRadian(this.targetRotateX)) {
      this.camera.rotation.x += (toRadian(this.targetRotateX) - this.camera.rotation.x) * this.coefRotate
      // this.camera.updateProjectionMatrix()
    }
    if (this.camera.rotation.y !== toRadian(this.targetRotateY)) {
      this.camera.rotation.y += (toRadian(this.targetRotateY) - this.camera.rotation.y) * this.coefRotate
      // this.camera.updateProjectionMatrix()
    }
  }
}

export default new CameraController()
