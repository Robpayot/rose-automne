import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import Stats from 'stats-js'
import createCustomEvent from '~utils/createCustomEvent'
import GUI from './Gui'
import { randomFloat } from '~utils/math'

import LoaderManager from '../../managers/LoaderManager'

// components

import { RAF, WINDOW_RESIZE, MOUSE_MOVE, DEBUG, SCROLL, START_SCENE } from '../../constants/index'
import fragmentShader from '../shaders/custom.frag'
import vertexShader from '../shaders/custom.vert'

export default class Scene {
  constructor(el) {
    this.canvas = el

    this.particlesGroup = []

    this.setUnits()

    this.load()
    // this.init()
  }

  load() {
    LoaderManager.load(
      [
        {
          name: 'leave1',
          texture: `img/leave-1.png`,
        },
        {
          name: 'leave2',
          texture: `img/leave-2.png`,
        },
        {
          name: 'leave3',
          texture: `img/leave-3.png`,
        },
      ],
      this.init,
    )
  }

  init = () => {
    this.buildStats()
    this.buildTextureScene()
    this.buildScene()
    this.buildRender()
    this.buildCamera()
    this.buildControls()
    for (let i = 0; i < 3; i++) {
      let texture
      switch (i) {
        case 0:
          texture = LoaderManager.subjects.leave1.texture
          break
        case 1:
          texture = LoaderManager.subjects.leave2.texture
          break
        case 2:
          texture = LoaderManager.subjects.leave3.texture
          break
      }
      this.buildParticles(texture)
    }
    this.buildText()
    this.buildLight()

    this.initGUI()

    // start RAF
    window.dispatchEvent(createCustomEvent(START_SCENE))
    this.events()
  }

  initGUI() {
    // gui
    this.guiController = {
      rose: 0xd096d6,
    }

    GUI.addColor(this.guiController, 'rose').onChange(this.guiChange)
  }

  guiChange = () => {

    this.uniforms.color1.value.setHex(this.guiController.rose)
  }

  events() {
    window.addEventListener(WINDOW_RESIZE, this.handleResize, { passive: true })
    window.addEventListener(RAF, this.render, { passive: true })
    // window.addEventListener('mousemove', this.handleMouseMove)
    // window.addEventListener('scroll', this.handleScroll)
  }

  buildStats() {
    this.stats = new Stats()
    this.stats.showPanel(0)
    document.body.appendChild(this.stats.dom)
  }

  buildScene() {
    this.scene = new THREE.Scene()

    this.scene.background = this.renderTarget.texture
  }

