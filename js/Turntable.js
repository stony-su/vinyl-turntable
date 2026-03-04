import * as THREE from 'three';

export class Turntable {
  constructor() {
    this.group = new THREE.Group();
    this.platter = null;
    this.platterTop = null;
    this.tonearmPivot = null;
    this.tonearm = null;
    this.powerButton = null;
    this.powerLed = null;
    this.volumeKnob = null;
    this.volumeIndicator = null;
    this.isPowered = false;
    this.isSpinning = false;
    this.spinSpeed = 0;
    this.targetSpinSpeed = 0;
    this.tonearmAngle = 0;
    this.tonearmTargetAngle = 0;
    this.tonearmRestAngle = 0;
    this.tonearmPlayAngle = -0.42;
    this.mountedVinyl = null;
    this.volumeAngle = 0;
    this.knobRotatingPart = null;

    this.matChrome = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.12, metalness: 0.95 });
    this.matBrushedMetal = new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.28, metalness: 0.9 });
    this.matDarkMetal = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.35, metalness: 0.85 });
    this.matBlackRubber = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.95, metalness: 0.0 });
    this.matWalnut = new THREE.MeshStandardMaterial({ color: 0x1c1108, roughness: 0.52, metalness: 0.06 });
    this.matWalnutLight = new THREE.MeshStandardMaterial({ color: 0x2a1a0d, roughness: 0.48, metalness: 0.04 });
    this.matAccentGold = new THREE.MeshStandardMaterial({ color: 0xc0a050, roughness: 0.18, metalness: 0.92 });
    this.matCopperAccent = new THREE.MeshStandardMaterial({ color: 0xb87333, roughness: 0.22, metalness: 0.88 });

    this.build();
  }
  build() {
    this.buildCabinet();
    this.buildPlatter();
    this.buildTonearm();
    this.buildPowerButton();
    this.buildVolumeKnob();
    this.buildSpeedSelector();
    this.buildDetails();
    this.buildDustCoverHinges();
    this.buildCableConnector();
  }

  buildCabinet() {
    const baseGeo = new THREE.BoxGeometry(32, 1.4, 24);
    const base = new THREE.Mesh(baseGeo, this.matWalnut);
    base.position.y = 0.7; base.castShadow = true; base.receiveShadow = true;
    this.group.add(base);

    const midGeo = new THREE.BoxGeometry(31.2, 0.8, 23.2);
    const mid = new THREE.Mesh(midGeo, this.matWalnutLight);
    mid.position.y = 1.8; mid.castShadow = true; mid.receiveShadow = true;
    this.group.add(mid);

    const topMat = new THREE.MeshStandardMaterial({ color: 0x0f0a05, roughness: 0.25, metalness: 0.12 });
    const topGeo = new THREE.BoxGeometry(31.6, 0.3, 23.6);
    const topPlate = new THREE.Mesh(topGeo, topMat);
    topPlate.position.y = 2.55; topPlate.castShadow = true; topPlate.receiveShadow = true;
    this.group.add(topPlate);

    const edgeMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.15, metalness: 0.9 });
    const frontEdgeGeo = new THREE.BoxGeometry(31.8, 0.12, 0.12);
    const frontEdge = new THREE.Mesh(frontEdgeGeo, edgeMat);
    frontEdge.position.set(0, 2.72, 11.85); this.group.add(frontEdge);
    const backEdge = frontEdge.clone(); backEdge.position.set(0, 2.72, -11.85); this.group.add(backEdge);
    const sideEdgeGeo = new THREE.BoxGeometry(0.12, 0.12, 23.8);
    const leftEdge = new THREE.Mesh(sideEdgeGeo, edgeMat);
    leftEdge.position.set(-15.9, 2.72, 0); this.group.add(leftEdge);
    const rightEdge = leftEdge.clone(); rightEdge.position.set(15.9, 2.72, 0); this.group.add(rightEdge);

    const frontPanelMat = new THREE.MeshStandardMaterial({ color: 0x150d06, roughness: 0.42, metalness: 0.1 });
    const frontPanelGeo = new THREE.BoxGeometry(31.4, 1.8, 0.25);
    const frontPanel = new THREE.Mesh(frontPanelGeo, frontPanelMat);
    frontPanel.position.set(0, 1.3, 11.7); frontPanel.castShadow = true; this.group.add(frontPanel);

    const inlayGeo = new THREE.BoxGeometry(28, 0.08, 0.08);
    const inlay = new THREE.Mesh(inlayGeo, this.matAccentGold);
    inlay.position.set(0, 1.9, 11.85); this.group.add(inlay);

    const footPositions = [[-14,0,-10.5],[14,0,-10.5],[-14,0,10.5],[14,0,10.5]];
    footPositions.forEach(pos => {
      const fg = new THREE.Group();
      const orGeo = new THREE.TorusGeometry(0.8, 0.15, 8, 24);
      const or2 = new THREE.Mesh(orGeo, this.matBrushedMetal);
      or2.rotation.x = -Math.PI/2; or2.position.y = 0.05; fg.add(or2);
      const coneGeo = new THREE.CylinderGeometry(0.7, 0.55, 0.4, 16);
      const cone = new THREE.Mesh(coneGeo, this.matBlackRubber);
      cone.position.y = -0.15; cone.castShadow = true; fg.add(cone);
      const capGeo = new THREE.SphereGeometry(0.25, 12, 8, 0, Math.PI*2, 0, Math.PI/2);
      const cap = new THREE.Mesh(capGeo, this.matChrome); cap.position.y = 0.12; fg.add(cap);
      const detGeo = new THREE.TorusGeometry(0.62, 0.02, 4, 24);
      const det = new THREE.Mesh(detGeo, this.matDarkMetal);
      det.rotation.x = -Math.PI/2; det.position.y = 0.06; fg.add(det);
      fg.position.set(...pos); this.group.add(fg);
    });

    for (let i = 0; i < 8; i++) {
      const slotGeo = new THREE.BoxGeometry(2, 0.08, 0.4);
      const slot = new THREE.Mesh(slotGeo, this.matDarkMetal);
      slot.position.set(-7 + i * 2, 1.3, -11.7); this.group.add(slot);
    }
  }
  buildPlatter() {
    const platterGroup = new THREE.Group();

    const mainGeo = new THREE.CylinderGeometry(8.2, 8.4, 0.7, 72);
    const platterMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.6, metalness: 0.3 });
    const mainDisc = new THREE.Mesh(mainGeo, platterMat);
    mainDisc.position.y = -0.1; mainDisc.castShadow = true; mainDisc.receiveShadow = true;
    platterGroup.add(mainDisc);

    const outerRingGeo = new THREE.TorusGeometry(8.35, 0.18, 8, 72);
    const outerRing = new THREE.Mesh(outerRingGeo, this.matChrome);
    outerRing.rotation.x = -Math.PI/2; outerRing.position.y = 0.18; platterGroup.add(outerRing);

    const innerRingGeo = new THREE.TorusGeometry(7.8, 0.08, 6, 72);
    const innerRing = new THREE.Mesh(innerRingGeo, this.matBrushedMetal);
    innerRing.rotation.x = -Math.PI/2; innerRing.position.y = 0.26; platterGroup.add(innerRing);

    for (let i = 0; i < 60; i++) {
      const angle = (i/60)*Math.PI*2;
      const dotGeo = new THREE.BoxGeometry(0.25, 0.02, 0.12);
      const dotMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.3, metalness: 0.7 });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.set(Math.cos(angle)*8.05, 0.27, Math.sin(angle)*8.05);
      dot.rotation.y = -angle; platterGroup.add(dot);
    }

    const matGeo = new THREE.CylinderGeometry(7.5, 7.5, 0.12, 72);
    const rubberMat = new THREE.Mesh(matGeo, this.matBlackRubber);
    rubberMat.position.y = 0.35; rubberMat.receiveShadow = true;
    platterGroup.add(rubberMat); this.platterTop = rubberMat;

    const grooveRadii = [1.5,2.4,3.2,3.9,4.5,5.0,5.5,5.9,6.3,6.6,6.9,7.15];
    grooveRadii.forEach(r => {
      const gGeo = new THREE.TorusGeometry(r, 0.018, 4, 64);
      const gMat = new THREE.MeshStandardMaterial({ color: 0x0c0c0c, roughness: 1.0, metalness: 0.0 });
      const g = new THREE.Mesh(gGeo, gMat);
      g.rotation.x = -Math.PI/2; g.position.y = 0.42; platterGroup.add(g);
    });

    const embossGeo = new THREE.RingGeometry(0.8, 1.0, 24);
    const embossMat = new THREE.MeshStandardMaterial({ color: 0x0e0e0e, roughness: 0.98, metalness: 0.0, side: THREE.DoubleSide });
    const emboss = new THREE.Mesh(embossGeo, embossMat);
    emboss.rotation.x = -Math.PI/2; emboss.position.set(5.5, 0.415, -5.5); platterGroup.add(emboss);

    const spindleBaseGeo = new THREE.CylinderGeometry(0.45, 0.5, 0.3, 16);
    const spindleBase = new THREE.Mesh(spindleBaseGeo, this.matChrome);
    spindleBase.position.y = 0.45; platterGroup.add(spindleBase);
    const spindleGeo = new THREE.CylinderGeometry(0.2, 0.22, 1.0, 12);
    const spindle = new THREE.Mesh(spindleGeo, this.matChrome);
    spindle.position.y = 0.95; spindle.castShadow = true; platterGroup.add(spindle);
    const spindleTopGeo = new THREE.SphereGeometry(0.22, 10, 8, 0, Math.PI*2, 0, Math.PI/2);
    const spindleTop = new THREE.Mesh(spindleTopGeo, this.matChrome);
    spindleTop.position.y = 1.45; platterGroup.add(spindleTop);

    const subGeo = new THREE.CylinderGeometry(3.0, 3.0, 0.2, 32);
    const subMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.4, metalness: 0.7 });
    const subPlatter = new THREE.Mesh(subGeo, subMat);
    subPlatter.position.y = -0.55; platterGroup.add(subPlatter);

    platterGroup.position.set(-4, 3.0, -1.5);
    this.platter = platterGroup; this.group.add(platterGroup);
  }
  buildTonearm() {
    const pivotGroup = new THREE.Group();

    const baseRingGeo = new THREE.CylinderGeometry(1.3, 1.4, 0.4, 24);
    const baseRing = new THREE.Mesh(baseRingGeo, this.matDarkMetal);
    baseRing.castShadow = true; pivotGroup.add(baseRing);

    const midHouseGeo = new THREE.CylinderGeometry(1.0, 1.2, 0.6, 24);
    const midHouse = new THREE.Mesh(midHouseGeo, this.matBrushedMetal);
    midHouse.position.y = 0.5; midHouse.castShadow = true; pivotGroup.add(midHouse);

    const accentRingGeo = new THREE.TorusGeometry(1.25, 0.05, 6, 32);
    const accentRing = new THREE.Mesh(accentRingGeo, this.matChrome);
    accentRing.rotation.x = -Math.PI/2; accentRing.position.y = 0.22; pivotGroup.add(accentRing);

    const postGeo = new THREE.CylinderGeometry(0.22, 0.28, 2.2, 12);
    const post = new THREE.Mesh(postGeo, this.matChrome);
    post.position.y = 1.9; post.castShadow = true; pivotGroup.add(post);

    const collarGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.2, 12);
    const collar = new THREE.Mesh(collarGeo, this.matBrushedMetal);
    collar.position.y = 3.1; pivotGroup.add(collar);

    const restGroup = new THREE.Group();
    const restPostGeo = new THREE.CylinderGeometry(0.15, 0.15, 1.6, 8);
    const restPost = new THREE.Mesh(restPostGeo, this.matChrome); restPost.position.y = 0.8; restGroup.add(restPost);
    const cradleGeo = new THREE.BoxGeometry(0.12, 0.6, 0.12);
    const cradleL = new THREE.Mesh(cradleGeo, this.matChrome); cradleL.position.set(-0.25,1.7,0); restGroup.add(cradleL);
    const cradleR = cradleL.clone(); cradleR.position.set(0.25,1.7,0); restGroup.add(cradleR);
    const cradleBaseGeo = new THREE.BoxGeometry(0.6, 0.12, 0.12);
    const cradleBase = new THREE.Mesh(cradleBaseGeo, this.matChrome); cradleBase.position.set(0,1.4,0); restGroup.add(cradleBase);
    const padGeo = new THREE.BoxGeometry(0.4, 0.08, 0.08);
    const padM = new THREE.Mesh(padGeo, this.matBlackRubber); padM.position.set(0,1.45,0); restGroup.add(padM);
    restGroup.position.set(1.8, 0, 0.3); pivotGroup.add(restGroup);

    const leverGroup = new THREE.Group();
    const leverBaseGeo = new THREE.CylinderGeometry(0.2,0.2,0.3,8);
    const leverBase = new THREE.Mesh(leverBaseGeo, this.matBrushedMetal); leverGroup.add(leverBase);
    const leverArmGeo = new THREE.BoxGeometry(0.12,0.12,0.9);
    const leverArm = new THREE.Mesh(leverArmGeo, this.matChrome); leverArm.position.set(0,0.15,0.4); leverGroup.add(leverArm);
    const leverKnobGeo = new THREE.SphereGeometry(0.15,8,8);
    const leverKnob = new THREE.Mesh(leverKnobGeo, this.matChrome); leverKnob.position.set(0,0.15,0.9); leverGroup.add(leverKnob);
    leverGroup.position.set(1.8, 1.2, -1.0); pivotGroup.add(leverGroup);

    const armAssembly = new THREE.Group();

    const armMat = this.matChrome;
    const mainArmGeo = new THREE.CylinderGeometry(0.1, 0.1, 10, 10);
    const mainArm = new THREE.Mesh(mainArmGeo, armMat);
    mainArm.rotation.z = Math.PI/2; mainArm.position.set(-4.0, 2.8, 0); mainArm.castShadow = true;
    armAssembly.add(mainArm);

    const frontArmGeo = new THREE.CylinderGeometry(0.1, 0.1, 4.2, 10);
    const frontArm = new THREE.Mesh(frontArmGeo, armMat);
    frontArm.rotation.z = Math.PI/2 - 0.12; frontArm.position.set(-11.0, 2.55, 0); frontArm.castShadow = true;
    armAssembly.add(frontArm);

    const jointGeo = new THREE.TorusGeometry(0.18, 0.06, 6, 16);
    const jointM = new THREE.Mesh(jointGeo, this.matBrushedMetal);
    jointM.rotation.y = Math.PI/2; jointM.position.set(-9.0, 2.7, 0); armAssembly.add(jointM);

    const headGroup = new THREE.Group();
    const headGeo = new THREE.BoxGeometry(2.2, 0.2, 0.9);
    const head = new THREE.Mesh(headGeo, this.matBrushedMetal); head.castShadow = true; headGroup.add(head);
    const liftGeo = new THREE.BoxGeometry(0.3, 0.4, 0.15);
    const liftM = new THREE.Mesh(liftGeo, this.matChrome); liftM.position.set(-1.1, 0.25, 0.35); headGroup.add(liftM);
    const hCollarGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.3, 8);
    const hCollar = new THREE.Mesh(hCollarGeo, this.matChrome);
    hCollar.rotation.z = Math.PI/2; hCollar.position.set(1.15, 0, 0); headGroup.add(hCollar);

    const cartGeo = new THREE.BoxGeometry(1.4, 0.55, 0.55);
    const cartMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.5, metalness: 0.3 });
    const cart = new THREE.Mesh(cartGeo, cartMat); cart.position.set(-0.3, -0.35, 0); headGroup.add(cart);

    const cartScrewGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.25, 6);
    [-0.4, 0.2].forEach(x => {
      const sc = new THREE.Mesh(cartScrewGeo, this.matChrome); sc.position.set(x, 0.1, 0); headGroup.add(sc);
    });

    const wireColors = [0xcc2222, 0x22cc22, 0x2222cc, 0xcccccc];
    wireColors.forEach((col, i) => {
      const wGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.6, 4);
      const wMat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.6, metalness: 0.2 });
      const w = new THREE.Mesh(wGeo, wMat);
      w.rotation.z = Math.PI/2; w.position.set(0.5, -0.15, -0.15 + i*0.1); headGroup.add(w);
    });

    const cantGeo = new THREE.CylinderGeometry(0.012, 0.02, 0.7, 4);
    const cantMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.15, metalness: 0.9 });
    const cant = new THREE.Mesh(cantGeo, cantMat);
    cant.rotation.z = 0.3; cant.position.set(-0.5, -0.85, 0); headGroup.add(cant);

    const needleGeo = new THREE.OctahedronGeometry(0.04, 0);
    const needleMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.0, metalness: 0.95, emissive: 0x444444, emissiveIntensity: 0.2 });
    const needleM = new THREE.Mesh(needleGeo, needleMat);
    needleM.position.set(-0.65, -1.15, 0); headGroup.add(needleM);

    headGroup.position.set(-13.2, 2.3, 0); armAssembly.add(headGroup);

    const cwGroup = new THREE.Group();
    const cwGeo = new THREE.CylinderGeometry(0.65, 0.65, 1.0, 20);
    const cwMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.35, metalness: 0.8 });
    const cwM = new THREE.Mesh(cwGeo, cwMat); cwM.rotation.z = Math.PI/2; cwM.castShadow = true; cwGroup.add(cwM);
    for (let i = 0; i < 12; i++) {
      const tGeo = new THREE.TorusGeometry(0.65, 0.015, 4, 20);
      const tMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.4, metalness: 0.7 });
      const tR = new THREE.Mesh(tGeo, tMat); tR.rotation.y = Math.PI/2; tR.position.set(-0.4+i*0.07, 0, 0); cwGroup.add(tR);
    }
    const cwCapGeo = new THREE.SphereGeometry(0.3, 10, 8);
    const cwCap = new THREE.Mesh(cwCapGeo, this.matChrome); cwCap.position.set(0.55, 0, 0); cwGroup.add(cwCap);
    cwGroup.position.set(2.5, 2.8, 0); armAssembly.add(cwGroup);

    const asGroup = new THREE.Group();
    const asPostGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.2, 6);
    const asPost = new THREE.Mesh(asPostGeo, this.matChrome); asPost.position.y = 0.6; asGroup.add(asPost);
    const asArmGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.0, 4);
    const asArm = new THREE.Mesh(asArmGeo, this.matChrome);
    asArm.rotation.z = Math.PI/2; asArm.position.set(-0.5, 1.2, 0); asGroup.add(asArm);
    const asWeightGeo = new THREE.SphereGeometry(0.15, 8, 8);
    const asWeight = new THREE.Mesh(asWeightGeo, this.matBrushedMetal); asWeight.position.set(-1.0, 1.2, 0); asGroup.add(asWeight);
    const threadGeo = new THREE.CylinderGeometry(0.01, 0.01, 1.8, 4);
    const threadMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.3, metalness: 0.5 });
    const thread = new THREE.Mesh(threadGeo, threadMat);
    thread.rotation.z = 0.5; thread.position.set(-0.1, 2.0, 0); asGroup.add(thread);
    asGroup.position.set(0.3, 0.8, 0.5); pivotGroup.add(asGroup);

    pivotGroup.add(armAssembly);
    this.tonearm = armAssembly;
    pivotGroup.position.set(10.5, 3.0, -6);
    this.tonearmPivot = pivotGroup;
    this.group.add(pivotGroup);
    this.tonearmAngle = this.tonearmRestAngle;
    armAssembly.rotation.y = this.tonearmRestAngle;
  }
  buildPowerButton() {
    const btnGroup = new THREE.Group();

    const housingGeo = new THREE.CylinderGeometry(0.85, 0.85, 0.3, 20);
    const housing = new THREE.Mesh(housingGeo, this.matDarkMetal); housing.castShadow = true; btnGroup.add(housing);

    const recessGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.15, 20);
    const recessMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.6, metalness: 0.4 });
    const recess = new THREE.Mesh(recessGeo, recessMat); recess.position.y = 0.18; btnGroup.add(recess);

    const btnGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.18, 20);
    const btn = new THREE.Mesh(btnGeo, this.matBrushedMetal);
    btn.position.y = 0.3; btn.castShadow = true;
    btn.userData.type = 'powerButton'; btn.userData.turntable = this;
    btnGroup.add(btn); this.powerButton = btn;

    const dimpleGeo = new THREE.SphereGeometry(0.2, 10, 10, 0, Math.PI*2, Math.PI/2, Math.PI/2);
    const dimpleMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.2, metalness: 0.8 });
    const dimple = new THREE.Mesh(dimpleGeo, dimpleMat);
    dimple.rotation.x = Math.PI; dimple.position.y = 0.39; btnGroup.add(dimple);

    const ledGeo = new THREE.TorusGeometry(0.65, 0.04, 6, 32);
    const ledMat = new THREE.MeshStandardMaterial({ color: 0x660000, emissive: 0x330000, emissiveIntensity: 0.5, roughness: 0.2, metalness: 0.5 });
    const led = new THREE.Mesh(ledGeo, ledMat);
    led.rotation.x = -Math.PI/2; led.position.y = 0.42; btnGroup.add(led);
    this.powerLed = led;

    btnGroup.position.set(10.0, 3.0, 8.5); this.group.add(btnGroup);
  }

  buildVolumeKnob() {
    const knobGroup = new THREE.Group();

    const basePlateGeo = new THREE.CylinderGeometry(1.3, 1.3, 0.12, 28);
    const basePlate = new THREE.Mesh(basePlateGeo, this.matDarkMetal);
    basePlate.position.y = -0.1; knobGroup.add(basePlate);

    const scaleRingGeo = new THREE.TorusGeometry(1.25, 0.03, 4, 32);
    const scaleRing = new THREE.Mesh(scaleRingGeo, this.matBrushedMetal);
    scaleRing.rotation.x = -Math.PI/2; scaleRing.position.y = -0.02; knobGroup.add(scaleRing);

    const rotatingPart = new THREE.Group(); rotatingPart.position.y = 0;

    const knobLowerGeo = new THREE.CylinderGeometry(1.0, 1.05, 0.3, 28);
    const knobLower = new THREE.Mesh(knobLowerGeo, this.matDarkMetal);
    knobLower.position.y = 0.2; rotatingPart.add(knobLower);

    const knobUpperGeo = new THREE.CylinderGeometry(0.85, 1.0, 0.5, 28);
    const knobUpper = new THREE.Mesh(knobUpperGeo, this.matDarkMetal);
    knobUpper.position.y = 0.55; knobUpper.castShadow = true;
    knobUpper.userData.type = 'volumeKnob'; knobUpper.userData.turntable = this;
    rotatingPart.add(knobUpper); this.volumeKnob = knobUpper;

    const topCapGeo = new THREE.CylinderGeometry(0.5, 0.85, 0.08, 28);
    const topCap = new THREE.Mesh(topCapGeo, this.matChrome);
    topCap.position.y = 0.82; rotatingPart.add(topCap);

    for (let i = 0; i < 30; i++) {
      const angle = (i/30)*Math.PI*2;
      const ridgeGeo = new THREE.BoxGeometry(0.04, 0.45, 0.1);
      const ridge = new THREE.Mesh(ridgeGeo, this.matDarkMetal);
      ridge.position.set(Math.cos(angle)*0.97, 0.45, Math.sin(angle)*0.97);
      ridge.rotation.y = -angle; rotatingPart.add(ridge);
    }

    const indicatorGeo = new THREE.BoxGeometry(0.08, 0.04, 0.35);
    const indicatorMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.4, emissive: 0x666666, emissiveIntensity: 0.2 });
    const indicator = new THREE.Mesh(indicatorGeo, indicatorMat);
    indicator.position.set(0, 0.86, -0.5); rotatingPart.add(indicator);
    this.volumeIndicator = indicator;

    knobGroup.add(rotatingPart); this.knobRotatingPart = rotatingPart;

    for (let i = 0; i < 11; i++) {
      const t = i/10;
      const angle = -Math.PI*0.75 + t*Math.PI*1.5;
      const size = 0.04 + t*0.03;
      const dotGeo = new THREE.SphereGeometry(size, 6, 6);
      const brightness = Math.floor(80 + t*100);
      const dotMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color('rgb(' + brightness + ', ' + brightness + ', ' + brightness + ')'), roughness: 0.3, metalness: 0.5
      });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.set(Math.sin(angle)*1.2, -0.02, -Math.cos(angle)*1.2);
      knobGroup.add(dot);
    }

    knobGroup.position.set(-10.0, 3.0, 8.5); this.group.add(knobGroup);
    this.setVolumeVisual(0.7);
  }
  buildSpeedSelector() {
    const switchGroup = new THREE.Group();
    const plateGeo = new THREE.BoxGeometry(2.0, 0.12, 1.0);
    const plate = new THREE.Mesh(plateGeo, this.matDarkMetal); switchGroup.add(plate);
    const trackGeo = new THREE.BoxGeometry(1.2, 0.08, 0.25);
    const trackMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.7, metalness: 0.3 });
    const track = new THREE.Mesh(trackGeo, trackMat); track.position.y = 0.08; switchGroup.add(track);
    const sliderGeo = new THREE.BoxGeometry(0.4, 0.2, 0.35);
    const slider = new THREE.Mesh(sliderGeo, this.matChrome);
    slider.position.set(-0.3, 0.17, 0); switchGroup.add(slider);
    const dot33Geo = new THREE.SphereGeometry(0.06, 6, 6);
    const dot33 = new THREE.Mesh(dot33Geo, this.matAccentGold); dot33.position.set(-0.5, 0.08, 0.4); switchGroup.add(dot33);
    const dot45 = new THREE.Mesh(dot33Geo.clone(), this.matBrushedMetal); dot45.position.set(0.5, 0.08, 0.4); switchGroup.add(dot45);
    switchGroup.position.set(5.0, 3.0, 8.5); this.group.add(switchGroup);
  }

  buildDetails() {
    const screwPositions = [[-15.0,2.72,-11.2],[15.0,2.72,-11.2],[-15.0,2.72,11.2],[15.0,2.72,11.2]];
    screwPositions.forEach(pos => {
      const sg = new THREE.Group();
      const hGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.08, 6);
      const h = new THREE.Mesh(hGeo, this.matBrushedMetal); sg.add(h);
      const hexGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.06, 6);
      const hexMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5, metalness: 0.7 });
      const hex = new THREE.Mesh(hexGeo, hexMat); hex.position.y = 0.05; sg.add(hex);
      sg.position.set(...pos); this.group.add(sg);
    });

    [[-8,2.72,11.2],[0,2.72,11.2],[8,2.72,11.2]].forEach(pos => {
      const sGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.06, 6);
      const s = new THREE.Mesh(sGeo, this.matBrushedMetal); s.position.set(...pos); this.group.add(s);
    });

    const badgeGroup = new THREE.Group();
    const badgeGeo = new THREE.BoxGeometry(3.5, 0.06, 0.7);
    const badge = new THREE.Mesh(badgeGeo, this.matAccentGold); badgeGroup.add(badge);
    const lineGeo = new THREE.BoxGeometry(3.0, 0.02, 0.04);
    const line1 = new THREE.Mesh(lineGeo, this.matCopperAccent); line1.position.set(0, 0.04, -0.2); badgeGroup.add(line1);
    const line2 = line1.clone(); line2.position.set(0, 0.04, 0.2); badgeGroup.add(line2);
    badgeGroup.position.set(0, 2.55, 11.84); this.group.add(badgeGroup);

    const sideInlayGeo = new THREE.BoxGeometry(0.05, 0.08, 20);
    [-15.85, 15.85].forEach(x => {
      const inlay = new THREE.Mesh(sideInlayGeo, this.matAccentGold);
      inlay.position.set(x, 1.9, 0); this.group.add(inlay);
    });

    const cornerGeo = new THREE.BoxGeometry(0.8, 2.2, 0.8);
    const cornerMat = new THREE.MeshStandardMaterial({ color: 0x0d0805, roughness: 0.4, metalness: 0.15 });
    [[-15.4,1.1,-11.4],[15.4,1.1,-11.4],[-15.4,1.1,11.4],[15.4,1.1,11.4]].forEach(pos => {
      const corner = new THREE.Mesh(cornerGeo, cornerMat);
      corner.position.set(...pos); corner.castShadow = true; this.group.add(corner);
    });

    const motorHousingGeo = new THREE.CylinderGeometry(1.2, 1.4, 0.3, 16);
    const motorHousing = new THREE.Mesh(motorHousingGeo, this.matDarkMetal);
    motorHousing.position.set(-4, 2.72, -1.5); this.group.add(motorHousing);

    const groundGroup = new THREE.Group();
    const gPostGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.5, 6);
    const gPost = new THREE.Mesh(gPostGeo, this.matAccentGold); gPost.position.y = 0.25; groundGroup.add(gPost);
    const gNutGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.12, 6);
    const gNut = new THREE.Mesh(gNutGeo, this.matAccentGold); gNut.position.y = 0.45; groundGroup.add(gNut);
    groundGroup.position.set(-12, 2.72, -10); this.group.add(groundGroup);
  }

  buildDustCoverHinges() {
    [-8, 8].forEach(x => {
      const hg = new THREE.Group();
      const barrelGeo = new THREE.CylinderGeometry(0.22, 0.22, 2.5, 10);
      const barrel = new THREE.Mesh(barrelGeo, this.matBrushedMetal);
      barrel.rotation.z = Math.PI/2; hg.add(barrel);
      const leafGeo = new THREE.BoxGeometry(0.6, 0.08, 0.8);
      const leaf1 = new THREE.Mesh(leafGeo, this.matBrushedMetal); leaf1.position.set(0,-0.15,0.5); hg.add(leaf1);
      const leaf2 = new THREE.Mesh(leafGeo, this.matBrushedMetal); leaf2.position.set(0,0.15,-0.5); hg.add(leaf2);
      [-1.3, 1.3].forEach(offset => {
        const capGeo = new THREE.SphereGeometry(0.24, 8, 8);
        const cap = new THREE.Mesh(capGeo, this.matChrome); cap.position.set(offset, 0, 0); hg.add(cap);
      });
      hg.position.set(x, 2.9, -11.5); this.group.add(hg);
    });
  }

  buildCableConnector() {
    const connectorGroup = new THREE.Group();
    const plateGeo = new THREE.BoxGeometry(4, 1.2, 0.2);
    const plateMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.4, metalness: 0.5 });
    const plate = new THREE.Mesh(plateGeo, plateMat); connectorGroup.add(plate);

    const jackColors = [0xcc2222, 0xeeeeee];
    jackColors.forEach((col, i) => {
      const jGroup = new THREE.Group();
      const ringGeo = new THREE.TorusGeometry(0.25, 0.05, 6, 16);
      const ringMat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.3, metalness: 0.5 });
      const ring = new THREE.Mesh(ringGeo, ringMat); ring.rotation.x = Math.PI/2; jGroup.add(ring);
      const pinGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.2, 8);
      const pin = new THREE.Mesh(pinGeo, this.matAccentGold);
      pin.rotation.x = Math.PI/2; pin.position.z = 0.05; jGroup.add(pin);
      const bodyGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.15, 12);
      const body = new THREE.Mesh(bodyGeo, this.matDarkMetal);
      body.rotation.x = Math.PI/2; body.position.z = -0.08; jGroup.add(body);
      jGroup.position.set(-0.8 + i*1.6, 0, 0.1); connectorGroup.add(jGroup);
    });

    const gTermGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.25, 6);
    const gTerm = new THREE.Mesh(gTermGeo, this.matAccentGold);
    gTerm.rotation.x = Math.PI/2; gTerm.position.set(1.5, -0.3, 0.12); connectorGroup.add(gTerm);

    connectorGroup.position.set(8, 1.5, -11.85); this.group.add(connectorGroup);
  }

  setVolumeVisual(t) {
    const angle = -Math.PI * 0.75 + t * Math.PI * 1.5;
    this.volumeAngle = angle;
    if (this.knobRotatingPart) this.knobRotatingPart.rotation.y = angle;
  }

  setPowerState(on) {
    this.isPowered = on;
    if (on) {
      this.powerLed.material.color.setHex(0x00cc44);
      this.powerLed.material.emissive.setHex(0x00ff44);
      this.powerLed.material.emissiveIntensity = 1.5;
      this.targetSpinSpeed = 2.0;
      this.tonearmTargetAngle = this.tonearmPlayAngle;
    } else {
      this.powerLed.material.color.setHex(0x660000);
      this.powerLed.material.emissive.setHex(0x330000);
      this.powerLed.material.emissiveIntensity = 0.5;
      this.targetSpinSpeed = 0;
      this.tonearmTargetAngle = this.tonearmRestAngle;
    }
  }

  update(delta) {
    if (this.spinSpeed < this.targetSpinSpeed) {
      this.spinSpeed = Math.min(this.spinSpeed + delta * 1.2, this.targetSpinSpeed);
    } else if (this.spinSpeed > this.targetSpinSpeed) {
      this.spinSpeed = Math.max(this.spinSpeed - delta * 0.6, this.targetSpinSpeed);
    }
    if (this.platter && this.spinSpeed > 0.001) {
      this.platter.rotation.y += this.spinSpeed * delta;
      if (this.mountedVinyl) {
        this.mountedVinyl.position.y = 0.65 + Math.sin(this.platter.rotation.y * 3) * 0.015;
      }
    }
    if (this.tonearm) {
      const diff = this.tonearmTargetAngle - this.tonearmAngle;
      if (Math.abs(diff) > 0.001) {
        this.tonearmAngle += diff * delta * 2.5;
        this.tonearm.rotation.y = this.tonearmAngle;
      }
    }
  }

  getPlatterWorldPos() {
    const pos = new THREE.Vector3();
    this.platter.getWorldPosition(pos);
    return pos;
  }
}