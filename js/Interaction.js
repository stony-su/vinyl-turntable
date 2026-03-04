import * as THREE from 'three';

export class Interaction {
  constructor(camera, scene, renderer, turntable, crate, audioEngine, controls) {
    this.camera = camera;
    this.scene = scene;
    this.renderer = renderer;
    this.turntable = turntable;
    this.crate = crate;
    this.audioEngine = audioEngine;
    this.controls = controls;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.dragOffset = new THREE.Vector3();

    this.hoveredRecord = null;
    this.draggedRecord = null;
    this.isDragging = false;
    this.isKnobDragging = false;
    this.knobStartY = 0;
    this.knobStartVolume = 0;

    this.interactables = [];
    this.buildInteractables();
    this.bindEvents();
  }

  buildInteractables() {
    // Collect all interactive meshes
    this.interactables = [];

    // Records from crate - only disc and label meshes (tagged 'vinyl')
    this.crate.records.forEach(record => {
      record.group.traverse(child => {
        if (child.isMesh && child.userData.type === 'vinyl') {
          child.userData.record = record;
          this.interactables.push(child);
        }
      });
    });

    // Power button
    this.turntable.group.traverse(child => {
      if (child.isMesh && child.userData.type === 'powerButton') {
        this.interactables.push(child);
      }
      if (child.isMesh && child.userData.type === 'volumeKnob') {
        this.interactables.push(child);
      }
    });
  }

  bindEvents() {
    const canvas = this.renderer.domElement;
    canvas.addEventListener('pointermove', e => this.onPointerMove(e));
    canvas.addEventListener('pointerdown', e => this.onPointerDown(e));
    canvas.addEventListener('pointerup', e => this.onPointerUp(e));
    canvas.addEventListener('pointerleave', e => this.onPointerUp(e));
  }

  updateMouse(e) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  onPointerMove(e) {
    this.updateMouse(e);

    if (this.isKnobDragging) {
      this.handleKnobDrag(e);
      return;
    }

    if (this.isDragging && this.draggedRecord) {
      this.handleRecordDrag(e);
      return;
    }

    // Hover detection
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const hits = this.raycaster.intersectObjects(this.interactables, false);

    let newHovered = null;
    if (hits.length > 0) {
      const hit = hits[0];
      if (hit.object.userData.record && hit.object.userData.record.state === 'crate') {
        newHovered = hit.object.userData.record;
      }
    }

    // Un-hover previous
    if (this.hoveredRecord && this.hoveredRecord !== newHovered) {
      this.hoveredRecord.targetHoverOffset = 0;
    }

    // Hover new
    if (newHovered) {
      newHovered.targetHoverOffset = 1.5;
      this.renderer.domElement.style.cursor = 'grab';
    } else if (hits.length > 0 && hits[0].object.userData.record && hits[0].object.userData.record.state === 'platter' && !this.turntable.isPowered) {
      this.renderer.domElement.style.cursor = 'pointer';
    } else if (hits.length > 0 && hits[0].object.userData.type === 'powerButton') {
      this.renderer.domElement.style.cursor = 'pointer';
    } else if (hits.length > 0 && hits[0].object.userData.type === 'volumeKnob') {
      this.renderer.domElement.style.cursor = 'ns-resize';
    } else {
      this.renderer.domElement.style.cursor = 'default';
    }

    this.hoveredRecord = newHovered;
  }

  onPointerDown(e) {
    this.updateMouse(e);
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const hits = this.raycaster.intersectObjects(this.interactables, false);

    if (hits.length === 0) return;

    const hit = hits[0];
    const obj = hit.object;

    // Volume knob interaction
    if (obj.userData.type === 'volumeKnob') {
      this.isKnobDragging = true;
      this.knobStartY = e.clientY;
      this.knobStartVolume = this.audioEngine.getVolume();
      this.controls.enabled = false;
      this.renderer.domElement.style.cursor = 'ns-resize';
      return;
    }

    // Power button interaction
    if (obj.userData.type === 'powerButton') {
      this.handlePowerToggle();
      return;
    }

    // Vinyl record interaction
    const record = obj.userData.record;
    if (!record) return;

    if (record.state === 'crate') {
      this.startRecordDrag(record, hit.point);
    } else if (record.state === 'platter' && !this.turntable.isPowered) {
      this.returnRecordToCrate(record);
    }
  }