  buildRender() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      autoClearColor: false,
    })

    this.setSizes()
  }

  buildCamera() {
    const aspectRatio = this.width / this.height
    const fieldOfView = 30
    const nearPlane = 1
    const farPlane = 10000

    this.camera = new THREE.PerspectiveCamera(fieldOfView, aspectRatio, nearPlane, farPlane)
    this.camera.updateProjectionMatrix()
    this.camera.position.y = 0
    this.camera.position.z = 500
    this.camera.lookAt(0, 0, 0)

    this.scene.add(this.camera)

    // scene.add( camera );
    // CameraController.init(this.camera, this.scene)
  }

  buildControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    // this.controls.autoRotate = true
    this.controls.enableDamping = true
  }

  buildTextureScene() {
    //Create the texture that will store our result
    this.renderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight)

    this.rtScene = new THREE.Scene()

    this.uniforms = {
      color1: { value: new THREE.Color(0xd096d6) }, // pink  0xfa35df
      color2: { value: new THREE.Color(0xf47b20) }, // orange
      time: { value: 1.0 },
    }
    const ratio = window.innerWidth / window.innerHeight
    const height = 19
    const geometry = new THREE.PlaneBufferGeometry(height * ratio, height, 32)
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: this.uniforms,
    })
    const plane = new THREE.Mesh(geometry, material)

    const aspectRatio = this.width / this.height
    const fieldOfView = 10
    const nearPlane = 1
    const farPlane = 10000

    this.rtCamera = new THREE.PerspectiveCamera(fieldOfView, aspectRatio, nearPlane, farPlane)
    this.rtCamera.updateProjectionMatrix()
    this.rtCamera.position.y = 0
    this.rtCamera.position.z = 100
    this.rtCamera.lookAt(0, 0, 0)

    this.rtScene.add(this.rtCamera)
    this.rtScene.add(plane)
  }

  buildParticles(texture) {
    // return
    this.nbParticles = 100
    this.range = 350

    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 60,
      depthWrite: false,
      depthTest: true,
      sizeAttenuation: true,
      transparent: true,
      // blending: THREE.AdditiveBlending,
      opacity: 1,
    })

    // texture.rotation = 0;

    material.map = texture
    // material.color.setHex(this.guiController.particles_color_bkg)

    const geometry = new THREE.Geometry()
    const { range } = this

    for (let i = 0; i < this.nbParticles; i++) {
      const particle = new THREE.Vector3(
        randomFloat(-range, range),
        randomFloat(-range, range),
        randomFloat(-range, range),
      )
      particle.speed = randomFloat(0.2, 0.6)
      particle.velocityStep = randomFloat(0.00006, 0.00018)
      particle.velocity = 0
      particle.offsetX = randomFloat(100, 600)
      geometry.vertices.push(particle)
    }

    const particles = new THREE.Points(geometry, material)
    this.scene.add(particles)

    this.particlesGroup.push(particles)
  }

  buildText() {
    const loader = new THREE.FontLoader()

    loader.load('img/parisienne.json', font => {
      let geometry = new THREE.TextGeometry('Rose & Automne', {
        font,
        size: 80,
        height: 1,
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 3,
        bevelSize: 1,
        bevelOffset: 0,
        bevelSegments: 2,
      })

      geometry = new THREE.BufferGeometry().fromGeometry(geometry)
      geometry.center()

      const material = new THREE.MeshBasicMaterial({ color: 0xffffff })
      // material.map = this.renderTarget.texture

      const mesh = new THREE.Mesh(geometry, material)

      mesh.position.y = 0
      mesh.position.z = 0

      mesh.rotation.x = 0
      mesh.rotation.y = Math.PI * 2

      const scaleCoef = 0.3

      mesh.scale.set(scaleCoef, scaleCoef, scaleCoef)

      this.scene.add(mesh)
    })
  }

  buildLight() {
    // const light = new THREE.AmbientLight( 0xffffff ); // soft white light
    // this.scene.add( light );
    // const pointlight = new THREE.PointLight( 0xffffff, 1, 100 );
    // pointlight.position.set( 10, 10, 10 );
    // this.scene.add(pointlight)
    // const pointlight2 = new THREE.PointLight( 0xffffff, 1, 100 );
    // pointlight2.position.set( 10, 10, -10 );
    // this.scene.add(pointlight2)
    // const light2 = new THREE.PointLight( 0xfa35df, 1, 100 );
    // light2.position.set( 10, 5, 5 );
    // this.scene.add(light2)
  }

  // RAF
  render = e => {
    const { now } = e.detail

    this.stats.begin()

    if (this.controls) this.controls.update() // for damping
    // draw render target scene to render target
    this.renderer.setRenderTarget(this.renderTarget)
    this.renderer.render(this.rtScene, this.rtCamera)
    this.renderer.setRenderTarget(null)

    for (let y = 0; y < this.particlesGroup.length; y++) {
      const { geometry } = this.particlesGroup[y]

      for (let i = 0; i < geometry.vertices.length; i++) {
        const particle = geometry.vertices[i]
        particle.velocity += particle.velocityStep
        particle.y -= particle.speed + particle.velocity
        particle.velocityX = Math.sin(now / 500 + particle.offsetX)
        particle.x += particle.velocityX / 8
        if (particle.y < -this.range) {
          particle.y = this.range
          particle.velocity = 0
        }
        if (particle.x > this.range) {
          particle.x = -this.range
          particle.velocity = 0
        }
      }
      geometry.verticesNeedUpdate = true
    }

    this.renderer.render(this.scene, this.camera)

    this.uniforms.time.value = now / 1000

    this.stats.end()
  }

  // EVENTS
  handleResize = () => {
    this.setUnits()

    // Update camera
    this.camera.aspect = this.width / this.height
    this.camera.updateProjectionMatrix()

    this.setSizes()
  }

  setSizes() {
    const DPR = window.devicePixelRatio ? window.devicePixelRatio : 1
    // if (DPR > 1 && window.innerWidth > 1680) {
    //   this.renderer.setPixelRatio(1.5)
    // } else {
    //   this.renderer.setPixelRatio(DPR)
    // }
    this.renderer.setPixelRatio(1)
    this.renderer.setSize(this.width, this.height)
  }

  setUnits() {
    this.width = window.innerWidth
    this.height = window.innerHeight
  }
}
