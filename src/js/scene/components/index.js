import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import Stats from 'stats-js'
import createCustomEvent from '~utils/createCustomEvent'
import GUI from './Gui'

import LoaderManager from '../../managers/LoaderManager'

// components
import CameraController from './CameraController/index'

import { RAF, WINDOW_RESIZE, MOUSE_MOVE, DEBUG, SCROLL, START_SCENE } from '../../constants/index'
import fragmentShader from '../shaders/custom.frag'
import vertexShader from '../shaders/custom.vert'

const ASSETS = 'img/assets-scene/'

export default class Scene {
  constructor(el) {
    this.canvas = el

    this.setUnits()

    this.load()
    // this.init()
  }

  load() {
    LoaderManager.load(
      [
        {
          name: 'image',
          texture: `img/social.png`,
        },
      ],
      this.init,
    )
  }

  init = () => {
    this.buildStats()
    this.buildScene()
    this.buildTextureScene()
    this.buildRender()
    this.buildCamera()
    this.buildControls()

    this.buildCube()

    this.initGUI()

    // start RAF
    window.dispatchEvent(createCustomEvent(START_SCENE))
    this.events()
  }

  initGUI() {
    // gui
    this.guiController = {
      amplitude: 0.1,
    }

    GUI.add(this.guiController, 'amplitude', 0.01, 1.0).onChange(this.guiChange)
  }

  guiChange = () => {}

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

    this.scene.background = new THREE.Color(0xffffff)
  }

  buildTextureScene() {
    //Create the texture that will store our result
    this.renderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight)

    this.rtScene = new THREE.Scene()
    this.rtScene.background = new THREE.Color('red')

    this.uniforms = {
      color1: { value: new THREE.Color(0xfa35df) },
      color2: { value: new THREE.Color(0xf47b20) },
      time: { value: 1.0 },
    }
    const geometry = new THREE.PlaneBufferGeometry(window.innerWidth, window.innerHeight, 32)
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: this.uniforms,
    })
    const plane = new THREE.Mesh(geometry, material)
    // this.bufferScene.add(plane)

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
  }

  buildRender() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      autoClearColor: false,
    })

    // this.renderer.toneMapping = THREE.ReinhardToneMapping // ACESFilmicToneMapping,

    this.setSizes()
  }

  buildCamera() {
    const aspectRatio = this.width / this.height
    const fieldOfView = 10
    const nearPlane = 1
    const farPlane = 10000

    this.camera = new THREE.PerspectiveCamera(fieldOfView, aspectRatio, nearPlane, farPlane)
    this.camera.updateProjectionMatrix()
    this.camera.position.y = 0
    this.camera.position.z = 100
    this.camera.lookAt(0, 0, 0)

    this.scene.add(this.camera)

    // scene.add( camera );
    // CameraController.init(this.camera, this.scene)
  }

  buildControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
  }

  buildCube() {
    const { texture } = LoaderManager.subjects.image
    console.log(texture)
    const geometry2 = new THREE.BoxBufferGeometry(5, 5, 32)
    const material2 = new THREE.MeshBasicMaterial()
    material2.map = texture;
    console.log(this.renderTarget)
    const cube2 = new THREE.Mesh(geometry2, material2)
    this.scene.add(cube2)
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

    this.renderer.render(this.scene, this.camera)

    this.uniforms.time.value = now / 1000
    // console.log(this.uniforms.time.value)

    // CameraController.render(now)

    this.stats.end()
  }

  // EVENTS

  handleMouseMove = e => {
    const x = (e.clientX / window.innerWidth) * 2 - 1
    const y = -(e.clientY / window.innerHeight) * 2 + 1

    window.dispatchEvent(createCustomEvent(MOUSE_MOVE, { x, y }))
  }

  handleScroll = () => {
    window.dispatchEvent(createCustomEvent(SCROLL, { scrollY: window.scrollY, maxHeight: this.maxHeight }))
  }

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
    this.renderer.setPixelRatio(DPR)
    this.renderer.setSize(this.width, this.height)
  }

  setUnits() {
    this.width = window.innerWidth
    this.height = window.innerHeight
  }
}