  onPointerUp(e) {
    if (this.isKnobDragging) {
      this.isKnobDragging = false;
      this.controls.enabled = true;
      this.renderer.domElement.style.cursor = 'default';
      return;
    }

    if (this.isDragging && this.draggedRecord) {
      this.endRecordDrag();
    }
  }

  handlePowerToggle() {
    if (!this.turntable.mountedVinyl) return;

    if (this.turntable.isPowered) {
      // Turn off
      this.turntable.setPowerState(false);
      this.audioEngine.stop();
    } else {
      // Turn on
      this.turntable.setPowerState(true);
      const record = this.turntable.mountedVinyl.userData.vinylRecord;
      if (record) {
        this.audioEngine.play(record.songData.name);
      }
    }

    // Visual button press feedback
    const btn = this.turntable.powerButton;
    const origY = btn.position.y;
    btn.position.y -= 0.08;
    setTimeout(() => { btn.position.y = origY; }, 150);
  }

  handleKnobDrag(e) {
    const deltaY = this.knobStartY - e.clientY;
    const sensitivity = 0.004;
    let newVolume = this.knobStartVolume + deltaY * sensitivity;
    newVolume = Math.max(0, Math.min(1, newVolume));
    this.audioEngine.setVolume(newVolume);
    this.turntable.setVolumeVisual(newVolume);
  }

  startRecordDrag(record, hitPoint) {
    this.isDragging = true;
    this.draggedRecord = record;
    record.state = 'dragging';
    this.controls.enabled = false;
    this.renderer.domElement.style.cursor = 'grabbing';

    // Calculate world position of the record
    const worldPos = new THREE.Vector3();
    record.group.getWorldPosition(worldPos);

    // Set drag plane at a comfortable height
    this.dragPlane.set(new THREE.Vector3(0, 1, 0), -worldPos.y - 3);

    // Smoothly transition record to horizontal flat orientation
    this.animateRecordToFlat(record);
  }

  animateRecordToFlat(record) {
    // Remove from crate group, add to scene at world position
    const worldPos = new THREE.Vector3();
    record.group.getWorldPosition(worldPos);
    const worldQuat = new THREE.Quaternion();
    record.group.getWorldQuaternion(worldQuat);

    this.crate.group.remove(record.group);
    this.scene.add(record.group);
    record.group.position.copy(worldPos);
    record.group.quaternion.copy(worldQuat);

    // Animate to flat horizontal using quaternion slerp (avoids gimbal lock)
    const startQuat = worldQuat.clone();
    const targetQuat = new THREE.Quaternion(); // identity = flat
    const targetY = worldPos.y + 5;
    this._dragAnimating = true;
    let progress = 0;

    const animate = () => {
      if (!this._dragAnimating) return;

      progress += (1 - progress) * 0.12;
      if (progress > 0.99) progress = 1;

      // Slerp quaternion for smooth rotation
      record.group.quaternion.slerpQuaternions(startQuat, targetQuat, progress);

      // Lerp height up
      record.group.position.y += (targetY - record.group.position.y) * 0.15;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        record.group.quaternion.copy(targetQuat);
        record.group.rotation.set(0, 0, 0);
        this._dragAnimating = false;
      }
    };

