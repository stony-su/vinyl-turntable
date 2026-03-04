import * as THREE from 'three';
import { VinylRecord } from './VinylRecord.js';

export class RecordCrate {
  constructor(songs) {
    this.group = new THREE.Group();
    this.records = [];
    this.songs = songs;

    this.buildCrate();
    this.fillRecords();
  }

  buildCrate() {
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x8b6914,
      roughness: 0.8,
      metalness: 0.02
    });
    const darkWoodMat = new THREE.MeshStandardMaterial({
      color: 0x6b5010,
      roughness: 0.85,
      metalness: 0.02
    });

    const crateWidth = 16;
    const crateDepth = 8;
    const crateHeight = 9;
    const plankThickness = 0.4;

    // Bottom
    const bottomGeo = new THREE.BoxGeometry(crateWidth, plankThickness, crateDepth);
    const bottom = new THREE.Mesh(bottomGeo, darkWoodMat);
    bottom.position.y = 0;
    bottom.receiveShadow = true;
    bottom.castShadow = true;
    this.group.add(bottom);

    // Front panel (2 planks)
    for (let i = 0; i < 2; i++) {
      const plankGeo = new THREE.BoxGeometry(crateWidth, crateHeight / 2 - 0.2, plankThickness);
      const plank = new THREE.Mesh(plankGeo, i === 0 ? woodMat : darkWoodMat);
      plank.position.set(0, crateHeight / 4 + i * (crateHeight / 2 - 0.1), crateDepth / 2);
      plank.castShadow = true;
      plank.receiveShadow = true;
      this.group.add(plank);
    }

    // Back panel (2 planks)
    for (let i = 0; i < 2; i++) {
      const plankGeo = new THREE.BoxGeometry(crateWidth, crateHeight / 2 - 0.2, plankThickness);
      const plank = new THREE.Mesh(plankGeo, i === 0 ? darkWoodMat : woodMat);
      plank.position.set(0, crateHeight / 4 + i * (crateHeight / 2 - 0.1), -crateDepth / 2);
      plank.castShadow = true;
      plank.receiveShadow = true;
      this.group.add(plank);
    }

    // Left side
    const sideGeo = new THREE.BoxGeometry(plankThickness, crateHeight, crateDepth);
    const leftSide = new THREE.Mesh(sideGeo, woodMat);
    leftSide.position.set(-crateWidth / 2, crateHeight / 2, 0);
    leftSide.castShadow = true;
    leftSide.receiveShadow = true;
    this.group.add(leftSide);

    // Right side
    const rightSide = new THREE.Mesh(sideGeo, woodMat);
    rightSide.position.set(crateWidth / 2, crateHeight / 2, 0);
    rightSide.castShadow = true;
    rightSide.receiveShadow = true;
    this.group.add(rightSide);

    // Corner reinforcement strips
    const stripGeo = new THREE.BoxGeometry(0.3, crateHeight + 0.2, 0.3);
    const stripMat = new THREE.MeshStandardMaterial({
      color: 0x5a4510,
      roughness: 0.75,
      metalness: 0.05
    });
    const corners = [
      [-crateWidth / 2, crateHeight / 2, crateDepth / 2],
      [crateWidth / 2, crateHeight / 2, crateDepth / 2],
      [-crateWidth / 2, crateHeight / 2, -crateDepth / 2],
      [crateWidth / 2, crateHeight / 2, -crateDepth / 2]
    ];
    corners.forEach(pos => {
      const strip = new THREE.Mesh(stripGeo, stripMat);
      strip.position.set(...pos);
      strip.castShadow = true;
      this.group.add(strip);
    });
  }

  fillRecords() {
    const count = this.songs.length;
    const startX = -(count - 1) * 1.1;

    this.songs.forEach((song, i) => {
      const record = new VinylRecord(song, i);
      
      // Stand records upright (like in a real crate), album art faces -X (local)
      // Lean back slightly (PI/2 - 0.2) so album art is visible from above
      record.group.rotation.z = Math.PI / 2 - 0.2;
      record.group.rotation.y = 0.04 * (i - (count - 1) / 2); // slight fan

      const x = startX + i * 2.2;
      const y = 5.5;
      const z = 0;
      record.group.position.set(x, y, z);

      // Store rest position
      record.cratePosition.copy(record.group.position);
      record.crateRotation.copy(record.group.rotation);

      this.records.push(record);
      this.group.add(record.group);
    });
  }

  getRecordAt(index) {
    return this.records[index] || null;
  }
}
