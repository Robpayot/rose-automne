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
          this.buildParticles(texture)
          break
        case 1:
          texture = LoaderManager.subjects.leave2.texture
          break
        case 2:
          texture = LoaderManager.subjects.leave3.texture
          break
      }

    }
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

    // const uniforms = {
    //   textures: {
    //     type: 'tv',
    //     value: [
    //       LoaderManager.subjects.leave1.texture,
    //       LoaderManager.subjects.leave2.texture,
    //       LoaderManager.subjects.leave3.texture,
    //     ],
    //   },
    // }

    // const material = new THREE.ShaderMaterial({
    //   uniforms,
    //   vertexShader: vertexParticlesShader,
    //   fragmentShader: fragmentParticlesShader,
    //   transparent: true,
    // })

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

    // // texture.rotation = 0;

    material.map = texture

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

    // const bufferGeometry = new THREE.BufferGeometry().fromGeometry(geometry)

    // const texIndex = new Float32Array(bufferGeometry.attributes.position.count)

    // for (let i = 0; i < this.nbParticles; i++) {
    //   texIndex[i] = (Math.random() * uniforms.textures.value.length) | 0
    // }

    // bufferGeometry.setAttribute('texIndex', new THREE.BufferAttribute(texIndex, 1))


    // particles.sortParticles = true

    // this.particlesGroup.push(particles)

    // add atribute to the buffer geometry
    // const numVertices = bufferGeometry.attributes.position.count
    // const alphaOffsets = new Float32Array(numVertices) // 1 values per vertex
    // const alphaSpeeds = new Float32Array(numVertices)

    // for (let i = 0; i < numVertices; i++) {
    //   // set alphaOffset randomly
    //   alphaOffsets[i] = randomFloat(0, 1000) // alpha between 0.2 & 1
    //   alphaSpeeds[i] = randomFloat(0.5, 2)
    // }

    // bufferGeometry.setAttribute('alphaOffset', new THREE.BufferAttribute(alphaOffsets, 1))
    // bufferGeometry.setAttribute('alphaSpeed', new THREE.BufferAttribute(alphaSpeeds, 1))
    // material.userData.time = { value: 0.0 }

    // Override PointsMaterial with a custom one
    material.onBeforeCompile = shader => {
      // shader.uniforms.time = material.userData.time
      // pass this input by reference

      // prepend the input to the vertex shader
      shader.vertexShader = vertexParticlesShader

      // //prepend the input to the shader
      shader.fragmentShader = fragmentParticlesShader
    }

    const particles = new THREE.Points(geometry, material)
    this.scene.add(particles)
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

      this.sortPoints(this.particlesGroup[y])
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

  sortPoints(mesh) {
    return
    const vector = new THREE.Vector3()

    // Model View Projection matrix

    const matrix = new THREE.Matrix4()
    matrix.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse)
    matrix.multiply(mesh.matrixWorld)

    //

    const geometry = mesh.geometry

    console.log(geometry)

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

///////
//////
///////

////////

// import * as THREE from '../build/three.module.js'

// import Stats from './jsm/libs/stats.module.js'

// let renderer, scene, camera, stats
// let sphere, length1

// const WIDTH = window.innerWidth
// const HEIGHT = window.innerHeight

// init()
// animate()

// function init() {
//   camera = new THREE.PerspectiveCamera(45, WIDTH / HEIGHT, 1, 10000)
//   camera.position.z = 300

//   scene = new THREE.Scene()

//   const radius = 100,
//     segments = 68,
//     rings = 38

//   const vertices1 = new THREE.SphereGeometry(radius, segments, rings).vertices
//   const vertices2 = new THREE.BoxGeometry(0.8 * radius, 0.8 * radius, 0.8 * radius, 10, 10, 10).vertices

//   length1 = vertices1.length

//   const vertices = vertices1.concat(vertices2)

//   const positions = new Float32Array(vertices.length * 3)
//   const colors = new Float32Array(vertices.length * 3)
//   const sizes = new Float32Array(vertices.length)

//   const color = new THREE.Color()

//   for (let i = 0, l = vertices.length; i < l; i++) {
//     const vertex = vertices[i]
//     vertex.toArray(positions, i * 3)

//     if (i < length1) {
//       color.setHSL(0.01 + 0.1 * (i / length1), 0.99, (vertex.y + radius) / (4 * radius))
//     } else {
//       color.setHSL(0.6, 0.75, 0.25 + vertex.y / (2 * radius))
//     }

//     color.toArray(colors, i * 3)

//     sizes[i] = i < length1 ? 10 : 40
//   }

//   const geometry = new THREE.BufferGeometry()
//   geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
//   geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
//   geometry.setAttribute('ca', new THREE.BufferAttribute(colors, 3))

//   //

//   const texture = new THREE.TextureLoader().load('textures/sprites/disc.png')
//   texture.wrapS = THREE.RepeatWrapping
//   texture.wrapT = THREE.RepeatWrapping

//   const material = new THREE.ShaderMaterial({
//     uniforms: {
//       color: { value: new THREE.Color(0xffffff) },
//       pointTexture: { value: texture },
//     },
//     vertexShader: document.getElementById('vertexshader').textContent,
//     fragmentShader: document.getElementById('fragmentshader').textContent,
//     transparent: true,
//   })

//   //

//   sphere = new THREE.Points(geometry, material)
//   scene.add(sphere)

//   //

//   renderer = new THREE.WebGLRenderer()
//   renderer.setPixelRatio(window.devicePixelRatio)
//   renderer.setSize(WIDTH, HEIGHT)

//   const container = document.getElementById('container')
//   container.appendChild(renderer.domElement)

//   stats = new Stats()
//   container.appendChild(stats.dom)

//   //

//   window.addEventListener('resize', onWindowResize, false)
// }

// function onWindowResize() {
//   camera.aspect = window.innerWidth / window.innerHeight
//   camera.updateProjectionMatrix()

//   renderer.setSize(window.innerWidth, window.innerHeight)
// }

// function animate() {
//   requestAnimationFrame(animate)

//   render()
//   stats.update()
// }

// function render() {
//   const time = Date.now() * 0.005

//   sphere.rotation.y = 0.02 * time
//   sphere.rotation.z = 0.02 * time

//   const geometry = sphere.geometry
//   const attributes = geometry.attributes

//   for (let i = 0; i < attributes.size.array.length; i++) {
//     if (i < length1) {
//       attributes.size.array[i] = 16 + 12 * Math.sin(0.1 * i + time)
//     }
//   }

//   attributes.size.needsUpdate = true

//   sortPoints()

//   renderer.render(scene, camera)
// }