    requestAnimationFrame(animate);
  }

  handleRecordDrag(e) {
    if (!this.draggedRecord) return;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersect = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(this.dragPlane, intersect);

    if (intersect) {
      // Smooth follow
      this.draggedRecord.group.position.x += (intersect.x - this.draggedRecord.group.position.x) * 0.3;
      this.draggedRecord.group.position.z += (intersect.z - this.draggedRecord.group.position.z) * 0.3;
    }
  }

  endRecordDrag() {
    const record = this.draggedRecord;
    if (!record) return;

    this.isDragging = false;
    this.draggedRecord = null;
    this.controls.enabled = true;
    this.renderer.domElement.style.cursor = 'default';
    this._dragAnimating = false;

    // Check if over platter
    const platterPos = this.turntable.getPlatterWorldPos();
    const recordPos = new THREE.Vector3();
    record.group.getWorldPosition(recordPos);

    const dist = new THREE.Vector2(
      recordPos.x - platterPos.x,
      recordPos.z - platterPos.z
    ).length();

    if (dist < 8) {
      // If there's already a record on the platter, swap it out first
      if (this.turntable.mountedVinyl) {
        const oldRecord = this.turntable.mountedVinyl.userData.vinylRecord;
        if (oldRecord && oldRecord !== record) {
          // Stop playback if active
          if (this.turntable.isPowered) {
            this.turntable.setPowerState(false);
            this.audioEngine.stop();
          }
          // Return old record to crate
          this.returnRecordToCrate(oldRecord);
        }
      }
      // Snap new record to platter
      this.snapRecordToPlatter(record);
    } else {
      // Return to crate
      this.returnRecordToCrate(record);
    }
  }

  snapRecordToPlatter(record) {
    record.state = 'platter';

    // Remove from scene, add to platter so it spins with it
    this.scene.remove(record.group);
    this.turntable.platter.add(record.group);

    // Position on platter (local to platter)
    record.group.position.set(0, 0.65, 0);
    record.group.rotation.set(0, 0, 0);
    record.group.scale.set(1, 1, 1);

    this.turntable.mountedVinyl = record.group;
    record.group.userData.vinylRecord = record;

    // Animate smooth snap
    const targetY = 0.65;
    const snap = () => {
      const dy = targetY - record.group.position.y;
      if (Math.abs(dy) > 0.01) {
        record.group.position.y += dy * 0.2;
        requestAnimationFrame(snap);
      } else {
        record.group.position.y = targetY;
      }
    };
    snap();
  }

  returnRecordToCrate(record) {
    const wasOnPlatter = record.state === 'platter';

    // Get world transform before reparenting
    const worldPos = new THREE.Vector3();
    record.group.getWorldPosition(worldPos);
    const worldQuat = new THREE.Quaternion();
    record.group.getWorldQuaternion(worldQuat);

    if (wasOnPlatter) {
      // Stop playback if playing
      if (this.turntable.isPowered) {
        this.turntable.setPowerState(false);
        this.audioEngine.stop();
      }
      this.turntable.mountedVinyl = null;

      // Remove from platter
      this.turntable.platter.remove(record.group);
    } else {
      // Remove from scene
      this.scene.remove(record.group);
    }

    record.state = 'crate';

    // Re-add to crate
    this.crate.group.add(record.group);

    // Convert world position to crate-local coordinates
    const crateInverse = new THREE.Matrix4().copy(this.crate.group.matrixWorld).invert();
    worldPos.applyMatrix4(crateInverse);
    record.group.position.copy(worldPos);

    // Convert world quaternion to crate-local
    const crateWorldQuat = new THREE.Quaternion();
    this.crate.group.getWorldQuaternion(crateWorldQuat);
    crateWorldQuat.invert();
    worldQuat.premultiply(crateWorldQuat);
    record.group.quaternion.copy(worldQuat);

    // Animate back to stored crate position using quaternion slerp
    const targetPos = record.cratePosition.clone();
    const startQuat = record.group.quaternion.clone();
    const targetQuat = new THREE.Quaternion().setFromEuler(record.crateRotation);
    let progress = 0;

    const animateBack = () => {
      progress += (1 - progress) * 0.1;
      if (progress > 0.99) progress = 1;

      // Slerp position
      record.group.position.lerp(targetPos, 0.12);

      // Slerp quaternion
      record.group.quaternion.slerpQuaternions(startQuat, targetQuat, progress);

      const dist = record.group.position.distanceTo(targetPos);
      if (dist > 0.05 || progress < 1) {
        requestAnimationFrame(animateBack);
      } else {
        record.group.position.copy(targetPos);
        record.group.rotation.copy(record.crateRotation);
      }
    };

    animateBack();
  }

  update(delta) {
    // Update record hover animations
    this.crate.records.forEach(record => {
      record.update(delta);
      if (record.state === 'crate') {
        const targetY = record.cratePosition.y + record.hoverOffset;
        record.group.position.y += (targetY - record.group.position.y) * delta * 8;
      }
    });
  }
}
