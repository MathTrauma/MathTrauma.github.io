import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { createP5Sine } from './p5_sine.js';

let _texture;

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
    this.sceneGroups = [];

    this.clock = new THREE.Clock();
    this.controls = null;

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
    
    // 3-1. Controls 
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = false;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 30;
    this.controls.maxPolarAngle = Math.PI / 2;

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
    this.renderer.domElement.addEventListener('mousemove', this.onMouseMove);
    this.renderer.domElement.addEventListener('click', this.onClick);

    // 8. Loop
    this.animate();
  }

  createObjects() {
    const configs = [
      { 
        id: 'problems', type: 'problem', position: [4, 0, -3], 
        url: 'https://www.mathtrauma.com/Problem-Bank/', 
        label: 'Problems' 
      },
      { 
        id: 'tools', type: 'tool', position: [0, 3, 2], 
        url: 'https://www.mathtrauma.com/CompositeFunction/', 
        label: 'Tools' 
      },
      { 
        id: 'math', type: 'math', position: [-4, 1, 4], 
        url: 'https://www.youtube.com/watch?v=fvxhiLpHVNU&list=PLL_VLIbQsOXWaKAuanhl6bRs_pGeV-v4T', 
        label: 'Math' 
      },
      { 
        id: 'computer', type: 'computer', position: [-1.5, 0, 5], 
        url: 'https://github.com/', 
        label: 'Computer' 
      },
      { 
        id: 'game', type: 'game', position: [1.5, 0, 3], 
        url: 'https://www.mathtrauma.com/PrimeShooter/', 
        label: 'Game' 
      },
      { 
        id: 'youtube', type: 'youtube', position: [6, 0, -1], 
        url: 'https://www.youtube.com/@mathtrauma/videos', 
        label: 'YouTube' 
      },
      {
        id: 'board', type: 'board', position: [-4, 2, -2],
        url: 'https://www.mathtrauma.com/start',
        label: 'start'
      },
    ];

    configs.forEach(config => {
      const meshGroup = this.generateVoxelMesh(config.type);

      if(config.type === 'board') return;

      meshGroup.position.set(...config.position);

      this.interactiveObjects.push({
        mesh: meshGroup,
        config: config
      });

      this.scene.add(meshGroup);
    });

    this.sceneGroups = this.interactiveObjects.map(obj => obj.mesh);
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
    if (type === 'board') {
      const geometry = new THREE.BoxGeometry(2,2,2);

      const p5Container = document.createElement('div');
      p5Container.style.display = 'none';
      document.body.appendChild(p5Container);

      createP5Sine(p5Container, (canvas) => {
        _texture = new THREE.CanvasTexture(canvas);
        _texture.colorSpace = THREE.SRGBColorSpace;

        const material = new THREE.MeshBasicMaterial({ map: _texture });
        const mesh = new THREE.Mesh(
          new THREE.PlaneGeometry(2.5, 1.25),
          material
        );

        scene.add(mesh);
      });


      // const p5Instance = createP5Sine(p5Container);
      // const p5Canvas = p5Instance.canvas;

      // _texture = new THREE.CanvasTexture(p5Canvas);
      // _texture.colorSpace = THREE.SRGBColorSpace;

      // const material = new THREE.MeshBasicMaterial({
      //   map: _texture,
      //   transparent: true
      // });

      // return new THREE.Mesh(geometry, material);
    }


    const group = new THREE.Group();
    let voxels = [];
    let baseColor = '#ffffff';

    if (type === 'problem') {
      baseColor = '#eb82f6';
      for (let y = -2; y <= 2; y++) voxels.push({ x: 0, y: y + 5, z: -2 });
      for (let x = -2; x <= 2; x++) voxels.push({ x, y: 5, z: -2 });
    }

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
      baseColor = '#64748b';
      const handleColor = '#475569';

      for (let x = -2; x <= 2; x++) {
        voxels.push({ x, y: 5, z: 0, color: baseColor });
      }
      
      voxels.push({ x: -1, y: 4, z: 0, color: baseColor });
      voxels.push({ x: 1, y: 4, z: 0, color: baseColor });
      
      voxels.push({ x: 0, y: 4, z: 0, color: handleColor });
      voxels.push({ x: 0, y: 3, z: 0, color: handleColor });
      
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

    //const sceneGroups = this.interactiveObjects.map(obj => obj.mesh);
    //const intersects = this.raycaster.intersectObjects(sceneGroups, true);

    const intersects = this.raycaster.intersectObjects(this.sceneGroups, true);
    if (intersects.length > 0) {
      let current = intersects[0].object;

      while (current && current.parent !== this.scene) {
        current = current.parent;
      }

      const found = this.interactiveObjects.find(obj => obj.mesh === current);
      if (found) {
        window.open(found.config.url, '_self');
      }
    }
  }

  animate() {
    this.animationId = requestAnimationFrame(this.animate.bind(this));
    this.controls.update();
    const time = this.clock.getElapsedTime();

    this.raycaster.setFromCamera(this.mouse, this.camera);
    // const sceneGroups = this.interactiveObjects.map(obj => obj.mesh);
    // const intersects = this.raycaster.intersectObjects(sceneGroups, true);
    
    const intersects = this.raycaster.intersectObjects(this.sceneGroups, true);
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

    if(_texture) _texture.needsUpdate = true;

    this.renderer.render(this.scene, this.camera);
  }

  cleanup() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }

    if (this.controls) {
      this.controls.dispose();
    }

    window.removeEventListener('resize', this.onWindowResize);
    this.renderer.domElement.removeEventListener('mousemove', this.onMouseMove);
    this.renderer.domElement.removeEventListener('click', this.onClick);

    this.container.removeChild(this.renderer.domElement);
    this.renderer.dispose();
  }
}