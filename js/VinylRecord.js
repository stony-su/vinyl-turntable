import * as THREE from 'three';

export class VinylRecord {
  constructor(songData, index) {
    this.songData = songData;
    this.index = index;
    this.group = new THREE.Group();
    this.state = 'crate'; // 'crate' | 'dragging' | 'platter' 
    this.cratePosition = new THREE.Vector3();
    this.crateRotation = new THREE.Euler();
    this.hoverOffset = 0;
    this.targetHoverOffset = 0;

    this.build();
  }

  build() {
    const loader = new THREE.TextureLoader();

    // Main vinyl disc - black with grooves
    const discGeo = new THREE.CylinderGeometry(6.5, 6.5, 0.18, 64);
    const discMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.12,
      metalness: 0.35
    });
    const disc = new THREE.Mesh(discGeo, discMat);
    disc.castShadow = true;
    disc.receiveShadow = true;
    disc.userData.type = 'vinyl';
    disc.userData.record = this;
    this.group.add(disc);
    this.disc = disc;

    // Groove rings (visual detail on vinyl)
    for (let i = 0; i < 18; i++) {
      const radius = 2.8 + i * 0.2;
      if (radius > 6.3) break;
      const grooveGeo = new THREE.TorusGeometry(radius, 0.015, 4, 64);
      const grooveMat = new THREE.MeshStandardMaterial({
        color: 0x0a0a0a,
        roughness: 0.08,
        metalness: 0.4,
        transparent: true,
        opacity: 0.6
      });
      const groove = new THREE.Mesh(grooveGeo, grooveMat);
      groove.rotation.x = -Math.PI / 2;
      groove.position.y = 0.1;
      this.group.add(groove);
    }

    // Outer edge bevel (rim)
    const rimGeo = new THREE.TorusGeometry(6.5, 0.1, 6, 64);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0x0d0d0d,
      roughness: 0.15,
      metalness: 0.4
    });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.x = -Math.PI / 2;
    rim.position.y = 0;
    this.group.add(rim);

    // Center label (with album art)
    const labelGeo = new THREE.CylinderGeometry(2.4, 2.4, 0.2, 48);

    // Create material array for the cylinder: side, top, bottom
    const labelSideMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.5,
      metalness: 0.2
    });

    // Load album art for the top face
    const labelTopMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.45,
      metalness: 0.05
    });

    const labelBottomMat = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.5,
      metalness: 0.1
    });

    if (this.songData.image) {
      loader.load(this.songData.image, (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        // Make the texture circular by using the UV mapping of the cylinder top
        texture.center.set(0.5, 0.5);
        texture.rotation = 0;
        labelTopMat.map = texture;
        labelTopMat.needsUpdate = true;
      });
    }

    const label = new THREE.Mesh(labelGeo, [labelSideMat, labelTopMat, labelBottomMat]);
    label.position.y = 0.02;
    label.castShadow = true;
    label.userData.type = 'vinyl';
    label.userData.record = this;
    this.group.add(label);
    this.label = label;

    // Center hole
    const holeGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.25, 12);
    const holeMat = new THREE.MeshStandardMaterial({
      color: 0x050505,
      roughness: 0.9,
      metalness: 0.1
    });
    const hole = new THREE.Mesh(holeGeo, holeMat);
    hole.position.y = 0.03;
    this.group.add(hole);

    // Thin ring around label
    const labelRingGeo = new THREE.TorusGeometry(2.4, 0.04, 4, 48);
    const labelRingMat = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.2,
      metalness: 0.6
    });
    const labelRing = new THREE.Mesh(labelRingGeo, labelRingMat);
    labelRing.rotation.x = -Math.PI / 2;
    labelRing.position.y = 0.12;
    this.group.add(labelRing);
  }

  setInteractive(enabled) {
    this.disc.userData.interactive = enabled;
    this.label.userData.interactive = enabled;
  }

  update(delta) {
    // Smooth hover animation
    if (Math.abs(this.hoverOffset - this.targetHoverOffset) > 0.01) {
      this.hoverOffset += (this.targetHoverOffset - this.hoverOffset) * delta * 8;
    }
  }
}
