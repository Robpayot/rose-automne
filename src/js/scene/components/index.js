import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import Stats from 'stats-js'
import createCustomEvent from '~utils/createCustomEvent'
import GUI from './Gui'
import { randomFloat } from '~utils/math'

import LoaderManager from '../../managers/LoaderManager'

// components

import { RAF, WINDOW_RESIZE, START_SCENE } from '../../constants/index'
import fragmentShader from '../shaders/custom.frag'
import vertexShader from '../shaders/custom.vert'
import fragmentParticlesShader from '../shaders/customPointsMaterial.frag'
import vertexParticlesShader from '../shaders/customPointsMaterial.vert'

export default class Scene {
  constructor(el) {
    this.canvas = el

    this.particlesGroup = []

    this.setUnits()

    this.load()
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
    // this.buildStats()
    this.buildTextureScene()
    this.buildScene()
    this.buildRender()
    this.buildCamera()
    this.buildControls()
    this.buildParticles()
    this.buildText()

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
  }

  buildControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.autoRotate = true
    this.controls.enableDamping = true
    this.controls.minDistance = 0
    this.controls.maxDistance = 550
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

  buildParticles() {
    // return
    this.nbParticles = 300
    this.range = 350

    const uniforms = {
      textures: {
        type: 'tv',
        value: [
          LoaderManager.subjects.leave1.texture,
          LoaderManager.subjects.leave2.texture,
          LoaderManager.subjects.leave3.texture,
        ],
      },
    }

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

    const { range } = this

    // create particles

    const vertices = []
    const textureIndex = []

    this.particlesProperties = []

    for (let i = 0; i < this.nbParticles; i++) {
      const x = randomFloat(-range, range)
      const y = randomFloat(-range, range)
      const z = randomFloat(-range, range)

      textureIndex.push((Math.random() * 3) | 0)
      vertices.push(x, y, z)

      const properties = {
        speed: randomFloat(0.2, 0.6),
        velocityStep: randomFloat(0.00006, 0.00018),
        velocity: 0,
        offsetX: randomFloat(100, 600),
      }

      this.particlesProperties.push(properties)
    }

    const bufferGeometry = new THREE.BufferGeometry()
    bufferGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    bufferGeometry.setAttribute('textureIndex', new THREE.Float32BufferAttribute(textureIndex, 1))

    // Override PointsMaterial with a custom one
    material.onBeforeCompile = shader => {
      shader.uniforms.textures = uniforms.textures
      // pass this input by reference

      // prepend the input to the vertex shader
      shader.vertexShader = vertexParticlesShader

      // //prepend the input to the shader
      shader.fragmentShader = fragmentParticlesShader
    }

    this.particles = new THREE.Points(bufferGeometry, material)
    this.scene.add(this.particles)
    console.log(this.particles)
  }

  buildText() {
    const loader = new THREE.FontLoader()

    loader.load('img/parisienne.json', font => {
      let geometry = new THREE.TextGeometry('Clique & déplace', {
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

  // RAF
  render = e => {
    const { now } = e.detail

    // this.stats.begin()

    if (this.controls) this.controls.update() // for damping
    // draw render target scene to render target
    this.renderer.setRenderTarget(this.renderTarget)
    this.renderer.render(this.rtScene, this.rtCamera)
    this.renderer.setRenderTarget(null)

    if (this.particles) {
      // const { geometry } = this.particlesGroup[y]
      const positions = this.particles.geometry.attributes.position.array

      let index = 0
      const vertex = new THREE.Vector3()

      for (let i = 0, l = this.nbParticles; i < l; i++) {
        vertex.fromBufferAttribute(this.particles.geometry.attributes.position, i)

        const particleProperty = this.particlesProperties[i]
        particleProperty.x = vertex.x
        particleProperty.y = vertex.y
        particleProperty.z = vertex.z

        particleProperty.velocity += particleProperty.velocityStep
        particleProperty.y -= particleProperty.speed + particleProperty.velocity
        particleProperty.velocityX = Math.sin(now / 500 + particleProperty.offsetX)
        particleProperty.x += particleProperty.velocityX / 8
        if (particleProperty.y < -this.range) {
          particleProperty.y = this.range
          particleProperty.velocity = 0
        }
        if (particleProperty.x > this.range) {
          particleProperty.x = -this.range
          particleProperty.velocity = 0
        }

        // update positions attributes of bufferGeometry
        positions[index++] = particleProperty.x
        positions[index++] = particleProperty.y
        positions[index++] = particleProperty.z
      }

      this.particles.geometry.attributes.position.needsUpdate = true

      this.sortPoints(this.particles)
    }

    this.renderer.render(this.scene, this.camera)

    this.uniforms.time.value = now / 1000

    // this.stats.end()
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
    if (DPR > 1 && window.innerWidth > 768) {
      this.renderer.setPixelRatio(1.5)
    } else {
      this.renderer.setPixelRatio(DPR)
    }
    this.renderer.setSize(this.width, this.height)
  }

  setUnits() {
    this.width = window.innerWidth
    this.height = window.innerHeight
  }

  sortPoints(mesh) {
    const vector = new THREE.Vector3()

    // Model View Projection matrix

    const matrix = new THREE.Matrix4()
    matrix.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse)
    matrix.multiply(mesh.matrixWorld)

    const geometry = mesh.geometry

    let index = geometry.getIndex()
    const positions = geometry.getAttribute('position').array
    const length = positions.length / 3

    if (index === null) {
      const array = new Uint16Array(length)

      for (let i = 0; i < length; i++) {
        array[i] = i
      }

      index = new THREE.BufferAttribute(array, 1)

      geometry.setIndex(index)
    }

    const sortArray = []

    for (let i = 0; i < length; i++) {
      vector.fromArray(positions, i * 3)
      vector.applyMatrix4(matrix)

      sortArray.push([vector.z, i])
    }

    function numericalSort(a, b) {
      return b[0] - a[0]
    }

    sortArray.sort(numericalSort)

    const indices = index.array

    for (let i = 0; i < length; i++) {
      indices[i] = sortArray[i][1]
    }

    geometry.index.needsUpdate = true
  }
}
