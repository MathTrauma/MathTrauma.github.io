import * as THREE from 'three';

export class VoxelWorld {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000 );
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.animationId = null;
    this.interactiveObjects = [];
    this.clock = new THREE.Clock();

    // 바인딩 안정화
    this.onWindowResize = this.onWindowResize.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onClick = this.onClick.bind(this);

    this.init();
  }

  init() {
    // 1. Renderer
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // 2. Scene
    this.scene.background = new THREE.Color('#111827');
    this.scene.fog = new THREE.Fog('#a1b8b7', 10, 50);

    // 3. Camera
    this.camera.position.set(0, 5, 15);
    this.camera.lookAt(0, 0, 0);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    this.scene.add(dirLight);

    // 5. Grid
    const gridHelper = new THREE.GridHelper(50, 50, 0x444444, 0x222222);
    this.scene.add(gridHelper);

    // 6. Objects
    this.createObjects();

    // 7. Events
    window.addEventListener('resize', this.onWindowResize);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('click', this.onClick);

    // 8. Loop
    this.animate();
  }

  createObjects() {
    const configs = [
      { id: 'problems', type: 'problem', position: [4, 0, -3], url: 'https://www.youtube.com/', label: 'Problems' },
      { id: 'tools', type: 'tool', position: [0, 2, 2], url: 'https://www.mathtrauma.com/CompositeFunction/', label: 'Tools' },
      { id: 'math', type: 'math', position: [-4, 0, -3], url: 'https://www.wolframalpha.com/', label: 'Math' },
      { id: 'computer', type: 'computer', position: [-1.5, 0, -2], url: 'https://github.com/', label: 'Computer' },
      { id: 'game', type: 'game', position: [1.5, 0, 2], url: 'https://store.steampowered.com/', label: 'Game' },
      { id: 'youtube', type: 'youtube', position: [4, 0, -1], url: 'https://www.youtube.com/', label: 'YouTube' },
    ];

    configs.forEach(config => {
      const meshGroup = this.generateVoxelMesh(config.type);
      meshGroup.position.set(...config.position);

      this.interactiveObjects.push({
        mesh: meshGroup,
        config: config
      });

      this.scene.add(meshGroup);
    });
  }

  createVoxel(x, y, z, color, size = 0.25) {
    const geometry = new THREE.BoxGeometry(size, size, size);
    const material = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.5,
      metalness: 0.1
    });

    const voxel = new THREE.Mesh(geometry, material);
    voxel.position.set(x * size, y * size, z * size);
    voxel.castShadow = true;
    voxel.receiveShadow = true;
    return voxel;
  }

  generateVoxelMesh(type) {
    const group = new THREE.Group();
    let voxels = [];
    let baseColor = '#ffffff';

    if (type === 'math') {
      baseColor = '#3b82f6';
      for (let y = -2; y <= 2; y++) voxels.push({ x: 0, y: y + 3, z: 0 });
      for (let x = -2; x <= 2; x++) voxels.push({ x, y: 3, z: 0 });
    }

    if (type === 'computer') {
      baseColor = '#9ca3af';
      const screenColor = '#60a5fa';

      for (let x = -3; x <= 3; x++) {
        for (let y = 0; y <= 4; y++) {
          const isScreen = x > -3 && x < 3 && y > 0 && y < 4;
          voxels.push({
            x,
            y: y + 1,
            z: 0,
            color: isScreen ? screenColor : baseColor
          });
        }
      }

      voxels.push({ x: 0, y: 0, z: 0 });
      voxels.push({ x: 0, y: 1, z: 0 });
      voxels.push({ x: -1, y: 0, z: 0 });
      voxels.push({ x: 1, y: 0, z: 0 });
    }

    if (type === 'game') {
      baseColor = '#22c55e';
      const invader = [
        '  X   X  ',
        '   X X   ',
        '  XXXXX  ',
        ' XX X XX ',
        'XXXXXXXXX',
        'X XXXXX X',
        'X X   X X',
        '  XX XX  '
      ];

      for (let y = 0; y < invader.length; y++) {
        const row = invader[invader.length - 1 - y];
        for (let x = 0; x < row.length; x++) {
          if (row[x] === 'X') {
            voxels.push({ x: x - 4, y: y + 1, z: 0 });
          }
        }
      }
    }

    if (type === 'youtube') {
      baseColor = '#ef4444';
      const playColor = '#ffffff';

      for (let x = -3; x <= 3; x++) {
        for (let y = 0; y <= 4; y++) {
          let color = baseColor;
          if (x >= -1 && x <= 1 && y >= 1 && y <= 3) {
            if (x === -1 || (x === 0 && y >= 1.5 && y <= 2.5)) {
              color = playColor;
            }
          }
          voxels.push({ x, y: y + 1, z: 0, color });
        }
      }
    }

    if (type === 'tool') {
      baseColor = '#64748b'; // 회색 금속 느낌
      const handleColor = '#475569'; // 어두운 회색

      // 렌치 헤드 (상단 조절 부분)
      for (let x = -2; x <= 2; x++) {
        voxels.push({ x, y: 5, z: 0, color: baseColor });
      }
      
      // 렌치 헤드 개구부
      voxels.push({ x: -1, y: 4, z: 0, color: baseColor });
      voxels.push({ x: 1, y: 4, z: 0, color: baseColor });
      
      // 렌치 목 부분
      voxels.push({ x: 0, y: 4, z: 0, color: handleColor });
      voxels.push({ x: 0, y: 3, z: 0, color: handleColor });
      
      // 렌치 손잡이
      for (let y = 1; y <= 2; y++) {
        for (let x = -1; x <= 1; x++) {
          voxels.push({ x, y, z: 0, color: handleColor });
        }
      }
    }

    voxels.forEach(v => {
      const voxel = this.createVoxel(v.x, v.y, v.z, v.color || baseColor);
      group.add(voxel);
    });

    return group;
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  onMouseMove(event) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }

  onClick() {
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const sceneGroups = this.interactiveObjects.map(obj => obj.mesh);
    const intersects = this.raycaster.intersectObjects(sceneGroups, true);

    if (intersects.length > 0) {
      let current = intersects[0].object;

      while (current && current.parent !== this.scene) {
        current = current.parent;
      }

      const found = this.interactiveObjects.find(obj => obj.mesh === current);
      if (found) {
        window.open(found.config.url, '_blank');
      }
    }
  }

  animate() {
    this.animationId = requestAnimationFrame(this.animate.bind(this));
    const time = this.clock.getElapsedTime();

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const sceneGroups = this.interactiveObjects.map(obj => obj.mesh);
    const intersects = this.raycaster.intersectObjects(sceneGroups, true);

    this.container.style.cursor = intersects.length > 0 ? 'pointer' : 'default';

    this.interactiveObjects.forEach((obj, index) => {
      obj.mesh.position.y = obj.config.position[1] + Math.sin(time * 2 + index) * 0.2;
      obj.mesh.rotation.y = Math.sin(time * 0.5 + index) * 0.3;

      let isHovered = false;
      if (intersects.length > 0) {
        let current = intersects[0].object;
        while (current && current.parent !== this.scene) {
          current = current.parent;
        }
        if (current === obj.mesh) isHovered = true;
      }

      if (isHovered) {
        obj.mesh.scale.setScalar(1.2);
      } else {
        obj.mesh.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
      }
    });

    this.renderer.render(this.scene, this.camera);
  }

  cleanup() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }

    window.removeEventListener('resize', this.onWindowResize);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('click', this.onClick);

    this.container.removeChild(this.renderer.domElement);
    this.renderer.dispose();
  }
}
