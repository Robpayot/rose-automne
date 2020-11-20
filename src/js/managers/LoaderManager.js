import * as THREE from 'three';

class LoaderManager {
  constructor() {
    this.subjects = {}

    this.textureLoader = new THREE.TextureLoader()
  }

  load = (objects, callback) => {
    const promises = []
    for (let i = 0; i < objects.length; i++) {
      const { name, texture, img } = objects[i]

      this.subjects[name] = {}

      if (texture) {
        promises.push(this.loadTexture(texture, name))
      }

      if (img) {
        promises.push(this.loadImage(img, name))
      }
    }

    Promise.all(promises).then(callback)
  }

  loadTexture(url, name) {
    return new Promise(resolve => {
      this.textureLoader.load(url, result => {
        this.subjects[name].texture = result
        resolve(result)
      })
    })
  }

  loadImage(url, name) {
    return new Promise(resolve => {
      const image = new Image()

      image.onload = () => {
        this.subjects[name].img = image
        resolve(image)
      };

      image.src = url
    })
  }
}

export default new LoaderManager()
