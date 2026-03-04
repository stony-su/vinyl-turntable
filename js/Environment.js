import * as THREE from 'three';

export class Environment {
  constructor(scene) {
    this.scene = scene;
    this.build();
  }

  build() {
    // Floor
    const floorGeo = new THREE.PlaneGeometry(120, 120);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x3a2c1c,
      roughness: 0.85,
      metalness: 0.0
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -12;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Back wall
    const wallGeo = new THREE.PlaneGeometry(120, 60);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x504038,
      roughness: 0.88,
      metalness: 0.0
    });
    const backWall = new THREE.Mesh(wallGeo, wallMat);
    backWall.position.set(0, 18, -30);
    backWall.receiveShadow = true;
    this.scene.add(backWall);

    // Side wall (left)
    const sideWall = new THREE.Mesh(wallGeo, wallMat.clone());
    sideWall.material.color.setHex(0x473828);
    sideWall.position.set(-60, 18, 0);
    sideWall.rotation.y = Math.PI / 2;
    sideWall.receiveShadow = true;
    this.scene.add(sideWall);

    // Table
    this.buildTable();

    // Lighting
    this.buildLighting();
  }

  buildTable() {
    const tableGroup = new THREE.Group();

    // Tabletop - thick slab
    const topGeo = new THREE.BoxGeometry(56, 2.2, 32);
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x3b2814,
      roughness: 0.7,
      metalness: 0.05
    });
    const top = new THREE.Mesh(topGeo, woodMat);
    top.position.y = 0;
    top.castShadow = true;
    top.receiveShadow = true;
    tableGroup.add(top);

    // Slight edge trim on tabletop
    const trimGeo = new THREE.BoxGeometry(56.4, 0.6, 32.4);
    const trimMat = new THREE.MeshStandardMaterial({
      color: 0x2d1e0e,
      roughness: 0.75,
      metalness: 0.05
    });
    const trim = new THREE.Mesh(trimGeo, trimMat);
    trim.position.y = -1.1;
    trim.castShadow = true;
    tableGroup.add(trim);

    // Table legs
    const legGeo = new THREE.CylinderGeometry(0.8, 0.7, 10.5, 8);
    const legMat = new THREE.MeshStandardMaterial({
      color: 0x2d1e0e,
      roughness: 0.65,
      metalness: 0.1
    });
    const legPositions = [
      [-26, -6.6, -14],
      [26, -6.6, -14],
      [-26, -6.6, 14],
      [26, -6.6, 14]
    ];
    legPositions.forEach(pos => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(...pos);
      leg.castShadow = true;
      tableGroup.add(leg);
    });

    tableGroup.position.set(0, 0, 0);
    this.scene.add(tableGroup);
    this.tableGroup = tableGroup;
  }

  buildLighting() {
    // Warm ambient
    const ambient = new THREE.AmbientLight(0xffeedd, 0.65);
    this.scene.add(ambient);

    // Hemisphere light for soft fill
    const hemi = new THREE.HemisphereLight(0xffebc8, 0x2a1a10, 0.6);
    this.scene.add(hemi);

    // Main warm point light (like a desk lamp)
    const lampLight = new THREE.PointLight(0xffce8a, 2.8, 100, 1.2);
    lampLight.position.set(-15, 28, 10);
    lampLight.castShadow = true;
    lampLight.shadow.mapSize.width = 1024;
    lampLight.shadow.mapSize.height = 1024;
    lampLight.shadow.camera.near = 2;
    lampLight.shadow.camera.far = 60;
    lampLight.shadow.bias = -0.002;
    lampLight.shadow.radius = 4;
    this.scene.add(lampLight);

    // Secondary fill light
    const fillLight = new THREE.DirectionalLight(0xffe0b0, 0.8);
    fillLight.position.set(20, 20, 15);
    fillLight.castShadow = true;
    fillLight.shadow.mapSize.width = 512;
    fillLight.shadow.mapSize.height = 512;
    fillLight.shadow.camera.left = -30;
    fillLight.shadow.camera.right = 30;
    fillLight.shadow.camera.top = 30;
    fillLight.shadow.camera.bottom = -30;
    fillLight.shadow.bias = -0.003;
    fillLight.shadow.radius = 6;
    this.scene.add(fillLight);

    // Subtle rim light from behind
    const rimLight = new THREE.PointLight(0xffa060, 0.8, 60);
    rimLight.position.set(0, 15, -25);
    this.scene.add(rimLight);

    // Subtle warm spot on turntable area
    const spotLight = new THREE.SpotLight(0xffd4a0, 1.0, 50, Math.PI / 5, 0.6, 1.2);
    spotLight.position.set(-5, 22, 5);
    spotLight.target.position.set(-5, 0, -2);
    this.scene.add(spotLight);
    this.scene.add(spotLight.target);

    // Extra overhead fill
    const overheadLight = new THREE.PointLight(0xffeac4, 0.6, 70);
    overheadLight.position.set(5, 30, 5);
    this.scene.add(overheadLight);
  }

  buildPoster() {
    const loader = new THREE.TextureLoader();
    const posterGroup = new THREE.Group();

    // Poster dimensions matching poster.jpg aspect ratio (2880x1200 = 2.4:1)
    const posterWidth = 20;
    const posterHeight = posterWidth / 2.4;

    // Poster image — just the image, no frame
    const posterGeo = new THREE.PlaneGeometry(posterWidth, posterHeight);
    const posterMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.55,
      metalness: 0.0
    });
    loader.load('poster.jpg', (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      posterMat.map = texture;
      posterMat.needsUpdate = true;
    });
    const posterMesh = new THREE.Mesh(posterGeo, posterMat);
    posterMesh.castShadow = true;
    posterGroup.add(posterMesh);

    return posterGroup;
  }
}
